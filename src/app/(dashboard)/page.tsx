"use client";

import { useAuth } from "@/lib/auth-context";
import { LogoutButton } from "@/components/logout-button";

export default function Home() {
    const { user } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Welcome to Buzz Dashboard</h1>
                <p className="text-xl">You are logged in as {user?.email}</p>
                <div className="flex justify-center mt-4">
                    <LogoutButton variant="default" size="default">
                        <span>Sign Out</span>
                    </LogoutButton>
                </div>
            </div>
        </div>
    );
} 