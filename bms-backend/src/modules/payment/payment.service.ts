import crypto from "crypto";
import createHttpError from "http-errors";
import { Types } from "mongoose";
import { config } from "../../config/config";
import { ShowModel } from "../show/show.model";
import { bookSeatsAtomically, resolveSeats, SEAT_ID_REGEX } from "../show/show.service";
import { BookingModel } from "../booking/booking.model";
import { PaymentModel } from "./payment.model";
import {
  createGatewayOrder,
  signCheckout,
  fetchPaymentMethod,
  getProvider,
  refundPayment,
  verifyCheckoutSignature,
} from "./payment.gateway";
import { ensureLockTtl, releaseLocks, unlockSeats, userOwnsAllLocks } from "../seat-lock/seatLock.service";
import { broadcastSeatsBooked, broadcastSeatsUnlocked } from "../../socket";
import { hasShowStarted } from "../../utils/showTime";
import { UserModel } from "../user/user.model";

const PAYMENT_WINDOW_SECONDS = 180; // keep the hold alive at least this long once a payment starts

const round2 = (n: number) => Math.round(n * 100) / 100;

const newBookingCode = () => "BMS" + crypto.randomBytes(4).toString("hex").toUpperCase();

/**
 * Step 1 of checkout: the user already holds the seats in Redis. We re-validate everything on the
 * server (seat ids, availability, lock ownership, show time), compute the price ourselves,
 * create a PENDING booking and a gateway order.
 */
export const createOrder = async (userId: string, showId: string, seatIds: string[]) => {
  if (!Types.ObjectId.isValid(showId)) throw createHttpError(400, "Invalid show id");
  if (
    !Array.isArray(seatIds) ||
    seatIds.length === 0 ||
    seatIds.length > config.maxSeatsPerBooking ||
    new Set(seatIds).size !== seatIds.length ||
    !seatIds.every((s) => typeof s === "string" && SEAT_ID_REGEX.test(s))
  ) {
    throw createHttpError(400, `Select between 1 and ${config.maxSeatsPerBooking} valid seats`);
  }

  const provider = getProvider();

  const show = await ShowModel.findById(showId).populate("movie theater");
  if (!show) throw createHttpError(404, "Show not found");
  if (config.enforceShowTime && hasShowStarted(show.date, show.startTime)) {
    throw createHttpError(400, "This show has already started");
  }

  const resolved = resolveSeats(show.seatLayout as any, seatIds);
  if (!resolved) throw createHttpError(400, "One or more seats do not exist");
  if (resolved.some((s) => s.status !== "AVAILABLE")) {
    throw createHttpError(409, "One or more seats are no longer available");
  }

  // The user must still hold the Redis lock (this is what stops two people paying for one seat)
  const ownsLocks = await userOwnsAllLocks(showId, seatIds, userId);
  if (!ownsLocks) throw createHttpError(409, "Your seat hold has expired. Please select your seats again.");
  await ensureLockTtl(showId, seatIds, userId, PAYMENT_WINDOW_SECONDS);

  // Cancel this user's older unpaid attempts for the same show
  await BookingModel.updateMany(
    { user: userId, show: showId, status: "PENDING" },
    { $set: { status: "CANCELLED" } }
  );

  const baseAmount = round2(resolved.reduce((sum, s) => sum + s.price, 0));
  const taxAmount = round2(baseAmount * config.taxRate);
  const totalAmount = round2(baseAmount + taxAmount);
  const amountPaise = Math.round(totalAmount * 100);

  const booking = await BookingModel.create({
    bookingCode: newBookingCode(),
    user: userId,
    show: showId,
    seats: seatIds,
    seatDetails: resolved.map(({ seatId, row, number, type, price }) => ({ seatId, row, number, type, price })),
    baseAmount,
    taxAmount,
    totalAmount,
    status: "PENDING",
  });

  let order;
  try {
    order = await createGatewayOrder(provider, {
      amountPaise,
      receipt: booking.bookingCode,
      notes: { bookingId: String(booking._id), showId, userId },
    });
  } catch (err: any) {
    await BookingModel.findByIdAndUpdate(booking._id, { status: "FAILED" });
    console.error("[payment] gateway order failed", err?.error || err);
    throw createHttpError(502, "Payment gateway is unavailable, please try again");
  }

  await PaymentModel.create({
    booking: booking._id,
    user: userId,
    provider,
    orderId: order.id,
    amount: totalAmount,
    currency: order.currency,
    status: "CREATED",
  });

  const user = await UserModel.findById(userId).lean();

  return {
    provider,
    keyId: provider === "razorpay" ? config.razorpayKeyId : "mock",
    bookingId: String(booking._id),
    bookingCode: booking.bookingCode,
    orderId: order.id,
    amount: order.amount, // paise - this is what Razorpay Checkout expects
    currency: order.currency,
    breakdown: { baseAmount, taxAmount, totalAmount },
    prefill: { name: user?.name, email: user?.email, contact: user?.phone ? String(user.phone) : undefined },
    description: `${(show.movie as any)?.title ?? "Movie"} - ${resolved.map((s) => s.seatId).join(", ")}`,
  };
};

