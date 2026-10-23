
import { Router } from 'express';
import * as showController from './show.controller';
import { isVerifiedUser, isAdmin } from '../../middlewares/auth.middleware';

const router = Router();

router.post("/", isVerifiedUser, isAdmin, showController.createShow);
router.get("/", showController.getShowsByMovieDateLocation);
router.get("/:id", showController.getShowById);
// manual seat override - admin only (users book seats through the payment flow)
router.put("/:showId", isVerifiedUser, isAdmin, showController.updateSeatStatus);

export default router;
