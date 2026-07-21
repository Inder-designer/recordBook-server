import { z } from "zod";

export const createEntrySchema = z.object({
    body: z.object({
        type: z.enum(["cashIn", "cashOut"], {
            message: "Type must be cashIn or cashOut",
        }),

        amount: z
            .number()
            .positive("Amount must be greater than 0")
            .max(999999999, "Amount can't be greater than 999999999"),

        remark: z
            .string()
            .max(150, "Remark cannot exceed 150 characters")
            .optional(),

        category: z
            .string()
            .max(50, "Category cannot exceed 100 characters")
            .optional(),

        paymentMethod: z
            .enum(["cash", "bank", "upi", "card", "cheque", "online"])
            .optional(),

        transactionDate: z
            .string()
            .datetime()
            .optional()
    })
});

export const updateEntrySchema = createEntrySchema.partial();

export type CreateEntryInput = z.infer<typeof createEntrySchema>["body"];
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>["body"];