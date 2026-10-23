import { io } from "socket.io-client";
import { refreshSession } from "../apis/axiosWrapper";

/**
 * One shared Socket.IO connection for real-time seat locking.
 * Socket.IO runs on the same server as the REST API, so we derive its URL from VITE_BACKEND_URL
 * (e.g. http://localhost:9000/api/v1 -> http://localhost:9000). Override with VITE_SOCKET_URL if needed.
 */
const resolveSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  try {
    return new URL(import.meta.env.VITE_BACKEND_URL, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
};

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(resolveSocketUrl(), {
      withCredentials: true, // send the httpOnly auth cookie with the handshake
      autoConnect: false,
    });
  }
  return socket;
};

const waitForConnect = (s) =>
  new Promise((resolve, reject) => {
    if (s.connected) return resolve();
    const timer = setTimeout(() => reject(new Error("Socket connection timeout")), 8000);
    s.once("connect", () => {
      clearTimeout(timer);
      resolve();
    });
    s.connect();
  });

/** emit + wait for the server's acknowledgement (rejects on timeout). */
export const emitWithAck = async (event, payload, timeoutMs = 8000) => {
  const s = getSocket();
  await waitForConnect(s);
  return s.timeout(timeoutMs).emitWithAck(event, payload);
};

/**
 * The socket authenticates once, at connect time, from the access-token cookie. If that token has
 * expired the server treats us as anonymous (UNAUTHORIZED). Refresh the token, reconnect so the
 * handshake carries the new cookie, and let the caller retry.
 */
export const reconnectWithFreshAuth = async () => {
  await refreshSession();
  const s = getSocket();
  s.disconnect();
  await waitForConnect(s);
};

/** emitWithAck that transparently recovers from an expired access token once. */
export const emitAuthed = async (event, payload, { onReconnect } = {}) => {
  let res = await emitWithAck(event, payload);
  if (res?.code === "UNAUTHORIZED") {
    await reconnectWithFreshAuth();
    if (onReconnect) await onReconnect();
    res = await emitWithAck(event, payload);
  }
  return res;
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};
