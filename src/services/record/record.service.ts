import { Types } from "mongoose";
import Record from "../../models/record/record.model";
import { MEMBER_ROLE, MemberRole } from "../../constants/memberRole";
import { addMemberInput, CreateRecordInput, UpdateRecordInput } from "../../schemas/record/record.validation";
import { ErrorHandler } from "../../utils/errorhandler";
import User from "../../models/user/User";
import { IRecord } from "../../types/IRecord";
import { recordSummaryPipeline } from "../../aggregations/recordSummary.pipeline";

class RecordService {
    private hasPermission(
        record: IRecord,
        userId: Types.ObjectId,
        ownerOnly = false
    ) {
        const member = record.members.find(
            (m: any) => m.user.toString() === userId.toString()
        );

        if (record.createdBy.toString() === userId.toString()) {
            return true;
        }

        if (member?.role === MEMBER_ROLE.OWNER) {
            return true;
        }

        if (!ownerOnly && member?.role === MEMBER_ROLE.ADMIN) {
            return true;
        }

        return false;
    }

    async createRecord(userId: Types.ObjectId, payload: CreateRecordInput) {
        const members = [
            {
                user: userId,
                role: MEMBER_ROLE.OWNER,
            },
        ];
        const record = await Record.create({
            title: payload.title,
            description: payload.description,
            createdBy: userId,
            members
        })

        return record;
    }

    async getUserRecords(userId: Types.ObjectId) {
        return Record.find({
            $or: [
                { createdBy: userId },
                { "members.user": userId },
            ],
            isActive: true,
            isDeleted: false,
        })
            .populate("createdBy", "fullName email")
            .populate("members.user", "fullName email")
            .sort({ createdAt: -1 });;
    }

    async getRecordById(userId: Types.ObjectId, id: string | string[]) {
        const record = await Record.findOne({
            _id: id,
            $or: [
                { createdBy: userId },
                { "members.user": userId },
            ],
            isActive: true,
            isDeleted: false,
        })
            .populate("createdBy", "fullName email")
            .populate("members.user", "fullName email");

        if (!record) {
            throw new ErrorHandler("Record not found", 404);
        }

        return record

    }

    async updateRecord(userId: Types.ObjectId, recordId: string | string[], payload: UpdateRecordInput) {
        const record = await Record.findOne({
            _id: recordId,
            isActive: true,
            isDeleted: false,
        });

        if (!record) {
            throw new ErrorHandler("Record not found", 404);
        }

        if (!this.hasPermission(record, userId)) {
            throw new ErrorHandler(
                "You do not have permission",
                403
            );
        }

        Object.assign(record, payload);
        await record.save();

        return record;
    }

    async deleteRecord(userId: Types.ObjectId, recordId: string | string[]) {
        const record = await Record.findOne({
            _id: recordId,
            isActive: true,
            isDeleted: false,
        });
        if (!record) {
            throw new ErrorHandler("Record not found", 404);
        }
        if (!this.hasPermission(record, userId, true)) {
            throw new ErrorHandler(
                "You do not have permission",
                403
            );
        }
        record.isDeleted = true;
        record.isActive = false;

        await record.save();

        return record;
    }

    async addMember(
        userId: Types.ObjectId,
        recordId: string | string[],
        payload: addMemberInput
    ) {
        const record = await Record.findOne({
            _id: recordId,
            isActive: true,
            isDeleted: false,
        });

        if (!record) {
            throw new ErrorHandler("Record not found", 404);
        }
        const user = await User.findById(payload.memberId);

        if (!user) {
            throw new ErrorHandler(
                "User not found",
                404
            );
        }

        if (!this.hasPermission(record, userId)) {
            throw new ErrorHandler(
                "You do not have permission",
                403
            );
        }

        if (payload.role === MEMBER_ROLE.OWNER) {
            throw new ErrorHandler(
                "Owner role cannot be assigned",
                400
            );
        }
        if (payload.memberId === userId.toString()) {
            throw new ErrorHandler(
                "You cannot add yourself",
                400
            );
        }

        const memberExists = record.members.some(
            (m) => m.user.toString() === payload.memberId
        );

        if (memberExists) {
            throw new ErrorHandler(
                "User is already a member",
                400
            );
        }

        record.members.push({
            user: new Types.ObjectId(payload.memberId),
            role: payload.role as MemberRole,
        });

        await record.save();

        await record.populate([
            { path: "createdBy", select: "fullName email" },
            { path: "members.user", select: "fullName email" },
        ]);

        return record;
    }

    async removeMember(
        userId: Types.ObjectId,
        recordId: string | string[],
        memberUserId: string | string[]
    ) {
        const record = await Record.findOne({
            _id: recordId,
            isActive: true,
            isDeleted: false,
        });

        if (!record) {
            throw new ErrorHandler("Record not found", 404);
        }

        if (!this.hasPermission(record, userId, true)) {
            throw new ErrorHandler(
                "You do not have permission",
                403
            );
        }

        if (record.createdBy.toString() === memberUserId) {
            throw new ErrorHandler(
                "Record creator cannot be removed",
                400
            );
        }
        const memberIndex = record.members.findIndex(
            (m) => m.user.toString() === memberUserId
        );

        if (memberIndex === -1) {
            throw new ErrorHandler(
                "Member not found",
                404
            );
        }

        record.members.splice(memberIndex, 1);

        await record.save();

        return await record.populate(
            "members.user",
            "fullName email"
        );
    }

    async updateMemberRole(
        userId: Types.ObjectId,
        recordId: string | string[],
        memberId: string | string[],
        role: MemberRole
    ) {
        const record = await Record.findOne({
            _id: recordId,
            isActive: true,
            isDeleted: false,
        });

        if (!record) {
            throw new ErrorHandler("Record not found", 404);
        }

        if (!this.hasPermission(record, userId, true)) {
            throw new ErrorHandler(
                "You do not have permission",
                403
            );
        }

        if (role === MEMBER_ROLE.OWNER) {
            throw new ErrorHandler(
                "Owner role cannot be assigned",
                400
            );
        }

        if (record.createdBy.toString() === memberId) {
            throw new ErrorHandler(
                "Creator role cannot be modified",
                400
            );
        }

        const member = record.members.find(
            (m) => m.user.toString() === memberId
        );

        if (!member) {
            throw new ErrorHandler(
                "Member not found",
                404
            );
        }

        member.role = role;

        await record.save();

        return await record.populate(
            "members.user",
            "fullName email"
        );
    }
}

export default new RecordService(); 