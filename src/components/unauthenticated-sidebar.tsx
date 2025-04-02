"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { Button } from "./ui/button"

// Login component for footer
function LoginButton() {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <Button variant="outline" className="w-full">
                    <Link href="/signup">
                        <span>Sign Up</span>
                    </Link>
                </Button>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Button className="w-full">
                    <Link href="/login">
                        <span>Log In</span>
                    </Link>
                </Button>
            </SidebarMenuItem>
            {/* <SidebarMenuItem>
                <Button>
                    <Link href="/register" className="text-primary hover:text-primary/80">
                        <span>Register account</span>
                    </Link>
                </Button>
            </SidebarMenuItem> */}
        </SidebarMenu>
    )
}

export function UnauthenticatedSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <div className="p-2">
                    <p className="text-lg font-bold">Buzz</p>
                </div>
            </SidebarHeader>
            <SidebarContent>

            </SidebarContent>
            <SidebarFooter>
                <LoginButton />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
} 