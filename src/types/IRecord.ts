import { Document, Types } from "mongoose";
import { MemberRole } from "../constants/memberRole";

interface IMember {
    user: Types.ObjectId;
    role: MemberRole;
}

interface ISummary {
    totalCashIn: Number;
    totalCashOut: Number;
    currentBalance: Number;
    totalTransactions: Number;
}

export interface IRecord extends Document {
    createdBy: Types.ObjectId;
    title: String,
    description: String,
    members: IMember[];
    isActive: Boolean,
    isDeleted: Boolean,
    createdAt: Date;
    updatedAt: Date;
    summary: ISummary
}