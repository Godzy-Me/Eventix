import createHttpError from "http-errors";
import { Types } from "mongoose";
import { BookingModel } from "./booking.model";
import { PaymentModel } from "../payment/payment.model";
import { getLockedSeatsForShow } from "../seat-lock/seatLock.service";

const populateShow = {
  path: "show",
  select: "date startTime format audioType location movie theater",
  populate: [
    { path: "movie", select: "title posterUrl certification languages format duration" },
    { path: "theater", select: "name city state location" },
  ],
};

/** Attach the payment method / payment id to each booking for the "Your Orders" page. */
const withPayment = async (bookings: any[]) => {
  const ids = bookings.map((b) => b._id);
  const payments = await PaymentModel.find({ booking: { $in: ids }, status: { $in: ["SUCCESS", "REFUNDED"] } }).lean();
  const byBooking = new Map(payments.map((p) => [String(p.booking), p]));
  return bookings.map((b) => {
    const p = byBooking.get(String(b._id));
    return { ...b, payment: p ? { method: p.method, paymentId: p.paymentId, status: p.status, provider: p.provider } : null };
  });
};

export const getMyBookings = async (userId: string) => {
  const bookings = await BookingModel.find({ user: userId, status: "CONFIRMED" })
    .sort({ createdAt: -1 })
    .populate(populateShow)
    .lean();
  return withPayment(bookings);
};

export const getBookingById = async (userId: string, id: string) => {
  if (!Types.ObjectId.isValid(id)) throw createHttpError(400, "Invalid booking id");
  const booking = await BookingModel.findOne({ _id: id, user: userId }).populate(populateShow).lean();
  if (!booking) throw createHttpError(404, "Booking not found");
  return (await withPayment([booking]))[0];
};

/** The seats this user currently holds in Redis for a show (lets Checkout survive a page refresh). */
export const getMyLocks = async (userId: string, showId: string) => {
  if (!Types.ObjectId.isValid(showId)) throw createHttpError(400, "Invalid show id");
  const locks = await getLockedSeatsForShow(showId);
  const mine = locks.filter((l) => l.userId === userId);
  return {
    seatIds: mine.map((l) => l.seatId),
    ttlSeconds: mine.length ? Math.min(...mine.map((l) => l.ttl)) : 0,
  };
};
