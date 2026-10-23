import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import * as ShowService from './show.service';

export const createShow = async(req: Request, res: Response, next: NextFunction)=> {
    try{
        const show = await ShowService.createShow(req.body);
        res.status(201).json(show);
    }catch(error) {
        next(error);
    }
}


export const getShowsByMovieDateLocation = async(req: Request, res: Response, next: NextFunction)=> {
    try{
        const {movieId,state,date} = req.query;
        if (!movieId) throw createHttpError(400, "movieId is required");
        const shows = await ShowService.getShowsByMovieDateLocation(
            movieId as string,
            date as string,
            state as string
        )

        res.status(200).json(shows);
    } catch (error){
        next(error);
    }
}


export const getShowById = async(req: Request, res: Response, next: NextFunction)=> {
    try{
        const show = await ShowService.getShowById(req.params.id);
        if (!show) throw createHttpError(404, "Show not found");
        res.status(200).json(show);
    }catch (error){
        next(error);
    }
}

export const updateSeatStatus = async(req: Request, res: Response, next: NextFunction)=> {
    try{
        const {row,seatNumber,status}=req.query;

        const updatedShow = await ShowService.updatedSeatStatus(req.params.showId,row as string
            ,Number(seatNumber),status as "AVAILABLE" | "BOOKED" | "BLOCKED");

            res.status(200).json(updatedShow);
        
    }catch(error){
        next(error);
    }
}
