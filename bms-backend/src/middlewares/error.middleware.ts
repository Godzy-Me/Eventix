import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { JsonWebTokenError } from "jsonwebtoken";

export const globalErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    //Default Response
    let statusCode = 500;
    let message = "Something went wrong"
    let errors : {
        field? : string;
        message: string
    }[] = []

    if(err instanceof ZodError){
        statusCode = 400;
        message = "Validation Error"
        errors = err.errors.map((e) => {
            return {
                field: e.path.join('.'),
                message: e.message
            }
        })
    }else if(createHttpError.isHttpError(err)){
        // errors created with http-errors keep their own status code (401, 404, 409...)
        statusCode = err.status;
        message = err.message;
    }else if(err instanceof mongoose.Error.CastError){
        statusCode = 400;
        message = `Invalid ${err.path}`;
    }else if(err instanceof JsonWebTokenError){
        statusCode = 401;
        message = "Invalid or expired token";
    }else if(err instanceof Error){
        console.error("[error]", err);
        // do not leak internals in production
        message = process.env.NODE_ENV === "production" ? "Something went wrong" : err.message
    }

    res.status(statusCode).json({
        success: false,
        message,
        errors
    })

}
