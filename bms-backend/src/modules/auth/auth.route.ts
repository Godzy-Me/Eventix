import express from 'express';
import rateLimit from 'express-rate-limit';
import * as AuthController from './auth.controller';
import {isVerifiedUser} from "../../middlewares/auth.middleware"

const router = express.Router();

// Brute-force protection for OTP endpoints (4 digit OTP => must be rate limited)
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts, please try again later", errors: [] },
});

router.post('/send-otp', otpLimiter, AuthController.sendOtp);
router.post('/verify-otp', otpLimiter, AuthController.verifyOTP);
router.post('/refresh', AuthController.refresh);
// logout must work even when the access token has already expired
router.post('/logout', AuthController.logout);

export default router;
