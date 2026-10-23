import { Types } from "mongoose";

export type SeatStatus = "AVAILABLE" | "BOOKED" | "BLOCKED";

export interface ISeat {
    number: number;
    status: SeatStatus;
}

export interface ISeatRow {
    row: string;
    type: "PREMIUM" | "EXECUTIVE" | "NORMAL" | string;
    price: number;
    seats: ISeat[];
}

export interface IShow {
    _id?: string;
    movie: Types.ObjectId;
    theater: Types.ObjectId;
    location: string;
    format: "2D" | "3D" | "IMAX" | "PVR PXL";
    audioType?: string;
    startTime: string;
    date: string;
    priceMap: Record<string, number>;
    seatLayout: ISeatRow[];
    createdAt?: Date;
    updatedAt?: Date;
}
