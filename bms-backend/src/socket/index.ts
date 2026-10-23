import http from "http";
import { Server, Socket } from "socket.io";
import { config } from "../config/config";
import { verifyAccessToken } from "../modules/auth/token.service";
import {
  getLockedSeatsForShow,
  lockSeats,
  unlockSeats,
} from "../modules/seat-lock/seatLock.service";
import { ShowModel } from "../modules/show/show.model";
import { resolveSeats, SEAT_ID_REGEX } from "../modules/show/show.service";
import { hasShowStarted } from "../utils/showTime";

/**
 * Real-time seat locking. Event names follow the tutorial's design:
 *
 *  client -> server : join-show, lock-seats, unlock-seats, leave-show
 *  server -> client : locked-seats-initial, seat-locked, seat-unlocked, seat-lock-failed, seat-booked
 *
 * Socket.IO and Express share one HTTP server but have separate responsibilities
 * (REST for request/response, Socket.IO for pushing live state).
 */

/** Minimal Cookie header parser (avoids an extra dependency). */
const parseCookie = (header: string): Record<string, string> =>
  Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf("=");
        return [part.slice(0, i), decodeURIComponent(part.slice(i + 1))];
      })
  );

let io: Server | null = null;
let syncTimer: NodeJS.Timeout | null = null;

const roomOf = (showId: string) => `show:${showId}`;
const isObjectId = (v: unknown): v is string => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);

type Ack = (res: Record<string, unknown>) => void;
const safeAck = (ack: unknown): Ack => (typeof ack === "function" ? (ack as Ack) : () => undefined);

const validSeatIds = (seatIds: unknown): seatIds is string[] =>
  Array.isArray(seatIds) &&
  seatIds.length > 0 &&
  seatIds.length <= config.maxSeatsPerBooking &&
  new Set(seatIds).size === seatIds.length &&
  seatIds.every((s) => typeof s === "string" && SEAT_ID_REGEX.test(s));

/** Locked seats as seen by one particular user ("mine" lets the UI show your own holds as selected). */
const buildLockedPayload = async (showId: string, userId?: string) => {
  const locks = await getLockedSeatsForShow(showId);
  return {
    showId,
    lockedSeats: locks.map((l) => ({
      seatId: l.seatId,
      mine: !!userId && l.userId === userId,
      ttl: l.ttl,
    })),
  };
};

