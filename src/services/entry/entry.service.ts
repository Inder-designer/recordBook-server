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

    // async getEntries(
    //     userId: Types.ObjectId,
    //     recordId: string | string[]
    // ) {
    //     const record = await Record.findOne({
    //         _id: recordId,
    //         isActive: true,
    //         isDeleted: false,
    //         $or: [
    //             { createdBy: userId },
    //             { "members.user": userId },
    //         ],
    //     });

    //     if (!record) {
    //         throw new ErrorHandler("Record not found", 404);
    //     }

    //     return await Entry.find({ recordId })
    //         .populate("createdBy", "fullName email")
    //         .sort({ transactionDate: -1 });
    // }

    async getEntries(
        userId: Types.ObjectId,
        recordId: string,
        query: {
            startDate?: string;
            endDate?: string;
            type?: string;
            paymentMethod?: string;
            member?: string;
            page?: number;
            limit?: number;
        }
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

        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;

        const match: any = {
            recordId: new Types.ObjectId(recordId),
        };

        if (query.type) {
            match.type = query.type;
        }

        if (query.paymentMethod) {
            match.paymentMethod = query.paymentMethod;
        }

        if (query.member) {
            match.createdBy = new Types.ObjectId(query.member);
        }

        if (query.startDate || query.endDate) {
            match.transactionDate = {};

            if (query.startDate) {
                match.transactionDate.$gte = new Date(query.startDate);
            }

            if (query.endDate) {
                const end = new Date(query.endDate);
                end.setHours(23, 59, 59, 999);
                match.transactionDate.$lte = end;
            }
        }

        const [result] = await Entry.aggregate([
            {
                $match: match,
            },

            {
                $facet: {
                    entries: [
                        {
                            $sort: {
                                transactionDate: -1,
                            },
                        },
                        {
                            $skip: skip,
                        },
                        // {
                        //     $limit: limit,
                        // },
                        {
                            $lookup: {
                                from: "users",
                                localField: "createdBy",
                                foreignField: "_id",
                                as: "createdBy",
                            },
                        },
                        {
                            $unwind: "$createdBy",
                        },
                        {
                            $project: {
                                amount: 1,
                                type: 1,
                                remark: 1,
                                category: 1,
                                paymentMethod: 1,
                                transactionDate: 1,
                                createdAt: 1,
                                "createdBy._id": 1,
                                "createdBy.fullName": 1,
                                "createdBy.email": 1,
                            },
                        },
                    ],

                    pagination: [
                        {
                            $count: "total",
                        },
                    ],

                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalCashIn: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$type", "cashIn"] },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                totalCashOut: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$type", "cashOut"] },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                totalTransactions: {
                                    $sum: 1,
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                totalCashIn: 1,
                                totalCashOut: 1,
                                totalTransactions: 1,
                                currentBalance: {
                                    $subtract: [
                                        "$totalCashIn",
                                        "$totalCashOut",
                                    ],
                                },
                            },
                        },
                    ],
                },
            },
        ]);

        const total = result.pagination[0]?.total || 0;

        return {
            entries: result.entries,
            summary: result.summary[0] || {
                totalCashIn: 0,
                totalCashOut: 0,
                currentBalance: 0,
                totalTransactions: 0,
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
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