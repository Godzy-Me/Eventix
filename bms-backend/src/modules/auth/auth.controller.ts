import { Request, Response, NextFunction } from "express";
import * as OtpService from "./otp.service";
import * as UserService from "../user/user.service";
import * as TokenService from "./token.service";
import createHttpError from "http-errors";
import { isValidEmail } from "../../utils";
import { clearAuthCookies, setAuthCookies } from "../../utils/cookies";

const normalizeEmail = (email: unknown) => String(email ?? "").trim().toLowerCase();

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = normalizeEmail(req.body?.email);

        if (!email) {   
            return next(new createHttpError.BadRequest("Email is required"));
        }

        if (!isValidEmail(email)) {
            return next(new createHttpError.BadRequest("Invalid email format"));
        }

        // 1. Create OTP
        const otp = OtpService.generateOTP();

        // 2. Hash OTP with email
        const ttl = 1000 * 60 * 2; // 2 mins
        const expires = Date.now() + ttl;
        const data = `${email}.${otp}.${expires}`;
        const hashedOTP = OtpService.hashOTP(data);

        // 3. Send OTP to user's email
        try {
            await OtpService.sendOTPtoEmail(email, otp);
        } catch (error) {
            console.error("[otp] failed to send email", error);
            return next(new createHttpError.InternalServerError("Error sending OTP to email"));
        }

        // 4. Respond to the client
        res.json({
            hash: `${hashedOTP}:${expires}`,
            email,
            msg: "OTP sent to email successfully ✅"
        });

    } catch (error) {
        next(error);
    }
};

export const verifyOTP = async (
    req: Request,
    res: Response,
    next: NextFunction
 ) => {
    try {
        const email = normalizeEmail(req.body?.email);
        const { otp, hash } = req.body ?? {};

        if (!email || !otp || !hash || typeof hash !== "string") {
            return next(new createHttpError.BadRequest("All fields are required"));
        }

        // 1. OTP Verification
        const [hashedOTP, expires] = hash.split(":");

        if (!expires || Date.now() > +expires) {
            return next(new createHttpError.Gone("OTP Expired"));
        }

        const data = `${email}.${otp}.${expires}`;
        const isValid = OtpService.verifyOTP(hashedOTP, data);

        if (!isValid) {
            return next(new createHttpError.Unauthorized("Invalid OTP"));
        }

        // 2. Find or create the user (new users get activated later with name + phone)
        let user = await UserService.getUserByEmail(email);

        if (!user) {
            user = await UserService.createUser({
                email,
                name: email.split("@")[0], // temporary display name until the account is activated
            } as any);
        }

        // 3. Generate JWT
        const { accessToken, refreshToken } = TokenService.generateToken({
            _id: user._id,
            email: user.email
        });

        // 4. Store refresh token in DB
        await TokenService.storeRefreshToken(user._id as string, refreshToken);

        // 5. Sending tokens in httpOnly cookies
        setAuthCookies(res, accessToken, refreshToken);

        res.json({ auth: true, user });

    } catch (error) {
        next(error);
    }
};

/**
 * Refresh token flow: when the access token has expired the axios interceptor calls this,
 * gets a brand-new pair (rotation) and replays the original request.
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) return next(createHttpError(401, "Refresh token is missing"));

        let payload: any;
        try {
            payload = TokenService.verifyRefreshToken(refreshToken);
        } catch {
            clearAuthCookies(res);
            return next(createHttpError(401, "Invalid or expired refresh token"));
        }

        const stored = await TokenService.findRefreshToken(payload._id, refreshToken);
        if (!stored) {
            // Valid signature but not in the DB => it was already rotated/revoked. Possible token theft:
            // revoke every session of this user.
            await TokenService.deleteAllRefreshTokensForUser(payload._id);
            clearAuthCookies(res);
            return next(createHttpError(401, "Refresh token reuse detected, please sign in again"));
        }

        const user = await UserService.getUserById(payload._id);
        if (!user) {
            clearAuthCookies(res);
            return next(createHttpError(404, "User not found"));
        }

        const tokens = TokenService.generateToken({ _id: user._id, email: user.email });
        await TokenService.deleteRefreshToken(refreshToken);
        await TokenService.storeRefreshToken(String(user._id), tokens.refreshToken);

        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.cookies;

        if (refreshToken) {
            await TokenService.deleteRefreshToken(refreshToken);
        }

        clearAuthCookies(res);

        res.status(200).json({ msg: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
};
