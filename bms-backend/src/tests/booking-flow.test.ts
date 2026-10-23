/**
 * Integration test for the real-time seat locking + atomic booking logic.
 * Needs a Redis server (default redis://127.0.0.1:6379, override with TEST_REDIS_URL).
 * MongoDB is NOT required: the Show model is stubbed.
 *
 *   npm run test:locks
 */
process.env.NODE_ENV = "test";
process.env.REDIS_URL = process.env.TEST_REDIS_URL || "redis://127.0.0.1:6379";
process.env.ACCESS_TOKEN_SECRET = "test-access";
process.env.REFRESH_TOKEN_SECRET = "test-refresh";
process.env.HASH_SECRET = "test-hash";
process.env.SEAT_LOCK_TTL_SECONDS = "2";
process.env.ENFORCE_SHOW_TIME = "false";
process.env.FRONTEND_URL = "http://localhost:5173";

/* eslint-disable @typescript-eslint/no-var-requires */
const assert = require("assert");
const http = require("http");
const jwt = require("jsonwebtoken");
const { io: ioClient } = require("socket.io-client");
const { Query } = require("mingo");
const { Aggregator } = require("mingo");

const { redis, connectRedis } = require("../config/redis");
const { initSocket, closeSocket } = require("../socket");
const { ShowModel } = require("../modules/show/show.model");
const showService = require("../modules/show/show.service");
const lockService = require("../modules/seat-lock/seatLock.service");
const gateway = require("../modules/payment/payment.gateway");
const { generateSeatLayout } = require("../utils");

const SHOW_ID = "64b000000000000000000001";
const USER_A = "64a00000000000000000000a";
const USER_B = "64a00000000000000000000b";

const fakeShow = { _id: SHOW_ID, date: "01-01-2099", startTime: "07:30 PM", seatLayout: generateSeatLayout() };
ShowModel.findById = () => ({ lean: async () => fakeShow });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let passed = 0;
const ok = (name: string) => {
  console.log(`  ✓ ${name}`);
  passed++;
};

