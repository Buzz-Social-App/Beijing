"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    children?: React.ReactNode;
}

export function LogoutButton({
    variant = "default",
    size = "default",
    className,
    children
}: LogoutButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { logOut } = useAuth();

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logOut();
            router.push("/login");
        } catch (error) {
            console.error("Failed to log out", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleLogout}
            disabled={loading}
            className={cn("flex items-center gap-2", className)}
        >
            {children || (
                <>
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                </>
            )}
        </Button>
    );
} 