const syncRoom = async (showId: string) => {
  if (!io) return;
  const room = io.sockets.adapter.rooms.get(roomOf(showId));
  if (!room || room.size === 0) return;
  const locks = await getLockedSeatsForShow(showId);
  for (const socketId of room) {
    const s = io.sockets.sockets.get(socketId);
    if (!s) continue;
    const userId = s.data.userId as string | undefined;
    s.emit("locked-seats-initial", {
      showId,
      lockedSeats: locks.map((l) => ({ seatId: l.seatId, mine: !!userId && l.userId === userId, ttl: l.ttl })),
    });
  }
};

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: { origin: config.frontendUrls, credentials: true },
    // Browser clients will first try polling then upgrade; keeping both makes proxies happy.
    maxHttpBufferSize: 1e5,
  });

  // Authenticate from the same httpOnly cookie the REST API uses. Anonymous sockets may still
  // watch a show (read only) - they just cannot lock seats.
  io.use((socket, next) => {
    try {
      const cookies = parseCookie(socket.handshake.headers.cookie || "");
      if (cookies.accessToken) {
        const payload = verifyAccessToken(cookies.accessToken) as { _id?: string };
        if (payload?._id) socket.data.userId = String(payload._id);
      }
    } catch {
      // expired / invalid token -> stay anonymous; client will refresh and reconnect on UNAUTHORIZED
    }
    next();
  });

  io.on("connection", (socket: Socket) => {
    // 1. user opens the SeatSelection page -> joins the show's room
    socket.on("join-show", async (showId: unknown, ack?: unknown) => {
      const reply = safeAck(ack);
      if (!isObjectId(showId)) return reply({ success: false, message: "Invalid show id" });
      try {
        // leave any other show rooms first (one seat page at a time per connection)
        for (const r of socket.rooms) if (r.startsWith("show:") && r !== roomOf(showId)) socket.leave(r);
        await socket.join(roomOf(showId));
        // 2/3. fetch the locks from Redis and send them to this client only
        const payload = await buildLockedPayload(showId, socket.data.userId);
        socket.emit("locked-seats-initial", payload);
        reply({ success: true, authenticated: !!socket.data.userId });
      } catch (err) {
        console.error("[socket] join-show failed", err);
        reply({ success: false, message: "Could not join show" });
      }
    });

    socket.on("leave-show", (showId: unknown) => {
      if (isObjectId(showId)) socket.leave(roomOf(showId));
    });

    // 6A. user clicked "Proceed" -> try to lock all selected seats atomically
    socket.on("lock-seats", async (payload: any, ack?: unknown) => {
      const reply = safeAck(ack);
      const userId = socket.data.userId as string | undefined;
      try {
        if (!userId) return reply({ success: false, code: "UNAUTHORIZED", message: "Please sign in again" });

        const { showId, seatIds } = payload || {};
        if (!isObjectId(showId) || !validSeatIds(seatIds)) {
          return reply({ success: false, code: "BAD_REQUEST", message: "Invalid seat selection" });
        }

        const show = await ShowModel.findById(showId).lean();
        if (!show) return reply({ success: false, code: "NOT_FOUND", message: "Show not found" });
        if (config.enforceShowTime && hasShowStarted(show.date, show.startTime)) {
          return reply({ success: false, code: "SHOW_STARTED", message: "This show has already started" });
        }

        const resolved = resolveSeats(show.seatLayout as any, seatIds);
        if (!resolved) return reply({ success: false, code: "BAD_REQUEST", message: "Unknown seat in selection" });

        const taken = resolved.filter((s) => s.status !== "AVAILABLE").map((s) => s.seatId);
        if (taken.length) {
          socket.emit("seat-lock-failed", { showId, seatIds: taken });
          return reply({ success: false, code: "SEATS_UNAVAILABLE", failedSeats: taken, message: "Some seats are already booked" });
        }

        // Drop this user's older holds on the same show that are not part of the new selection
        const mine = (await getLockedSeatsForShow(showId)).filter((l) => l.userId === userId && !seatIds.includes(l.seatId));
        if (mine.length) {
          const released = await unlockSeats(showId, mine.map((m) => m.seatId), userId);
          if (released.length) io!.to(roomOf(showId)).emit("seat-unlocked", { showId, seatIds: released });
        }

        // 7/8/9. atomic check + lock in Redis (TTL = SEAT_LOCK_TTL_SECONDS)
        const result = await lockSeats(showId, seatIds, userId);
        if (!result.success) {
          // 8. conflict -> tell only this user
          socket.emit("seat-lock-failed", { showId, seatIds: result.failedSeats });
          return reply({ success: false, code: "SEATS_LOCKED", failedSeats: result.failedSeats, message: "Someone else is already booking these seats" });
        }

        // 10. broadcast to everyone else in the show room
        socket.to(roomOf(showId)).emit("seat-locked", { showId, seatIds });
        return reply({ success: true, seatIds, expiresAt: result.expiresAt, ttlSeconds: config.seatLockTtlSeconds });
      } catch (err) {
        console.error("[socket] lock-seats failed", err);
        return reply({ success: false, code: "SERVER_ERROR", message: "Could not lock seats" });
      }
    });

    // 12/13/14. user left / timer expired -> release and tell everybody
    socket.on("unlock-seats", async (payload: any, ack?: unknown) => {
      const reply = safeAck(ack);
      const userId = socket.data.userId as string | undefined;
      try {
        if (!userId) return reply({ success: false, code: "UNAUTHORIZED" });
        const { showId, seatIds } = payload || {};
        if (!isObjectId(showId) || !Array.isArray(seatIds) || seatIds.length > 50 || !seatIds.every((s) => typeof s === "string" && SEAT_ID_REGEX.test(s))) {
          return reply({ success: false, code: "BAD_REQUEST" });
        }
        const released = await unlockSeats(showId, seatIds, userId);
        if (released.length) io!.to(roomOf(showId)).emit("seat-unlocked", { showId, seatIds: released });
        return reply({ success: true, seatIds: released });
      } catch (err) {
        console.error("[socket] unlock-seats failed", err);
        return reply({ success: false, code: "SERVER_ERROR" });
      }
    });
  });

  // Redis TTL expiry does not notify anyone, so periodically re-sync every active room.
  // This makes seats of abandoned checkouts free up on every open screen within a few seconds.
  syncTimer = setInterval(() => {
    if (!io) return;
    for (const room of io.sockets.adapter.rooms.keys()) {
      if (room.startsWith("show:")) syncRoom(room.slice(5)).catch(() => undefined);
    }
  }, 5000);
  syncTimer.unref();

  return io;
};

/** Called by the payment service once a booking is confirmed. */
export const broadcastSeatsBooked = (showId: string, seatIds: string[]) => {
  io?.to(roomOf(showId)).emit("seat-booked", { showId, seatIds });
};

export const broadcastSeatsUnlocked = (showId: string, seatIds: string[]) => {
  io?.to(roomOf(showId)).emit("seat-unlocked", { showId, seatIds });
};

export const closeSocket = async () => {
  if (syncTimer) clearInterval(syncTimer);
  await new Promise<void>((resolve) => (io ? io.close(() => resolve()) : resolve()));
};
