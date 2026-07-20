import { Document, Types } from "mongoose";

export interface IEntry extends Document {
    recordId: Types.ObjectId;
    createdBy: Types.ObjectId;
    type: "cashIn" | "cashOut";
    amount: number;
    remark?: string;
    category?: string;
    paymentMethod: "cash" | "bank" | "upi" | "card" | "cheque" | "online";
    transactionDate: Date;
    createdAt: Date;
    updatedAt: Date;
}