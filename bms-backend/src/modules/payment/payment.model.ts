import mongoose, { Schema } from "mongoose";
import { IPayment } from "./payment.interface";

const paymentSchema = new Schema<IPayment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, enum: ["razorpay", "mock"], required: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String },
    signature: { type: String },
    method: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["CREATED", "SUCCESS", "FAILED", "REFUNDED", "REFUND_FAILED"],
      default: "CREATED",
    },
    failureReason: { type: String },
    refundId: { type: String },
  },
  { timestamps: true }
);

export const PaymentModel = mongoose.model<IPayment>("Payment", paymentSchema);
