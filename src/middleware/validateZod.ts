import { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";

export const validateZod =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (e: any) {
      return res.status(400).json({
        success: false,
        errors: e.issues,
      });
    }
  };