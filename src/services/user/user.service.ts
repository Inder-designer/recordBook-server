import User from "../../models/user/User";
import { CreateUserInput } from "../../schemas/user/user.schema";
import { ErrorHandler } from "../../utils/errorhandler";
import { initialsGenerate } from "../../utils/initialsGenerate";

export const createUserService = async (userData: CreateUserInput) => {

    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        throw new ErrorHandler("User with this email already exists", 409);
    }

    const { confirmPassword, ...user } = userData;
    const newUser = await User.create({
        ...user,
        initials: initialsGenerate(user.fullName),
        isActive: true
    })

    return newUser;
}

export const findUserService = async (
    email: string
) => {
    const user = await User.findOne({ email: email.toLowerCase() }).select("_id fullName email");
    if (!user) {
        throw new ErrorHandler(
            "User not found",
            404
        );
    }

    return user
}