const tokenFor = (id: string) => jwt.sign({ _id: id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5m" });

const connect = (port: number, userId?: string) =>
  new Promise<any>((resolve, reject) => {
    const s = ioClient(`http://localhost:${port}`, {
      extraHeaders: userId ? { cookie: `accessToken=${tokenFor(userId)}` } : {},
      transports: ["websocket"],
    });
    s.on("connect", () => resolve(s));
    s.on("connect_error", reject);
  });

const emitAck = (s: any, ev: string, payload: any) => new Promise<any>((res) => s.emit(ev, payload, res));
const waitFor = (s: any, ev: string, ms = 1500) =>
  new Promise<any>((res, rej) => {
    const t = setTimeout(() => rej(new Error(`timeout waiting for ${ev}`)), ms);
    s.once(ev, (d: any) => (clearTimeout(t), res(d)));
  });

(async () => {
  await connectRedis();
  await redis.flushdb();

  const server = http.createServer();
  initSocket(server);
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as any).port;

  console.log("Seat locking (Redis + Socket.IO)");
  const a = await connect(port, USER_A);
  const b = await connect(port, USER_B);
  const anon = await connect(port);

  await emitAck(a, "join-show", SHOW_ID);
  await emitAck(b, "join-show", SHOW_ID);
  await emitAck(anon, "join-show", SHOW_ID);

  // 1. A locks, B sees it
  const seenByB = waitFor(b, "seat-locked");
  const r1 = await emitAck(a, "lock-seats", { showId: SHOW_ID, seatIds: ["A1", "A2"] });
  assert.equal(r1.success, true);
  assert.ok(r1.expiresAt > Date.now());
  assert.deepEqual((await seenByB).seatIds, ["A1", "A2"]);
  ok("user A locks A1,A2 and user B is notified (seat-locked)");

  // 2. B conflicts -> atomic: A3 must NOT be locked even though it was free
  const failEvent = waitFor(b, "seat-lock-failed");
  const r2 = await emitAck(b, "lock-seats", { showId: SHOW_ID, seatIds: ["A2", "A3"] });
  assert.equal(r2.success, false);
  assert.deepEqual(r2.failedSeats, ["A2"]);
  assert.deepEqual((await failEvent).seatIds, ["A2"]);
  assert.equal(await redis.exists(`lock:${SHOW_ID}:A3`), 0);
  ok("conflicting lock is rejected atomically (seat-lock-failed, A3 left free)");

  // 3. anonymous cannot lock
  const r3 = await emitAck(anon, "lock-seats", { showId: SHOW_ID, seatIds: ["B1"] });
  assert.equal(r3.code, "UNAUTHORIZED");
  ok("anonymous socket cannot lock seats");

  // 4. validation
  assert.equal((await emitAck(a, "lock-seats", { showId: SHOW_ID, seatIds: ["ZZ99"] })).success, false);
  assert.equal((await emitAck(a, "lock-seats", { showId: SHOW_ID, seatIds: Array.from({ length: 11 }, (_, i) => `B${i + 1}`) })).success, false);
  assert.equal((await emitAck(a, "lock-seats", { showId: "nope", seatIds: ["A1"] })).success, false);
  ok("unknown seat / more than 10 seats / bad show id are rejected");

  // 5. only the owner can unlock
  const unlockedAsB = await emitAck(b, "unlock-seats", { showId: SHOW_ID, seatIds: ["A1"] });
  assert.deepEqual(unlockedAsB.seatIds, []);
  assert.equal(await redis.exists(`lock:${SHOW_ID}:A1`), 1);
  const unlockEvent = waitFor(b, "seat-unlocked");
  const unlockedAsA = await emitAck(a, "unlock-seats", { showId: SHOW_ID, seatIds: ["A1"] });
  assert.deepEqual(unlockedAsA.seatIds, ["A1"]);
  assert.deepEqual((await unlockEvent).seatIds, ["A1"]);
  ok("only the lock owner can unlock; others are notified (seat-unlocked)");

  // 6. re-locking a different selection drops the old hold (A2 -> C5)
  const unlockOld = waitFor(b, "seat-unlocked");
  const r6 = await emitAck(a, "lock-seats", { showId: SHOW_ID, seatIds: ["C5"] });
  assert.equal(r6.success, true);
  assert.deepEqual((await unlockOld).seatIds, ["A2"]);
  assert.equal(await redis.exists(`lock:${SHOW_ID}:A2`), 0);
  ok("choosing different seats releases the user's previous hold");

  // 7. 25 users racing for the same seat -> exactly one winner
  await redis.flushdb();
  const results = await Promise.all(
    Array.from({ length: 25 }, (_, i) => lockService.lockSeats(SHOW_ID, ["D10", "D11"], `racer-${i}`))
  );
  assert.equal(results.filter((r: any) => r.success).length, 1);
  ok("25 concurrent lock attempts on the same seats -> exactly 1 winner");

  // 8. TTL expiry + periodic sync tells watchers the seat is free again
  await redis.flushdb();
  await emitAck(a, "lock-seats", { showId: SHOW_ID, seatIds: ["E1"] });
  const init1 = await new Promise<any>((res) => {
    b.once("locked-seats-initial", res);
    b.emit("join-show", SHOW_ID);
  });
  assert.ok(init1.lockedSeats.some((l: any) => l.seatId === "E1" && l.mine === false));
  await sleep(2300);
  assert.equal(await redis.exists(`lock:${SHOW_ID}:E1`), 0);
  const synced = await waitFor(b, "locked-seats-initial", 7000);
  assert.equal(synced.lockedSeats.length, 0);
  ok("lock expires after TTL and the periodic sync frees the seat on watchers' screens");

  // 9. mine flag
  await emitAck(a, "lock-seats", { showId: SHOW_ID, seatIds: ["E2"] });
  const initA = await new Promise<any>((res) => {
    a.once("locked-seats-initial", res);
    a.emit("join-show", SHOW_ID);
  });
  assert.equal(initA.lockedSeats.find((l: any) => l.seatId === "E2").mine, true);
  ok("locked-seats-initial marks the user's own holds as mine");

  console.log("\nAtomic booking query (MongoDB semantics checked with mingo)");
  // capture what bookSeatsAtomically sends to Mongo
  let captured: any;
  ShowModel.updateOne = async (filter: any, update: any) => {
    captured = { filter, update };
    return { modifiedCount: 1 };
  };
  const clone = () => JSON.parse(JSON.stringify(fakeShow));
  await showService.bookSeatsAtomically(SHOW_ID, ["A1", "A2", "E3"]);

  const doc = clone();
  const { _id, ...filterWithoutId } = captured.filter;
  assert.ok(new Query(filterWithoutId).test(doc), "filter should match when all seats are available");
  const [updated] = new Aggregator(captured.update).run([doc]);
  doc.seatLayout = updated.seatLayout;
  const st = (row: string, n: number) => doc.seatLayout.find((r: any) => r.row === row).seats.find((s: any) => s.number === n).status;
  assert.deepEqual([st("A", 1), st("A", 2), st("E", 3), st("A", 3), st("E", 4)], ["BOOKED", "BOOKED", "BOOKED", "AVAILABLE", "AVAILABLE"]);
  ok("update flips exactly the requested seats to BOOKED across multiple rows");

  const taken = clone();
  taken.seatLayout.find((r: any) => r.row === "E").seats.find((s: any) => s.number === 3).status = "BOOKED";
  assert.ok(!new Query(filterWithoutId).test(taken), "filter must NOT match if any seat is already booked");
  ok("filter refuses the whole booking if any single seat is already BOOKED");

  console.log("\nPayment signatures");
  const sig = gateway.signCheckout("mock", "order_1", "pay_1");
  assert.ok(gateway.verifyCheckoutSignature("mock", "order_1", "pay_1", sig));
  assert.ok(!gateway.verifyCheckoutSignature("mock", "order_1", "pay_2", sig));
  assert.ok(!gateway.verifyCheckoutSignature("mock", "order_1", "pay_1", "x".repeat(sig.length)));
  ok("checkout signature verifies, tampering is rejected");

  console.log(`\n${passed} checks passed`);
  a.close(); b.close(); anon.close();
  await closeSocket();
  server.close();
  await redis.flushdb();
  redis.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error("\n✗ FAILED:", e);
  process.exit(1);
});
