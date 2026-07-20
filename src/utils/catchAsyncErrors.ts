import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncFunc = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const catchAsyncErrors =
  (fn: AsyncFunc): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };