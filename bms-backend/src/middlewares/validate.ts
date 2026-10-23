import { AnyZodObject } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body); // ensures type safety at runtime
      next();
    } catch (error) {
      next(error); // global error handler takes care
    }
  };