/**
 * Turn a successful payment into a confirmed booking. Shared by the browser callback AND the
 * webhook, so it must be idempotent: whoever gets there second just reads the result.
 */
const finalizePayment = async (
  paymentDoc: InstanceType<typeof PaymentModel>,
  gatewayPaymentId: string,
  signature?: string
) => {
  // Atomic "claim": only one caller can move the payment to SUCCESS.
  const claimed = await PaymentModel.findOneAndUpdate(
    { _id: paymentDoc._id, status: { $in: ["CREATED", "FAILED"] } },
    { $set: { status: "SUCCESS", paymentId: gatewayPaymentId, ...(signature ? { signature } : {}) } },
    { new: true }
  );

  if (!claimed) {
    // someone else (webhook / double click) already processed it
    return BookingModel.findById(paymentDoc.booking);
  }

  const booking = await BookingModel.findById(claimed.booking);
  if (!booking) throw createHttpError(404, "Booking not found");
  const showId = String(booking.show);

  const method = await fetchPaymentMethod(claimed.provider, gatewayPaymentId);
  if (method) {
    claimed.method = method;
    await claimed.save();
  }

  // The money is taken - now try to take the seats, all-or-nothing, in one atomic Mongo update.
  const booked = await bookSeatsAtomically(showId, booking.seats);

  if (booked) {
    booking.status = "CONFIRMED";
    await booking.save();
    await releaseLocks(showId, booking.seats); // DB is now the source of truth
    broadcastSeatsBooked(showId, booking.seats);
    return booking;
  }

  // Rare: the seats were taken while the payment was in flight (e.g. hold expired). Refund automatically.
  booking.status = "FAILED";
  await booking.save();
  try {
    const refundId = await refundPayment(claimed.provider, gatewayPaymentId, Math.round(claimed.amount * 100));
    claimed.status = "REFUNDED";
    claimed.refundId = refundId;
    claimed.failureReason = "Seats were no longer available; payment refunded automatically";
  } catch (err) {
    console.error("[payment] AUTO REFUND FAILED - needs manual action", String(claimed._id), err);
    claimed.status = "REFUND_FAILED";
    claimed.failureReason = "Seats were no longer available and the automatic refund failed";
  }
  await claimed.save();
  throw createHttpError(409, "Sorry, those seats were just taken. Your payment will be refunded.");
};

/** Step 2: browser reports a successful payment with Razorpay's signature. */
export const verifyPayment = async (
  userId: string,
  input: { orderId: string; paymentId: string; signature: string }
) => {
  const { orderId, paymentId, signature } = input;
  const payment = await PaymentModel.findOne({ orderId, user: userId });
  if (!payment) throw createHttpError(404, "Order not found");

  if (!verifyCheckoutSignature(payment.provider, orderId, paymentId, signature)) {
    throw createHttpError(400, "Payment signature verification failed");
  }
  return finalizePayment(payment, paymentId, signature);
};

/** Webhook path (payment.captured / order.paid): confirms bookings even if the user closed the tab. */
export const handleWebhookPaid = async (orderId: string, paymentId: string) => {
  const payment = await PaymentModel.findOne({ orderId });
  if (!payment) return null;
  try {
    return await finalizePayment(payment, paymentId);
  } catch (err) {
    // 409 (seats gone + refunded) is a valid terminal state - do not make Razorpay retry forever
    if (createHttpError.isHttpError(err) && err.status === 409) return null;
    throw err;
  }
};

export const markPaymentFailed = async (orderId: string, reason: string, userId?: string) => {
  const filter: any = { orderId, status: "CREATED" };
  if (userId) filter.user = userId;
  await PaymentModel.updateOne(filter, { $set: { status: "FAILED", failureReason: reason.slice(0, 300) } });
};

/** User abandons checkout (back button / timer): free the seats and cancel the pending booking. */
export const cancelPending = async (userId: string, bookingId: string) => {
  if (!Types.ObjectId.isValid(bookingId)) throw createHttpError(400, "Invalid booking id");
  const booking = await BookingModel.findOneAndUpdate(
    { _id: bookingId, user: userId, status: "PENDING" },
    { $set: { status: "CANCELLED" } },
    { new: true }
  );
  if (!booking) return { cancelled: false };
  const released = await unlockSeats(String(booking.show), booking.seats, userId);
  if (released.length) broadcastSeatsUnlocked(String(booking.show), released);
  return { cancelled: true };
};

/** Dev only: signs a mock payment so the full flow can be exercised without Razorpay keys. */
export const mockPay = async (userId: string, orderId: string) => {
  const payment = await PaymentModel.findOne({ orderId, user: userId });
  if (!payment || payment.provider !== "mock") throw createHttpError(404, "Mock order not found");
  const paymentId = `pay_mock_${crypto.randomBytes(8).toString("hex")}`;
  return { orderId, paymentId, signature: signCheckout("mock", orderId, paymentId) };
};
