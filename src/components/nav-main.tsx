"use client"

import { Calendar, Home, CalendarPlus, Tag, Building2, Bell, Image, ImagePlus, Shield } from "lucide-react"
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export function NavMain() {
    const { isSuperAdmin } = useAuth()

    const items = [
        {
            title: "Home",
            url: "/",
            icon: Home,
        },
        {
            title: "Events",
            url: "/events",
            icon: Calendar,
        },
        {
            title: "Create Event",
            url: "/events/submission",
            icon: CalendarPlus,
        },
        {
            title: "Adverts",
            url: "/adverts",
            icon: Image,
        },
        {
            title: "Create Advert",
            url: "/adverts/submission",
            icon: ImagePlus,
        },
        {
            title: "Cities",
            url: "/cities",
            icon: Building2,
        },
        {
            title: "Notifications",
            url: "/notifications",
            icon: Bell,
        },
        {
            title: "Tags",
            url: "/tags",
            icon: Tag,
        },
    ]

    const pathname = usePathname()
    return (
        <SidebarGroup>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={pathname === item.url}>
                            <Link href={item.url}>
                                <item.icon />
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
                {isSuperAdmin && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === "/admin"}>
                            <Link href="/admin">
                                <Shield />
                                <span>Admin</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
        </SidebarGroup>
    )
}
