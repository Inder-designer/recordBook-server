import { Document, Types } from "mongoose";

export interface IUser extends Document {
    _id: Types.ObjectId,
    fullName: string;
    email: string;
    number: string;
    password: string;

    initials?: string;
    avatarUrl?: string;

    isActive: boolean;
    last_active?: Date;

    sessionId?: string;
    isDeleted: boolean;

    comparePassword(password: string): Promise<boolean>;
}