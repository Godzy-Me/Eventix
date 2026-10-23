import { z } from "zod";

export const CreateOrderSchema = z.object({
  showId: z.string().min(1),
  seatIds: z.array(z.string().min(2).max(6)).min(1).max(20),
});

export const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const PaymentFailedSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().max(300).optional().default("Payment failed"),
});

export const CancelBookingSchema = z.object({
  bookingId: z.string().min(1),
});
