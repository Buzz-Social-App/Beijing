"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/lib/auth-context";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Don't render anything on the server to prevent hydration errors
    if (!isClient) {
        return null;
    }

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-lg">Loading...</p>
            </div>
        );
    }

    // If not authenticated, don't render the content (will redirect in useEffect)
    if (!user) {
        return null;
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                    </div>
                </header>
                <main className={`antialiased`}>
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
} 