import express from "express";
import * as PaymentController from "./payment.controller";
import { isVerifiedUser } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate";
import {
  CancelBookingSchema,
  CreateOrderSchema,
  PaymentFailedSchema,
  VerifyPaymentSchema,
} from "./payment.validation";

const router = express.Router();

// NOTE: POST /payments/webhook is registered in app.ts (it needs the raw body, before express.json()).

router.get("/config", PaymentController.getConfig);
router.post("/create-order", isVerifiedUser, validate(CreateOrderSchema), PaymentController.createOrder);
router.post("/verify", isVerifiedUser, validate(VerifyPaymentSchema), PaymentController.verifyPayment);
router.post("/failed", isVerifiedUser, validate(PaymentFailedSchema), PaymentController.paymentFailed);
router.post("/cancel", isVerifiedUser, validate(CancelBookingSchema), PaymentController.cancelBooking);
router.post("/mock/pay", isVerifiedUser, PaymentController.mockPay);

export default router;
