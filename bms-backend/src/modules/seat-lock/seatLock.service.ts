import { redis } from "../../config/redis";
import { config } from "../../config/config";

/**
 * Seat locks live in Redis as:   lock:{showId}:{seatId}  ->  userId   (TTL = SEAT_LOCK_TTL_SECONDS)
 *
 * Every multi-key operation is a Lua script, so it is atomic: two users racing for the
 * same seats can never both win, and we never end up with half of a seat group locked.
 */

export const lockKey = (showId: string, seatId: string) => `lock:${showId}:${seatId}`;

// KEYS = seat keys, ARGV[1] = userId, ARGV[2] = ttl
// Succeeds only if every seat is free OR already owned by the same user.
// Returns {1} on success or {0, failedKey1, failedKey2...}.
const LOCK_SCRIPT = `
local failed = {}
for i = 1, #KEYS do
  local owner = redis.call('GET', KEYS[i])
  if owner and owner ~= ARGV[1] then
    table.insert(failed, KEYS[i])
  end
end
if #failed > 0 then
  table.insert(failed, 1, 0)
  return failed
end
for i = 1, #KEYS do
  redis.call('SET', KEYS[i], ARGV[1], 'EX', tonumber(ARGV[2]))
end
return {1}
`;

// KEYS = seat keys, ARGV[1] = userId. Deletes only keys owned by this user. Returns the deleted keys.
const UNLOCK_SCRIPT = `
local deleted = {}
for i = 1, #KEYS do
  if redis.call('GET', KEYS[i]) == ARGV[1] then
    redis.call('DEL', KEYS[i])
    table.insert(deleted, KEYS[i])
  end
end
return deleted
`;

// KEYS = seat keys, ARGV[1] = userId, ARGV[2] = minimum ttl (seconds).
// For locks owned by the user whose remaining TTL is shorter than the minimum, raise it.
const ENSURE_TTL_SCRIPT = `
for i = 1, #KEYS do
  if redis.call('GET', KEYS[i]) == ARGV[1] then
    local ttl = redis.call('TTL', KEYS[i])
    if ttl < tonumber(ARGV[2]) then
      redis.call('EXPIRE', KEYS[i], tonumber(ARGV[2]))
    end
  end
end
return 1
`;

// KEYS = seat keys, ARGV[1] = userId. Returns 1 only if ALL keys are owned by this user.
const OWNS_ALL_SCRIPT = `
for i = 1, #KEYS do
  if redis.call('GET', KEYS[i]) ~= ARGV[1] then
    return 0
  end
end
return 1
`;

export interface LockResult {
  success: boolean;
  lockedSeats: string[];
  failedSeats: string[];
  expiresAt?: number; // epoch ms
}

const seatIdFromKey = (key: string) => key.split(":").slice(2).join(":");

export const lockSeats = async (
  showId: string,
  seatIds: string[],
  userId: string
): Promise<LockResult> => {
  const keys = seatIds.map((s) => lockKey(showId, s));
  const res = (await redis.eval(
    LOCK_SCRIPT,
    keys.length,
    ...keys,
    userId,
    String(config.seatLockTtlSeconds)
  )) as (number | string)[];

  if (res[0] === 1) {
    return {
      success: true,
      lockedSeats: seatIds,
      failedSeats: [],
      expiresAt: Date.now() + config.seatLockTtlSeconds * 1000,
    };
  }
  return {
    success: false,
    lockedSeats: [],
    failedSeats: res.slice(1).map((k) => seatIdFromKey(String(k))),
  };
};

/** Releases the user's own locks. Returns the seat ids that were actually released. */
export const unlockSeats = async (
  showId: string,
  seatIds: string[],
  userId: string
): Promise<string[]> => {
  if (!seatIds.length) return [];
  const keys = seatIds.map((s) => lockKey(showId, s));
  const deleted = (await redis.eval(UNLOCK_SCRIPT, keys.length, ...keys, userId)) as string[];
  return deleted.map(seatIdFromKey);
};

/** True when every seat is currently locked by this user (used before taking payment). */
export const userOwnsAllLocks = async (
  showId: string,
  seatIds: string[],
  userId: string
): Promise<boolean> => {
  if (!seatIds.length) return false;
  const keys = seatIds.map((s) => lockKey(showId, s));
  return ((await redis.eval(OWNS_ALL_SCRIPT, keys.length, ...keys, userId)) as number) === 1;
};

/** Force-release locks after a booking is confirmed (the DB is now the source of truth). */
export const releaseLocks = async (showId: string, seatIds: string[]) => {
  if (!seatIds.length) return;
  await redis.del(...seatIds.map((s) => lockKey(showId, s)));
};

/**
 * Make sure the user's locks live at least `minTtlSeconds` more. Called when a payment order is
 * created so the hold cannot expire while the payment window is open.
 */
export const ensureLockTtl = async (
  showId: string,
  seatIds: string[],
  userId: string,
  minTtlSeconds: number
) => {
  const keys = seatIds.map((s) => lockKey(showId, s));
  await redis.eval(ENSURE_TTL_SCRIPT, keys.length, ...keys, userId, String(minTtlSeconds));
};

/**
 * All currently locked seats for a show. Uses SCAN (never KEYS, which blocks Redis).
 * Returns seatId -> { userId, ttl seconds }
 */
export const getLockedSeatsForShow = async (
  showId: string
): Promise<{ seatId: string; userId: string; ttl: number }[]> => {
  const result: { seatId: string; userId: string; ttl: number }[] = [];
  let cursor = "0";
  do {
    const [next, keys] = await redis.scan(cursor, "MATCH", `lock:${showId}:*`, "COUNT", 200);
    cursor = next;
    if (keys.length) {
      const pipeline = redis.pipeline();
      keys.forEach((k) => {
        pipeline.get(k);
        pipeline.ttl(k);
      });
      const out = (await pipeline.exec()) ?? [];
      keys.forEach((k, i) => {
        const owner = out[i * 2]?.[1] as string | null;
        const ttl = Number(out[i * 2 + 1]?.[1] ?? -2);
        if (owner && ttl > 0) result.push({ seatId: seatIdFromKey(k), userId: owner, ttl });
      });
    }
  } while (cursor !== "0");
  return result;
};
