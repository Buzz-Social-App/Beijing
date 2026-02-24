"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Eye, EyeOff, Mail } from "lucide-react";
import Link from "next/link";

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [verifyStep, setVerifyStep] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const router = useRouter();
    const { signIn, resendOtp, verifyOtp } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { error } = await signIn(email, password);

            if (error) {
                if (error.message === "Email not confirmed") {
                    setEmailNotConfirmed(true);
                }
                throw new Error(error.message);
            }

            router.push("/");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to sign in";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleResendConfirmation = async () => {
        setError("");
        setLoading(true);
        try {
            const { error: resendError } = await resendOtp(email);
            if (resendError) {
                throw new Error(resendError.message);
            }
            setVerifyStep(true);
            setEmailNotConfirmed(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send confirmation code");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setVerifying(true);
        try {
            const { error: otpError } = await verifyOtp(email, otpCode);
            if (otpError) {
                throw new Error(otpError.message);
            }
            router.push("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed");
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden py-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    {verifyStep ? (
                        <form className="p-6 md:p-8" onSubmit={handleVerifyOtp}>
                            <div className="flex flex-col gap-6 py-16">
                                <div className="flex flex-col items-center text-center">
                                    <Mail className="h-10 w-10 text-muted-foreground mb-2" />
                                    <h1 className="text-2xl font-bold">Verify your email</h1>
                                    <p className="text-muted-foreground">
                                        We&apos;ve sent a 6-digit code to <strong>{email}</strong>
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="otp">Verification code</Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Enter 6-digit code"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                        maxLength={6}
                                        required
                                        autoFocus
                                    />
                                </div>
                                {error && (
                                    <div className="text-sm text-red-500">
                                        {error}
                                    </div>
                                )}
                                <Button type="submit" className="w-full" disabled={verifying}>
                                    {verifying ? "Verifying..." : "Verify"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setVerifyStep(false);
                                        setOtpCode("");
                                        setError("");
                                    }}
                                >
                                    Back to login
                                </Button>
                            </div>
                        </form>
                    ) : (
                    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6 py-16">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">Welcome back</h1>
                                <p className="text-balance text-muted-foreground">
                                    Login to the Buzz Admin Dashboard
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
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        href="/reset-password"
                                        className="ml-auto text-sm underline-offset-2 hover:underline"
                                    >
                                        Forgot your password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                        onClick={togglePasswordVisibility}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {error && (
                                <div className="text-sm text-red-500">
                                    {error}
                                    {emailNotConfirmed && (
                                        <button
                                            type="button"
                                            className="ml-1 underline underline-offset-2 hover:text-red-700"
                                            onClick={handleResendConfirmation}
                                            disabled={loading}
                                        >
                                            Resend confirmation code
                                        </button>
                                    )}
                                </div>
                            )}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Signing in..." : "Login"}
                            </Button>
                            <div className="text-center text-sm">
                                Don&apos;t have an account?{" "}
                                <Link href="/signup" className="underline underline-offset-4">
                                    Sign up
                                </Link>
                            </div>
                        </div>
                    </form>
                    )}
                    <div className="relative hidden bg-muted md:block">
                        <Image
                            priority
                            src="/images/login-bg.png"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover brightness-[0.5]"
                            width={400}
                            height={600}
                        />
                    </div>
                </CardContent>
            </Card>
            <div className="text-balance text-center text-xs text-muted-foreground ">
                By clicking continue, you agree to our <Link className="underline underline-offset-4 hover:text-primary" href="/terms-of-service">Terms of Service</Link>{" "}
                and <Link className="underline underline-offset-4 hover:text-primary" href="/privacy-policy">Privacy Policy</Link>.
            </div>
        </div>
    )
}
