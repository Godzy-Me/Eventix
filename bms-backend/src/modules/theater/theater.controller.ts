import { Request, Response, NextFunction } from "express";
import * as theaterService from "./theater.service";

export const createTheater = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const theater = await theaterService.createTheater(req.body);

        res.status(201).json({
            success: true,
            message: "Theater created successfully",
            data: theater,
        });
    } catch (error) {
        next(error);
    }
};

export const getTheaters = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { state } = req.query;
        let theaters;

        if (state) {
            theaters = await theaterService.getTheaterByState(state as string);
        }

        res.status(200).json(theaters);
    } catch (error) {
        next(error);
    }
};