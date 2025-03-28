"use client"

import { Calendar, Home, CalendarPlus, Tag, Building2 } from "lucide-react"
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import Link from "next/link"

export function NavMain() {
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
            url: "/events/edit",
            icon: CalendarPlus,
        },
        {
            title: "Tags",
            url: "/tags",
            icon: Tag,
        },
        {
            title: "Cities",
            url: "/cities",
            icon: Building2,
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
            </SidebarMenu>
        </SidebarGroup>
    )
}
