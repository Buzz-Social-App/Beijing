"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UnauthenticatedSidebar } from "@/components/unauthenticated-sidebar";
import { useAuth } from "@/lib/auth-context";
import { LogOut, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user, loading, isAdmin, adminLoading, logOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    const isEventCreationPage = pathname === '/events/submission';
    const isEventPage = /^\/events\/[^/]+$/.test(pathname);

    useEffect(() => {
        setIsClient(true);

        if (!loading && !user && !isEventCreationPage && !isEventPage) {
            router.push("/login");
        }
    }, [user, loading, router, pathname, isEventCreationPage, isEventPage]);

    if (!isClient) {
        return null;
    }

    if (loading || (user && adminLoading)) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-lg">Loading...</p>
            </div>
        );
    }

    if (!user && !isEventCreationPage && !isEventPage) {
        return null;
    }

    if (user && !isAdmin && !isEventCreationPage && !isEventPage) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-6">
                <ShieldX className="h-16 w-16 text-muted-foreground" />
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground max-w-md">
                        You are not an admin. Contact an administrator to request access.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={async () => {
                        await logOut();
                        router.push("/login");
                    }}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </Button>
            </div>
        );
    }

    return (
        <SidebarProvider>
            {user ? <AppSidebar /> : <UnauthenticatedSidebar />}
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