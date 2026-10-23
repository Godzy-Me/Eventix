import { CookieOptions, Response } from "express";
import { config } from "../config/config";

const base = (): CookieOptions => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: config.cookieSameSite,
  path: "/",
});

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie("accessToken", accessToken, { ...base(), maxAge: config.accessCookieMaxAgeMs });
  res.cookie("refreshToken", refreshToken, { ...base(), maxAge: config.refreshCookieMaxAgeMs });
};

// clearCookie only works when the same attributes (path/sameSite/secure) are used as when setting it
export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", base());
  res.clearCookie("refreshToken", base());
};
