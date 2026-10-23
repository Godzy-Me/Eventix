# BookMyScreen – setup & deployment guide

```
bms-backend/    Node + Express + TypeScript + Socket.IO + Redis + Mongo
bms-frontend/   src/ (replace your src/) + Dockerfile + nginx.conf
docker-compose.yml
```

## What was added (videos #23 – #30)
| Video | What it is | Where |
|---|---|---|
| 23 Auth | OTP sign-in wired to the API, `/auth/refresh` with token rotation, axios refresh interceptor, logout, session restore | `modules/auth`, `apis/axiosWrapper.js`, `components/auth/*`, `context/AuthContext.jsx` |
| 24 Seat selection | Live seat grid: available / selected / booked / "being booked by someone" | `pages/SeatLayout.jsx` |
| 25 Redis + Socket setup | ioredis client, Socket.IO on the same HTTP server, cookie-authenticated sockets | `config/redis.ts`, `socket/index.ts`, `lib/socket.js` |
| 26 Seat locking | Atomic Lua locks in Redis (TTL 300s), events `join-show, lock-seats, locked-seats-initial, seat-locked, seat-unlocked, seat-lock-failed, seat-booked`, countdown on checkout | `modules/seat-lock`, `pages/Checkout.jsx` |
| 27 Payment | Razorpay (test mode) order -> Checkout -> signature verification, webhook, auto-refund; built-in mock gateway when no keys | `modules/payment`, `lib/razorpay.js` |
| 28 Booking | Booking + Payment collections, atomic seat booking, confirmation page, "Your Orders" | `modules/booking`, `pages/BookingConfirmation.jsx`, `BookingHistory.jsx` |
| 29 Docker | Dockerfiles, nginx reverse proxy, compose (Mongo + Redis) | root + both folders |
| 30 AWS | EC2 guide below | – |

Changes to your existing code you should know about:
- **Error handler** now respects `http-errors` status codes (before, "Invalid OTP" returned 500).
- **Security fixes**: `POST /shows|movies|theaters`, `PUT /shows/:id` (manual seat status) and `GET/POST /users` are now **admin only**; `PUT /users/activate/:id` only works on your own account and only accepts `name` + `phone` (it used to copy the whole body → anyone could make themselves admin).
- `"start"` script was `node dist/server.ts` → `node dist/server.js`. Removed the junk `crypto` npm package.
- Access token default 15m / refresh 7d (cookie lifetimes now match; before the refresh cookie died after 1h). For the video's demo set `ACCESS_TOKEN_EXPIRES_IN=1m`, `ACCESS_COOKIE_MAX_AGE_MS=60000`.
- Frontend: one `AuthProvider` (it was nested 3×), `<Toaster/>` added, sign-in modal is global, `SeatLayout` no longer imports `useLocation` from the wrong place.

## 1. Run locally

Requirements: Node 20+, MongoDB, Redis (`docker run -d -p 6379:6379 redis:7-alpine` is the easiest), and optionally a Mongo (`docker run -d -p 27017:27017 mongo:7`) or Atlas.

**Backend**
```bash
cd bms-backend
npm install
cp .env.example .env      # then fill it in (see below)
npm run seed:theaters && npm run seed:movies   # only if your DB is empty
npm run seed:shows        # IMPORTANT: re-run it – shows are only bookable if they haven't started
npm run dev
```
**Frontend**
```bash
cd bms-frontend            # your existing project folder
# replace its src/ with the provided src/ ; copy Dockerfile, nginx.conf, .dockerignore if you want Docker
npm install socket.io-client      # the only new dependency
# .env  ->  VITE_BACKEND_URL=http://localhost:9000/api/v1
npm run dev
```

### Env values you must fill (`bms-backend/.env`)
| Key | Where to get it |
|---|---|
| `MONGO_CONNECTION_STRING`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `HASH_SECRET`, `EMAIL_USERNAME`, `EMAIL_PASSWORD` | you already have these (secrets: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `REDIS_URL` | `redis://localhost:6379` locally. Free hosted option: Upstash → `rediss://default:<pw>@<host>:6379` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | razorpay.com → sign up → toggle **Test Mode** → Account & Settings → **API Keys → Generate Test Key**. Free, no KYC, no real money. |
| `RAZORPAY_WEBHOOK_SECRET` (optional) | Dashboard → Webhooks → add `https://<your-domain>/api/v1/payments/webhook`, events `payment.captured`, `payment.failed`, choose any secret and paste it here. Needs a public URL, so skip it locally. |
| `FRONTEND_URL` | `http://localhost:5173` locally |

**No Razorpay keys?** Leave them empty: the backend uses a **mock gateway** and Checkout shows a "simulate payment" dialog – the entire flow (lock → pay → verify → booking) still runs. Mock is disabled in production unless `ALLOW_MOCK_PAYMENTS=true`. For the interview, use real Razorpay test keys. Test card: `4111 1111 1111 1111`, any future expiry, any CVV, OTP `1234`; UPI test id `success@razorpay`.

### Try it
1. Sign in with email OTP in two different browsers (or one normal + one incognito) as two users.
2. Open the same show, pick seats in browser A and press **Proceed** → browser B instantly sees them turn yellow ("being booked").
3. Pay in A → they become × (sold) in B. Let the 5-min timer run out instead → they free up in B within ~5s.
4. "Your Orders" in the profile shows the booking.

Make yourself admin (to use the protected create endpoints): `npm run make-admin -- you@email.com`.

Tests: `npm run test:locks` (needs Redis) – covers atomic locking, races, TTL, socket events.

## 2. Docker (one command)
```bash
# from this folder
cp bms-backend/.env.example bms-backend/.env   # fill secrets, email, razorpay keys
docker compose up -d --build
docker compose exec backend npm run seed:all:prod    # seed theaters, movies, shows
```
App: http://localhost. nginx serves React and proxies `/api` and `/socket.io` to the backend, so everything is same-origin (no CORS or cookie problems). To use Atlas instead of the Mongo container, create a root `.env` with `MONGO_CONNECTION_STRING=mongodb+srv://...`.

## 3. Deploy on AWS (EC2 free tier)
1. EC2 → Launch **Ubuntu 24.04**, `t3.micro`/`t2.micro` (free-tier), 20 GB disk. Security group: allow **22** (your IP), **80**, **443**.
2. SSH in, install Docker: `curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker $USER` (re-login).
3. Get the code onto the box (`git clone` your repo), create `bms-backend/.env` with production values (`FRONTEND_URL=http://<EC2-public-IP>`; real Razorpay keys; strong secrets).
4. `docker compose up -d --build`, then the seed command above. Open `http://<EC2-public-IP>`.
5. **HTTPS (recommended, and required for Razorpay live mode):** point a domain (a free DuckDNS subdomain works) at the instance's Elastic IP and put Caddy in front (automatic certificates), or terminate TLS on an ALB/CloudFront. Then set `COOKIE_SECURE=true` in the root `.env` and `FRONTEND_URL=https://your.domain`. Razorpay test mode works over plain HTTP, but the webhook needs a public URL.
6. 1 GB RAM is tight for building images: add swap (`sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`) or build locally and push to ECR/Docker Hub.
7. Stop it when not needed to avoid charges beyond the free tier.

## Honest limitations
- I could not run MongoDB, Razorpay or AWS in my sandbox. Verified: TypeScript build, frontend production build + lint, and the integration test against real Redis + Socket.IO (atomic locks, 25-way race → one winner, TTL expiry, events). The atomic booking query was checked with a JS Mongo-semantics engine, not a live Mongo. Please run the flow once end-to-end and tell me if anything misbehaves.
- Locks are released by TTL, explicit unlock, or booking – not on disconnect (on purpose, so a hold survives the move to checkout).
- Refunds are automatic only in the rare "paid but seats already taken" case; no user-facing cancellation (the checkout page says non-refundable).
