import { Request, Response } from "express";
import { catchAsyncErrors } from "../../utils/catchAsyncErrors";
import { ResponseHandler } from "../../utils/resHandler";
import { IUser } from "../../types/IUser";
import EntryService from "../../services/entry/entry.service";

export const createEntry = catchAsyncErrors(
    async (req: Request, res: Response) => {
        const user = req.user as IUser;

        const entry = await EntryService.createEntry(
            user._id,
            req.params.recordId as string,
            req.body
        );

        return ResponseHandler(
            res,
            201,
            "Entry created successfully",
            entry
        );
    }
);

export const getEntries = catchAsyncErrors(
    async (req: Request, res: Response) => {
        const user = req.user as IUser;

        const { entries, pagination, summary } = await EntryService.getEntries(
            user._id,
            req.params.recordId as string,
            req.query as any
        );

        return ResponseHandler(
            res,
            200,
            "Entries fetched successfully",
            entries,
            {
                totalEntries: entries.length,
                pagination,
                summary
            }
        );
    }
);

export const getEntryById = catchAsyncErrors(
    async (req: Request, res: Response) => {
        const user = req.user as IUser;

        const entry = await EntryService.getEntryById(
            user._id,
            req.params.entryId
        );

        return ResponseHandler(
            res,
            200,
            "Entry fetched successfully",
            entry
        );
    }
);

export const updateEntry = catchAsyncErrors(
    async (req: Request, res: Response) => {
        const user = req.user as IUser;

        const entry = await EntryService.updateEntry(
            user._id,
            req.params.recordId as string,
            req.params.entryId as string,
            req.body
        );

        return ResponseHandler(
            res,
            200,
            "Entry updated successfully",
            entry
        );
    }
);

export const deleteEntry = catchAsyncErrors(
    async (req: Request, res: Response) => {
        const user = req.user as IUser;

        await EntryService.deleteEntry(
            user._id,
            req.params.entryId as string
        );

        return ResponseHandler(
            res,
            200,
            "Entry deleted successfully"
        );
    }
);