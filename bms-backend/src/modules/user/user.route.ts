import express from 'express';
import * as UserController from './user.controller';
import {isVerifiedUser, isAdmin} from "../../middlewares/auth.middleware"

const router = express.Router();

router.post('/', isVerifiedUser, isAdmin, UserController.createUser);
router.get('/', isVerifiedUser, isAdmin, UserController.getAllUsers);
router.get('/me',isVerifiedUser, UserController.getUserById);
router.put('/activate/:id',isVerifiedUser, UserController.activateUser);

export default router;
