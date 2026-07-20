import { z } from "zod";
import { MEMBER_ROLE } from "../../constants/memberRole";

export const createRecordSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(3, "Title must be at least 3 characters")
            .max(100, "Title cannot exceed 100 characters"),

        description: z
            .string()
            .trim()
            .max(500, "Description cannot exceed 500 characters")
            .optional(),
    })
});

export const updateRecordSchema = createRecordSchema.partial();

export const addMemberSchema = z.object({
    body: z.object({
        memberId: z.string().min(1, "Member user id is required"),
        role: z.nativeEnum(MEMBER_ROLE),
    })
});

export const updateMemberRoleSchema = z.object({
    body: z.object({
        role: z.nativeEnum(MEMBER_ROLE),
    })
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>["body"];
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>["body"];
export type addMemberInput = z.infer<typeof addMemberSchema>["body"];
export type updateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>["body"];