import { Types } from "mongoose";

export type PaymentStatus = "CREATED" | "SUCCESS" | "FAILED" | "REFUNDED" | "REFUND_FAILED";

export interface IPayment {
  _id?: string;
  booking: Types.ObjectId;
  user: Types.ObjectId;
  provider: "razorpay" | "mock";
  orderId: string; // gateway order id
  paymentId?: string; // gateway payment id (known after checkout)
  signature?: string;
  method?: string; // card / upi / netbanking / wallet ...
  amount: number; // in rupees
  currency: string;
  status: PaymentStatus;
  failureReason?: string;
  refundId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
