# 🎬 Eventix

A full-stack movie ticket booking platform inspired by BookMyShow and District, with **real-time seat locking**, **OTP authentication** and **Razorpay payments**.

> Two users can never pay for the same seat: seats are held atomically in Redis, broadcast live to everyone watching the show over Socket.IO, and finally booked with an all-or-nothing database update.

---

## ✨ Features

- **Passwordless login** – 4-digit email OTP (hashed + expiring), new-user onboarding (name + phone)
- **Secure sessions** – JWT access + refresh tokens in `httpOnly` cookies, refresh-token **rotation** with reuse detection, silent refresh through an Axios interceptor
- **Browse & discover** – movies, recommendations, theatres and showtimes by date and location
- **Live seat selection** – seats update in real time for every viewer: *available / selected / being booked by someone else / sold*
- **Seat locking** – atomic Redis locks with a 5-minute TTL, countdown on checkout, automatic release on expiry
- **Payments** – Razorpay (test mode) with server-side price calculation, signature verification, webhook support and automatic refund if seats are lost mid-payment
- **Bookings** – confirmation page with booking ID, order history in the profile
- **Hardened API** – Zod validation, rate-limited OTP endpoints, Helmet, role-based admin routes, regex-injection-safe search
- **Containerised** – Dockerfiles, nginx reverse proxy and a one-command `docker compose` stack

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, TanStack Query, Axios, Socket.IO client, react-hot-toast |
| Backend | Node.js, Express 5, TypeScript, Socket.IO, Zod |
| Databases | **MongoDB** (users, movies, theatres, shows, bookings, payments) · **Redis** (real-time seat locks) |
| Auth | JWT (access + refresh), OTP via Nodemailer / Mailgen |
| Payments | Razorpay (test mode) |
| DevOps | Docker, Docker Compose, nginx, AWS EC2 |

## 🏗️ Architecture

```
            ┌──────────────┐  /api, /socket.io   ┌────────────────────────────┐
 Browser ──▶│ nginx + React│────────────────────▶│ Node.js backend            │
            └──────────────┘                     │  ├─ Express (REST API)     │
                                                 │  └─ Socket.IO (live seats) │
                                                 └───────┬──────────────┬─────┘
                                                         │              │
                                                   ┌─────▼────┐   ┌─────▼────┐
                                                   │ MongoDB  │   │  Redis   │
                                                   │ source of│   │ seat locks│
                                                   │  truth   │   │ (TTL)    │
                                                   └──────────┘   └──────────┘
```

**Why a hybrid database?**
MongoDB stores durable data (users, movies, shows, bookings, payments). Redis handles the one thing that must be fast and expire on its own: seat locks.

**Backend request lifecycle:** `Route → Validation → Controller → Service → Model → Database`, with a global error handler for everything that fails along the way. Each feature is its own module (`auth`, `user`, `movie`, `theater`, `show`, `seat-lock`, `booking`, `payment`).

### Booking flow

1. User opens a show → joins the show's Socket.IO room → receives currently locked seats.
2. User picks seats and presses **Proceed** → server atomically locks *all* of them in Redis (or none, if any is taken) and notifies everyone else.
3. Checkout page starts a countdown. The server re-validates seats, lock ownership and show time, **recomputes the price from the database** (never trusts the client) and creates a Razorpay order.
4. After payment, Razorpay returns a signature; the server verifies it (HMAC-SHA256), then flips the seats to `BOOKED` in a single atomic MongoDB update, confirms the booking, releases the locks and broadcasts `seat-booked`.
5. If the seats were somehow taken while paying, the payment is refunded automatically.

### Real-time events

| Direction | Event | Purpose |
|---|---|---|
| client → server | `join-show` / `leave-show` | enter / leave a show's room |
| client → server | `lock-seats` | hold the selected seats |
| client → server | `unlock-seats` | release your held seats |
| server → client | `locked-seats-initial` | current locks (also re-synced every 5 s so expired holds free up) |
| server → client | `seat-locked` / `seat-unlocked` | someone held / released seats |
| server → client | `seat-lock-failed` | your lock attempt conflicted |
| server → client | `seat-booked` | seats were sold |

### Data model

`User` · `Movie` · `Theater` · `Show` (embeds the seat layout) · `Booking` · `Payment` · `RefreshToken`

## 📁 Project Structure

