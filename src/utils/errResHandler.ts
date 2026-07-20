import { Response } from "express";

export const errResHandler = (
  res: Response,
  statusCode: number = 500,
  message: string = "Something went wrong"
) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};