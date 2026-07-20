import { Response } from "express";

export const ResponseHandler = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null,
  meta: any = null
) => {
  return res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
    meta,
  });
};