```
bookmyscreen/
├── bms-backend/
│   └── src/
│       ├── config/          # env config, MongoDB, Redis
│       ├── middlewares/     # auth, admin guard, validation, error handler
│       ├── modules/
│       │   ├── auth/        # OTP, tokens, refresh rotation
│       │   ├── user/  movie/  theater/  show/
│       │   ├── seat-lock/   # atomic Redis (Lua) locking
│       │   ├── booking/     # bookings + order history
│       │   └── payment/     # Razorpay gateway, verify, webhook, refunds
│       ├── socket/          # Socket.IO server
│       ├── scripts/         # seeders, make-admin
│       └── tests/           # seat-locking integration test
├── bms-frontend/
│   └── src/
│       ├── apis/            # Axios instance + refresh interceptor + endpoints
│       ├── components/  context/  hooks/  lib/  pages/
│       └── utils/
└── docker-compose.yml
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas) and Redis (local or Upstash)
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) (for OTP emails)
- A [Razorpay](https://razorpay.com) account in **Test Mode** (free, no KYC)

### 1. Backend

```bash
cd bms-backend
npm install
cp .env.example .env        # fill in the values below
npm run seed:theaters
npm run seed:movies
npm run seed:shows          # generates shows for the next 7 days – re-run when they run out
npm run dev                 # http://localhost:9000
```

### 2. Frontend

```bash
cd bms-frontend
npm install
echo "VITE_BACKEND_URL=http://localhost:9000/api/v1" > .env
npm run dev                 # http://localhost:5173
```

### Environment variables (`bms-backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | API port (default `9000`) |
| `FRONTEND_URL` | Allowed origin(s), comma separated (CORS + Socket.IO) |
| `MONGO_CONNECTION_STRING` | MongoDB / Atlas connection string |
| `REDIS_URL` | e.g. `redis://localhost:6379` |
| `SEAT_LOCK_TTL_SECONDS` | Seat hold duration (default `300`) |
| `ACCESS_TOKEN_SECRET` · `REFRESH_TOKEN_SECRET` · `HASH_SECRET` | Long random strings |
| `ACCESS_TOKEN_EXPIRES_IN` · `REFRESH_TOKEN_EXPIRES_IN` | Default `15m` / `7d` |
| `COOKIE_SAMESITE` · `COOKIE_SECURE` | `lax`/`false` locally; `none`/`true` for cross-site HTTPS |
| `EMAIL_USERNAME` · `EMAIL_PASSWORD` | Gmail address + app password |
| `RAZORPAY_KEY_ID` · `RAZORPAY_KEY_SECRET` | Razorpay **test** keys (leave empty to use the built-in mock gateway) |
| `RAZORPAY_WEBHOOK_SECRET` | Optional, only if you configure the webhook |

Generate secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Razorpay test credentials

| Method | Value |
|---|---|
| Card | `4111 1111 1111 1111`, any future expiry, any CVV, OTP `1234` |
| UPI | `success@razorpay` |

### Try the real-time locking

Sign in as two different users (normal + incognito window), open the same show, select seats in the first window and press **Proceed**. They turn yellow in the second window instantly, and become sold the moment payment succeeds. Let the timer expire instead and they free up again.

### Admin access

Admin-only endpoints (creating movies, theatres and shows) require the `admin` role:
```bash
npm run make-admin -- you@example.com     # sign in once first so the user exists
```

## 🧪 Tests

```bash
cd bms-backend
npm run test:locks        # requires a running Redis
```

Covers atomic locking, concurrent races (25 users, one winner), TTL expiry, ownership-checked unlocking, socket events and payment signature verification.

## 🐳 Docker

```bash
cp bms-backend/.env.example bms-backend/.env      # fill in secrets
docker compose up -d --build
docker compose exec backend npm run seed:all:prod
```

The app is served on **http://localhost**. nginx serves the React build and proxies `/api` and `/socket.io` to the backend, so everything is same-origin.

## ☁️ Deployment (AWS EC2)

1. Launch an Ubuntu EC2 instance (free-tier `t3.micro`) and open ports 22, 80 and 443.
2. Install Docker, clone the repo and create `bms-backend/.env` with production values.
3. `docker compose up -d --build`, then seed the database.
4. For HTTPS, point a domain at the instance and put Caddy / an ALB in front, then set `COOKIE_SECURE=true` and `FRONTEND_URL=https://your.domain`.

## 🔌 API Overview

All routes are prefixed with `/api/v1`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/send-otp` · `POST /auth/verify-otp` · `POST /auth/refresh` · `POST /auth/logout` |
| Users | `GET /users/me` · `PUT /users/activate/:id` |
| Movies | `GET /movies` · `GET /movies/recommended` · `GET /movies/:id` |
| Shows | `GET /shows?movieId&state&date` · `GET /shows/:id` |
| Bookings | `GET /bookings/my` · `GET /bookings/:id` · `GET /bookings/locks/:showId` |
| Payments | `POST /payments/create-order` · `POST /payments/verify` · `POST /payments/failed` · `POST /payments/cancel` · `POST /payments/webhook` |

## 🔒 Security Notes

- Prices are always computed server-side from the database
- Payment signatures verified with HMAC-SHA256 using constant-time comparison; webhooks verified over the raw body
- Refresh tokens are rotated; reuse of an old token revokes all sessions of that user
- OTP endpoints are rate limited; OTPs are hashed with an HMAC and expire in 2 minutes
- Mass-assignment protection on profile updates; admin-only routes for catalogue management

## 🛣️ Roadmap

- Admin dashboard for movies, shows and seat management
- User-initiated cancellations and refunds
- Email/SMS ticket delivery with QR code
- Cloudinary-backed poster uploads


## 📄 License

ISC
