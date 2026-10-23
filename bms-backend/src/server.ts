import http from "http";
import mongoose from "mongoose";
import app from "./app";
import { assertConfig, config, isRazorpayConfigured } from "./config/config";
import connectDB from "./config/db";
import { connectRedis, redis } from "./config/redis";
import { initSocket, closeSocket } from "./socket";

const startServer = async () => {
  assertConfig();

  //connect to database + redis
  await connectDB();
  await connectRedis();

  // Express and Socket.IO share one HTTP server (REST for requests, sockets for live seat state)
  const server = http.createServer(app);
  initSocket(server);

  server.listen(config.port, () => {
    console.log(`Listening on port: ${config.port}`);
    console.log(
      isRazorpayConfigured()
        ? "Payments: Razorpay"
        : "Payments: MOCK gateway (set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET to use Razorpay)"
    );
  });

  // graceful shutdown (docker stop / SIGTERM)
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down`);
    await closeSocket();
    server.close(async () => {
      await mongoose.disconnect();
      redis.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});