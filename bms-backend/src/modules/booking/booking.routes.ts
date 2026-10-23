import express from "express";
import * as BookingController from "./booking.controller";
import { isVerifiedUser } from "../../middlewares/auth.middleware";

const router = express.Router();

router.get("/my", isVerifiedUser, BookingController.getMyBookings);
router.get("/locks/:showId", isVerifiedUser, BookingController.getMyLocks);
router.get("/:id", isVerifiedUser, BookingController.getBookingById);

export default router;
