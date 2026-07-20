import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ErrorHandler } from "../utils/errorhandler";

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, any>;
  path?: string;
}

export const errorMiddleware = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  error.statusCode = error.statusCode || 500;
  error.message = error.message || "Internal Server Error";

  // ------------------------
  // CastError (Invalid ObjectId)
  // ------------------------
  if (error.name === "CastError") {
    const message = `Resource not found. Invalid: ${error.path}`;
    error = new ErrorHandler(message, 400);
  }

  // ------------------------
  // Duplicate Key Error
  // ------------------------
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {}).join(", ");
    const message = `Duplicate field value entered: ${field}`;
    error = new ErrorHandler(message, 400);
  }

  // ------------------------
  // Mongoose Validation Error
  // ------------------------
  if (error instanceof mongoose.Error.ValidationError) {
    const message = Object.values(error.errors)
      .map((val: any) => val.message)
      .join(", ");

    error = new ErrorHandler(message, 400);
  }

  // ------------------------
  // JWT Errors
  // ------------------------
  if (error.name === "JsonWebTokenError") {
    error = new ErrorHandler(
      "Invalid JSON Web Token, please login again",
      401
    );
  }

  if (error.name === "TokenExpiredError") {
    error = new ErrorHandler(
      "JSON Web Token has expired, please login again",
      401
    );
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
  });
};