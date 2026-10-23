import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import * as TokenService from "../modules/auth/token.service";
import * as UserService from "../modules/user/user.service"
import {JwtPayload} from "jsonwebtoken"

// Extend express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

interface TokenPayload extends JwtPayload{
    _id:string;
}

export const isVerifiedUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { accessToken } = req.cookies;

        if (!accessToken) {
            return next(createHttpError(401, "Access token is missing"));
        }

        const decodedToken = TokenService.verifyAccessToken(accessToken) as TokenPayload;

        const user = await UserService.getUserById(decodedToken._id);

        if (!user) {
            return next(createHttpError(404, "User not found"));
        }

        req.user = user;
        next();


    } catch (error) {
        return next(createHttpError(401, "Invalid or expired token"));
    }
};

/** Use after isVerifiedUser. */
export const isAdmin = (req: Request, _res: Response, next: NextFunction) => {
    if (req.user?.role !== "admin") {
        return next(createHttpError(403, "Admin access required"));
    }
    next();
};
