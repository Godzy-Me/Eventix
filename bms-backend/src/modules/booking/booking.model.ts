import mongoose, { Schema } from "mongoose";
import { IBooking } from "./booking.interface";

const seatDetailSchema = new Schema(
  {
    seatId: { type: String, required: true },
    row: { type: String, required: true },
    number: { type: Number, required: true },
    type: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const bookingSchema = new Schema<IBooking>(
  {
    bookingCode: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    show: { type: Schema.Types.ObjectId, ref: "Show", required: true, index: true },
    seats: { type: [String], required: true },
    seatDetails: { type: [seatDetailSchema], required: true },
    baseAmount: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED", "FAILED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export const BookingModel = mongoose.model<IBooking>("Booking", bookingSchema);
