import { NextFunction, Request, Response } from 'express';
import { catchAsyncErrors } from "../../utils/catchAsyncErrors";
import { ResponseHandler } from '../../utils/resHandler';
import { IUser } from '../../types/IUser';
import RecordService from '../../services/record/record.service';

export const createRecord = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as IUser

        const record = await RecordService.createRecord(
            user._id,
            req.body
        );

        return ResponseHandler(res, 201, "Record created successfully", record);
    }
)

export const getUserRecords = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as IUser
        const records = await RecordService.getUserRecords(
            user._id
        );
        return ResponseHandler(res, 200, "Records fetched successfully", records, { totalRecords: records.length });
    }
)

export const getRecordById = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as IUser
        const { id } = req.params;

        const record = await RecordService.getRecordById(user._id, id);
        return ResponseHandler(res, 200, "Records fetched successfully", record);
    }
)

export const deleteRecord = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as IUser
        const { id } = req.params;
        await RecordService.deleteRecord(user._id, id)

        return ResponseHandler(res, 200, "Record deleted successfully");
    }
)

export const updateRecord = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as IUser
        const { id } = req.params;
        const updatedRecord = await RecordService.updateRecord(
            user._id,
            id,
            req.body
        );

        return ResponseHandler(res, 200, "Record updated successfully", updatedRecord);
    }
)

export const addMember = catchAsyncErrors(
    async (req: Request, res: Response) => {
        const user = req.user as IUser
        const record = await RecordService.addMember(
            user._id,
            req.params.recordId,
            req.body
        );

        return ResponseHandler(
            res,
            200,
            "Member added successfully",
            record
        );
    }
);

export const removeMember = catchAsyncErrors(
    async (req: Request, res: Response) => {
        const user = req.user as IUser
        const record = await RecordService.removeMember(
            user._id,
            req.params.recordId,
            req.params.memberId
        );

        return ResponseHandler(
            res,
            200,
            "Member removed successfully",
            record
        );
    }
);

export const updateMemberRole = catchAsyncErrors(
    async (req: Request, res: Response) => {
        const user = req.user as IUser
        const record = await RecordService.updateMemberRole(
            user._id,
            req.params.recordId,
            req.params.memberId,
            req.body.role
        );

        return ResponseHandler(
            res,
            200,
            "Member role updated successfully",
            record
        );
    }
);