import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import * as PaymentService from "./payment.service";
import { getProvider, verifyWebhookSignature } from "./payment.gateway";
import { config } from "../../config/config";

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { showId, seatIds } = req.body;
    const order = await PaymentService.createOrder(String(req.user._id), showId, seatIds);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await PaymentService.verifyPayment(String(req.user._id), {
      orderId: req.body.razorpay_order_id,
      paymentId: req.body.razorpay_payment_id,
      signature: req.body.razorpay_signature,
    });
    res.status(200).json({ success: true, bookingId: booking?._id, status: booking?.status });
  } catch (error) {
    next(error);
  }
};

export const paymentFailed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await PaymentService.markPaymentFailed(req.body.orderId, req.body.reason, String(req.user._id));
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PaymentService.cancelPending(String(req.user._id), req.body.bookingId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getConfig = (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ provider: getProvider(), taxRate: config.taxRate, lockTtlSeconds: config.seatLockTtlSeconds });
  } catch (error) {
    next(error);
  }
};

/** POST /payments/mock/pay  (mock provider only) */
export const mockPay = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (getProvider() !== "mock") throw createHttpError(404, "Not found");
    const out = await PaymentService.mockPay(String(req.user._id), req.body.orderId);
    res.json(out);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /payments/webhook - mounted with express.raw() in app.ts because the signature is
 * computed over the exact raw bytes Razorpay sent.
 */
export const webhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const raw = req.body as Buffer;
    if (typeof signature !== "string" || !Buffer.isBuffer(raw) || !verifyWebhookSignature(raw, signature)) {
      throw createHttpError(400, "Invalid webhook signature");
    }
    const event = JSON.parse(raw.toString("utf8"));
    const entity = event?.payload?.payment?.entity;

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const orderId = entity?.order_id ?? event?.payload?.order?.entity?.id;
      const paymentId = entity?.id;
      if (orderId && paymentId) await PaymentService.handleWebhookPaid(orderId, paymentId);
    } else if (event.event === "payment.failed" && entity?.order_id) {
      await PaymentService.markPaymentFailed(entity.order_id, entity.error_description || "Payment failed");
    }
    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};
