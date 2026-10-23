import axios from "axios";

const defaultHeader = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const axiosWrapper = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: { ...defaultHeader },
});

// ---------------------------------------------------------------------------
// Session flag. The auth cookies are httpOnly (JS can't see them), so we remember
// "this browser has signed in before" to avoid pointless refresh calls for visitors.
// ---------------------------------------------------------------------------
const SESSION_KEY = "bms_session";
export const hasSessionFlag = () => {
  try {
    return localStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};
export const setSessionFlag = (value) => {
  try {
    if (value) localStorage.setItem(SESSION_KEY, "1");
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable - ignore */
  }
};

// ---------------------------------------------------------------------------
// Refresh-token flow (see the "Refresh token flow" diagram):
//  1. request goes out with an expired access token  -> backend answers 401
//  2. this interceptor catches the 401 and calls POST /auth/refresh (new token pair in cookies)
//  3. the original request is replayed - the user never notices
// All requests that fail at the same moment share ONE refresh call.
// ---------------------------------------------------------------------------
let refreshPromise = null;

export const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = axiosWrapper
      .post("/auth/refresh")
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

axiosWrapper.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || "";

    const isAuthEndpoint = url.includes("/auth/");
    const canRetry = status === 401 && original && !original._retry && !isAuthEndpoint && hasSessionFlag();

    if (!canRetry) return Promise.reject(error);

    original._retry = true;
    try {
      await refreshSession();
      return axiosWrapper(original);
    } catch (refreshError) {
      // refresh token is gone/expired -> the session is really over
      setSessionFlag(false);
      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(error);
    }
  }
);

/** Pull a human readable message out of an axios error. */
export const getErrorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || error?.message || fallback;
