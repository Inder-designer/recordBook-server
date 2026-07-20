import { z } from "zod";

export const createUserSchema = z.object({
    body: z.object({
        fullName: z.string().trim().nonempty("Name is required").min(2, "Name must be at least 2 characters long").max(100, "Name must be at most 100 characters long"),
        email: z.string().nonempty("Email is required").email("Invalid email address"),
        password: z.string().nonempty("Password is required").min(6, "Password must be at least 6 characters long"),
        confirmPassword: z.string().nonempty("Confirm Password is required"),
        number: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>["body"];