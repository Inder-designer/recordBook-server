import mongoose from "mongoose";
import { IEntry } from "../../types/IEntry";

const EntrySchema = new mongoose.Schema<IEntry>(
    {
        recordId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Record",
            required: true,
            index: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["cashIn", "cashOut"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 1,
        },
        remark: {
            type: String,
            trim: true,
        },
        category: {
            type: String,
            trim: true,
            // Examples: Sale, Purchase, Salary, Expense, Deposit, Withdrawal
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "bank", "upi", "card", "cheque", "online"],
            default: "cash",
        },
        transactionDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
)

EntrySchema.index({ recordId: 1, transactionDate: -1 })
// For user activity
EntrySchema.index({ createdBy: 1, transactionDate: -1 });

export default mongoose.model<IEntry>("Entry", EntrySchema);