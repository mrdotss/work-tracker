import { z } from "zod";

// Login
export const loginSchema = z.object({
    username: z
        .string()
        .min(3, { message: "Username must contain at least 3 characters" }),
    password: z
        .string()
        .min(6, { message: "Password must contain at least 6 characters" }),
});
export type LoginInput = z.infer<typeof loginSchema>;
