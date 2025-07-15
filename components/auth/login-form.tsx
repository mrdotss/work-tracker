"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm, SubmitHandler } from "react-hook-form";
import {loginSchema, type LoginInput} from "@/lib/schemas";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner";

export function LoginForm({
                              className,
                              ...props
                          }: React.ComponentProps<"form">) {
    const [authError, setAuthError] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit: SubmitHandler<LoginInput> = async (data) => {
        setAuthError(null);
        const res = await signIn("credentials", {
            redirect: false,
            username: data.username,
            password: data.password,
        });

        if (res?.error) {
            // Map NextAuth error codes to user-friendly messages
            let errorMessage = "An error occurred";
            switch (res.error) {
                case "CredentialsSignin":
                    errorMessage = "Invalid username or password";
                    break;
                case "Configuration":
                    errorMessage = "Server configuration error";
                    break;
                case "AccessDenied":
                    errorMessage = "Access denied";
                    break;
                case "Verification":
                    errorMessage = "Verification failed";
                    break;
                default:
                    errorMessage = "Authentication failed";
            }

            setAuthError(errorMessage);
        } else if (res?.ok) {
            // Redirect to dashboard or home page
            window.location.href = "/dashboard";
        } else {
            // Handle unexpected cases
            setAuthError("An unexpected error occurred");
            toast.error("Login failed", {
                description: "An unexpected error occurred. Please try again.",
            });
        }
    };

    return (
        <form
            className={cn("flex flex-col gap-6", className)}
            onSubmit={handleSubmit(onSubmit)}
            {...props}>
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Login to your account</h1>
                <p className="text-muted-foreground text-sm text-balance">
                    Enter your credentials first to access the app
                </p>
            </div>
            <div className="grid gap-6">
                <div className="grid gap-3">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        type="text"
                        placeholder="johndoe"
                        {...register("username")}
                        disabled={isSubmitting}
                        required
                    />
                    {errors.username && (
                        <p className="h-4 text-sm text-red-500 break-words">{errors.username.message}</p>
                    )}
                </div>
                <div className="grid gap-3">
                    <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        {...register("password")}
                        placeholder="••••••••"
                        disabled={isSubmitting}
                        required
                    />
                    {errors.password && (
                        <p className="h-4 text-sm text-red-500 break-words">{errors.password.message}</p>
                    )}
                </div>
                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                >
                    Login
                </Button>
            </div>
            <div className="text-center text-sm">
                Don&apos;t have an account? Ask your administrator to create one for you.
            </div>
            {authError && (
                <p className="text-center text-sm text-red-500">{authError}</p>
            )}
        </form>
    )
}