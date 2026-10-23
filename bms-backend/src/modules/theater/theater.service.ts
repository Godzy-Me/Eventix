import mongoose from "mongoose"
import {TheaterModel} from "./theater.model"



// 1. CreateTheater

import { ITheater } from "./theater.interface";

export const createTheater = async (data: ITheater): Promise<ITheater> => {
    return await TheaterModel.create(data);
}

// 2. GetAllTheaters

export const getAllTheaters = async (): Promise<ITheater[]> => {
    return await TheaterModel.find();
}

// 3. GetTheaterById

export const getTheaterById = async (id: string): Promise<ITheater | null> => {
    return await TheaterModel.findById(id);
}

// 4. GetTheaterByState

export const getTheaterByState = async (state: string): Promise<ITheater[]> => {
    return await TheaterModel.find({ state: {$regex: state, $options: "i"} });
}