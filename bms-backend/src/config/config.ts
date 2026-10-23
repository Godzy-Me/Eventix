import { config as conf } from "dotenv";
conf();

const isProd = process.env.NODE_ENV === "production";

const bool = (value: string | undefined, fallback: boolean) =>
  value === undefined || value === "" ? fallback : value === "true";

const num = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return value !== undefined && value !== "" && !Number.isNaN(n) ? n : fallback;
};

const _config = {
  env: process.env.NODE_ENV || "development",
  isProd,
  port: num(process.env.PORT, 9000),
  databaseUrl: process.env.MONGO_CONNECTION_STRING,

  // ---- Auth -------------------------------------------------------------
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET as string,
  hashingSecret: process.env.HASH_SECRET as string,
  // jsonwebtoken style durations ("1m", "15m", "7d"...). The tutorial demo uses 1m / 1d.
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  accessCookieMaxAgeMs: num(process.env.ACCESS_COOKIE_MAX_AGE_MS, 15 * 60 * 1000),
  refreshCookieMaxAgeMs: num(process.env.REFRESH_COOKIE_MAX_AGE_MS, 7 * 24 * 60 * 60 * 1000),
  // Cross-site (frontend and API on different domains) needs SameSite=None + Secure (HTTPS).
  // Same-origin (nginx reverse proxy / localhost dev) works fine with Lax.
  cookieSecure: bool(process.env.COOKIE_SECURE, isProd),
  cookieSameSite: (process.env.COOKIE_SAMESITE || (isProd ? "none" : "lax")) as
    | "lax"
    | "strict"
    | "none",

  // ---- Email (OTP) ------------------------------------------------------
  emailUsername: process.env.EMAIL_USERNAME as string,
  emailPassword: process.env.EMAIL_PASSWORD as string,

  // ---- CORS / URLs ------------------------------------------------------
  // Comma separated list of allowed origins
  frontendUrls: (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // ---- Redis (seat locking) --------------------------------------------
  redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  seatLockTtlSeconds: num(process.env.SEAT_LOCK_TTL_SECONDS, 300),
  maxSeatsPerBooking: num(process.env.MAX_SEATS_PER_BOOKING, 10),

  // ---- Payments ---------------------------------------------------------
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  taxRate: num(process.env.TAX_RATE, 0.05),

  // ---- Shows ------------------------------------------------------------
  showTimezone: process.env.SHOW_TIMEZONE || "Asia/Kolkata",
  // Reject bookings for shows that already started. Turn off only for local testing.
  enforceShowTime: bool(process.env.ENFORCE_SHOW_TIME, true),
};

export const config = Object.freeze(_config);

/** Fail fast on missing critical env vars. */
export const assertConfig = () => {
  const missing: string[] = [];
  if (!config.databaseUrl) missing.push("MONGO_CONNECTION_STRING");
  if (!config.accessTokenSecret) missing.push("ACCESS_TOKEN_SECRET");
  if (!config.refreshTokenSecret) missing.push("REFRESH_TOKEN_SECRET");
  if (!config.hashingSecret) missing.push("HASH_SECRET");
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
};

/** True when real Razorpay keys are configured. Otherwise the app uses the built-in mock gateway. */
export const isRazorpayConfigured = () =>
  Boolean(config.razorpayKeyId && config.razorpayKeySecret);
