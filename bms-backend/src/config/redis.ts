import Redis from "ioredis";
import { config } from "./config";

/**
 * A single shared Redis connection for commands (locks, etc).
 * Socket.IO pub/sub or blocking commands would need their own connections.
 */
export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on("error", (err) => console.error("[redis] error:", err.message));
redis.on("connect", () => console.log("[redis] connected"));

export const connectRedis = async () => {
  try {
    await redis.connect();
    await redis.ping();
  } catch (error) {
    console.error("Failed to connect to Redis", error);
    process.exit(1);
  }
};
