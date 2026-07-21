import { NextFunction, Request, Response } from 'express';
import { createUserService, findUserService } from "../../services/user/user.service";
import { catchAsyncErrors } from "../../utils/catchAsyncErrors";
import { ResponseHandler } from '../../utils/resHandler';
import { CreateUserInput } from '../../schemas/user/user.schema';
import passport from 'passport';
import { IUser } from '../../types/IUser';
import { ErrorHandler } from '../../utils/errorhandler';

export const createUser = catchAsyncErrors(
    async (req: Request<{}, {}, CreateUserInput>, res: Response,) => {
        const newUser = await createUserService(req.body);
        const { password, ...user } = newUser.toObject();

        return ResponseHandler(res, 201, "User created successfully", user);
    }
);

export const loginUser = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {

        passport.authenticate("local", async (err: unknown, user: IUser, info: Record<string, any>) => {
            if (err) return next(err);
            if (!user) {
                return next(new ErrorHandler(info.message || "Invalid credentials", 401));
            }

            // Create a session
            req.logIn(user, (err) => {
                if (err) return next(err);

                const userData = user.toObject();
                delete userData.password;

                return res.status(200).json({
                    message: "Logged in successfully",
                    user: userData,
                });
            });
        })(req, res, next);
    }
);

export const logout = (req: Request, res: Response, next: NextFunction) => {
    // Clear sessionId from user document
    const user = req.user as IUser;

    req.logout((err) => {
        if (err) {
            return next(new ErrorHandler(err, 500));
        }
        res.clearCookie("connect.sid")
        req.session.destroy(() => { })
        return ResponseHandler(res, 200, "Logged out successfully", null)
    })
}

export const getMe = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as IUser;

        if (!user) {
            return next(new ErrorHandler("User not authenticated", 401));
        }
        return ResponseHandler(res, 200, "Profile fetched successfully", user)
    }
)

export const findUser = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = await findUserService(req.query.email as string)

        return ResponseHandler(res, 200, "User found successfully", user);
    }
)