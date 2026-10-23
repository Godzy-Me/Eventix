import { Types } from "mongoose";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";

export interface IBookingSeat {
  seatId: string; // e.g. "A12"
  row: string;
  number: number;
  type: string;
  price: number;
}

export interface IBooking {
  _id?: string;
  bookingCode: string; // short human friendly id shown on the ticket
  user: Types.ObjectId;
  show: Types.ObjectId;
  seats: string[]; // seat ids
  seatDetails: IBookingSeat[];
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
