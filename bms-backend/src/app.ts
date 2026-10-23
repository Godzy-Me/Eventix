import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import router from "./routes";
import { config } from "./config/config";
import { globalErrorHandler } from "./middlewares/error.middleware";
import * as PaymentController from "./modules/payment/payment.controller";

const app = express();

// behind nginx / an AWS load balancer: needed so rate limiting and secure cookies see the real client
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:5173", // Explicitly added Vite dev server
      ...(Array.isArray(config.frontendUrls) ? config.frontendUrls : [config.frontendUrls]),
    ].filter(Boolean),
  })
);
app.use(cookieParser());

// Razorpay signs the RAW body, so the webhook must be registered BEFORE express.json()
app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
  PaymentController.webhook
);

app.use(express.json({ limit: "100kb" }));

app.get("/", (_, res) => {
  res.json({
    message: "Welcome to BookMyScreen API",
  });
});

// simple liveness probe for Docker / AWS health checks
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

//ALL ROUTES
app.use("/api/v1/",router);

// Global error handler (MUST be after all routes)
app.use(globalErrorHandler);

export default app;