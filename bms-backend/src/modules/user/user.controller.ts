import { NextFunction, Response, Request } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import * as UserService from "./user.service";

const ActivateSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(60),
    phone: z
        .string()
        .trim()
        .regex(/^\d{10}$/, "Enter a valid 10 digit mobile number"),
});

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await UserService.createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await UserService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await UserService.getUserById(req.user?._id);

        if (!user) {
            return next(createHttpError(404, "User not found"));
        }

        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

export const activateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.id;

        // you can only activate your own account
        if (String(req.user?._id) !== userId) {
            return next(createHttpError(403, "You can only update your own account"));
        }

        const { name, phone } = ActivateSchema.parse(req.body);

        // whitelist the fields - never pass req.body straight to the DB (role escalation)
        const updatedUser = await UserService.activateUser(userId, {
            name,
            phone: Number(phone),
            activateUser: true,
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        next(error);
    }
};
