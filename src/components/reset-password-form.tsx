"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";

export function ResetPasswordForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            await resetPassword(email);
            setMessage("Check your email for further instructions");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to reset password";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden py-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6 py-16">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">Reset Password</h1>
                                <p className="text-balance text-muted-foreground">
                                    Enter your email address and we&apos;ll send you a link to reset your password
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            {error && (
                                <div className="text-sm text-red-500">
                                    {error}
                                </div>
                            )}
                            {message && (
                                <div className="text-sm text-green-500">
                                    {message}
                                </div>
                            )}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Sending..." : "Reset Password"}
                            </Button>
                            <div className="text-center text-sm">
                                Remember your password?{" "}
                                <Link href="/login" className="underline underline-offset-4">
                                    Back to login
                                </Link>
                            </div>
                        </div>
                    </form>
                    <div className="relative hidden bg-muted md:block">
                        <Image
                            priority
                            src="/images/reset-password-bg.png"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover brightness-[0.5]"
                            width={400}
                            height={600}
                        />
                    </div>
                </CardContent>
            </Card>
            <div className="text-balance text-center text-xs text-muted-foreground">
                By clicking continue, you agree to our <Link className="underline underline-offset-4 hover:text-primary" href="/terms-of-service">Terms of Service</Link>{" "}
                and <Link className="underline underline-offset-4 hover:text-primary" href="/privacy-policy">Privacy Policy</Link>.
            </div>
        </div>
    );
} 