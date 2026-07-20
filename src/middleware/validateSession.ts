import { Request, Response, NextFunction } from "express";
import { Session } from "express-session";
import { IUser } from "../types/IUser";
import User from "../models/user/User";

interface SessionWithCustom extends Session {
  sessionId?: string;
}

export const validateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ❌ BLOCK if not authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({
        message: "Unauthorized. Please login again.",
      });
    }

    const currentUser = req.user as IUser;
    const sessionId =
      (req.session as SessionWithCustom).sessionId || req.sessionID;

    // Fetch latest user
    const dbUser = await User.findById(currentUser._id);

    if (!dbUser) {
      await new Promise<void>((resolve, reject) => {
        req.logout((err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
      });

      return res.status(401).json({
        message: "User not found. Session cleared.",
        forceLogout: true,
      });
    }

    // Single-session enforcement
    if (dbUser.sessionId && dbUser.sessionId !== sessionId) {
      await new Promise<void>((resolve, reject) => {
        req.logout((err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
      });

      return res.status(401).json({
        message:
          "You were logged out because your account was used on another device.",
        forceLogout: true,
      });
    }

    next();
  } catch (error) {
    console.error("Session validation error:", error);
    next(error);
  }
};