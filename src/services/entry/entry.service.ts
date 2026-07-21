import mongoose, { ClientSession, Types } from "mongoose";
import Entry from "../../models/record/entry.model";
import Record from "../../models/record/record.model";
import { MEMBER_ROLE } from "../../constants/memberRole";
import { ErrorHandler } from "../../utils/errorhandler";
import { CreateEntryInput, UpdateEntryInput } from "../../schemas/record/enrty.validation";

class EntryService {
    private getMember(record: any, userId: Types.ObjectId) {
        return record.members.find(
            (m: any) => m.user.toString() === userId.toString()
        );
    }

    private canManageEntries(record: any, userId: Types.ObjectId) {
        if (record.createdBy.toString() === userId.toString()) {
            return true;
        }

        const member = this.getMember(record, userId);

        return [
            MEMBER_ROLE.OWNER,
            MEMBER_ROLE.ADMIN,
            MEMBER_ROLE.EDITOR,
        ].includes(member?.role);
    }

    private canDeleteAndUpdateEntries(record: any, userId: Types.ObjectId) {
        if (record.createdBy.toString() === userId.toString()) {
            return true;
        }

        const member = this.getMember(record, userId);

        return [
            MEMBER_ROLE.OWNER,
            MEMBER_ROLE.ADMIN,
        ].includes(member?.role);
    }

    private async withTransaction<T>(
        callback: (session: ClientSession) => Promise<T>
    ): Promise<T> {
        const session = await mongoose.startSession();

        try {
            let result!: T;

            await session.withTransaction(async () => {
                result = await callback(session);
            });

            return result;
        } catch (error) {
            throw error;
        } finally {
            await session.endSession();
        }
    }

    private async updateRecordSummary(
        recordId: Types.ObjectId,
        type: "cashIn" | "cashOut",
        amount: number,
        transaction: 1 | -1,
        session: ClientSession
    ) {
        const update: Record<string, any> = {
            $inc: {
                "summary.totalTransactions": transaction,
            },
        };

        if (type === "cashIn") {
            update.$inc["summary.totalCashIn"] = amount * transaction;
            update.$inc["summary.currentBalance"] = amount * transaction;
        } else {
            update.$inc["summary.totalCashOut"] = amount * transaction;
            update.$inc["summary.currentBalance"] = -amount * transaction;
        }

        await Record.updateOne(
            { _id: recordId },
            update,
            { session }
        );
    }

    async createEntry(
        userId: Types.ObjectId,
        recordId: string,
        payload: CreateEntryInput
    ) {
        return this.withTransaction(async (session) => {

            const record = await Record.findOne({
                _id: recordId,
                isActive: true,
                isDeleted: false,
            }).session(session);

            if (!record) {
                throw new ErrorHandler("Record not found", 404);
            }

            if (!this.canManageEntries(record, userId)) {
                throw new ErrorHandler("Permission denied", 403);
            }

            const [entry] = await Entry.create(
                [
                    {
                        ...payload,
                        recordId,
                        createdBy: userId,
                    },
                ],
                { session }
            );

            await this.updateRecordSummary(
                record._id,
                entry.type,
                entry.amount,
                1,
                session
            );

            await entry.populate("createdBy", "fullName email");

            return entry;
        });
    }

    async getEntries(
        userId: Types.ObjectId,
        recordId: string | string[]
    ) {
        const record = await Record.findOne({
            _id: recordId,
            isActive: true,
            isDeleted: false,
            $or: [
                { createdBy: userId },
                { "members.user": userId },
            ],
        });

        if (!record) {
            throw new ErrorHandler("Record not found", 404);
        }

        return await Entry.find({ recordId })
            .populate("createdBy", "fullName email")
            .sort({ transactionDate: -1 });
    }

    async getEntryById(
        userId: Types.ObjectId,
        entryId: string | string[]
    ) {
        const entry = await Entry.findById(entryId);

        if (!entry) {
            throw new ErrorHandler("Entry not found", 404);
        }

        const record = await Record.findOne({
            _id: entry.recordId,
            $or: [
                { createdBy: userId },
                { "members.user": userId },
            ],
        });

        if (!record) {
            throw new ErrorHandler("Permission denied", 403);
        }

        return entry;
    }

    async updateEntry(
        userId: Types.ObjectId,
        recordId: string,
        entryId: string,
        payload: UpdateEntryInput
    ) {
        return this.withTransaction(async (session) => {

            const entry = await Entry.findById(entryId).session(session);

            if (!entry) {
                throw new ErrorHandler("Entry not found", 404);
            }

            const record = await Record.findById(recordId).session(session);

            if (!record) {
                throw new ErrorHandler("Record not found", 404);
            }

            if (!this.canDeleteAndUpdateEntries(record, userId)) {
                throw new ErrorHandler("Permission denied", 403);
            }

            // Remove old values
            await this.updateRecordSummary(
                record._id,
                entry.type,
                entry.amount,
                -1,
                session
            );

            Object.assign(entry, payload);

            await entry.save({ session });

            // Add new values
            await this.updateRecordSummary(
                record._id,
                entry.type,
                entry.amount,
                1,
                session
            );

            await entry.populate("createdBy", "fullName email");
            return entry;
        });
    }

    async deleteEntry(
        userId: Types.ObjectId,
        entryId: string
    ) {
        return this.withTransaction(async (session) => {

            const entry = await Entry.findById(entryId).session(session);

            if (!entry) {
                throw new ErrorHandler("Entry not found", 404);
            }

            const record = await Record.findById(entry.recordId).session(session);

            if (!record) {
                throw new ErrorHandler("Record not found", 404);
            }

            if (!this.canDeleteAndUpdateEntries(record, userId)) {
                throw new ErrorHandler("Permission denied", 403);
            }

            await this.updateRecordSummary(
                record._id,
                entry.type,
                entry.amount,
                -1,
                session
            );

            await entry.deleteOne({ session });

            return true;
        });
    }

}

export default new EntryService();