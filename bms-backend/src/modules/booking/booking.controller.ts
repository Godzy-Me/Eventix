import { Request, Response, NextFunction } from "express";
import * as BookingService from "./booking.service";

export const getMyBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ bookings: await BookingService.getMyBookings(String(req.user._id)) });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ booking: await BookingService.getBookingById(String(req.user._id), req.params.id) });
  } catch (error) {
    next(error);
  }
};

export const getMyLocks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await BookingService.getMyLocks(String(req.user._id), req.params.showId));
  } catch (error) {
    next(error);
  }
};
