import mongoose from "mongoose";
import { IRecord } from "../../types/IRecord";
import { MEMBER_ROLE } from "../../constants/memberRole";

const MemberSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        role: {
            type: Number,
            enum: Object.values(MEMBER_ROLE),
            default: MEMBER_ROLE.VIEWER,
        },
    },
    { _id: false }
);

const RecordSchema = new mongoose.Schema<IRecord>(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: { type: String, default: null },
        members: {
            type: [MemberSchema],
            default: [],
        },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
        summary: {
            totalCashIn: {
                type: Number,
                default: 0,
            },
            totalCashOut: {
                type: Number,
                default: 0,
            },
            currentBalance: {
                type: Number,
                default: 0,
            },
            totalTransactions: {
                type: Number,
                default: 0,
            },
        },
    },
    {
        timestamps: true,
    }
)

RecordSchema.index({ createdBy: 1 });
RecordSchema.index({ "members.user": 1 });
RecordSchema.index({ title: 1, createdBy: 1 });

export default mongoose.model<IRecord>("Record", RecordSchema)