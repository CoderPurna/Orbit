"use client";
import React from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarGroup,
    SidebarGroupContent,
    SidebarFooter,
    SidebarInset,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    IconNotes,
    IconVideo,
    IconHome,
    IconMicrophone,
    IconSettings,
    IconListDetails,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";

export default function DashboardPage() {
    const links = [
        {
            label: "Home",
            href: "/dashboard",
            icon: <IconHome className="h-5 w-5 shrink-0" />,
        },
        {
            label: "Meetings",
            href: "/dashboard/meetings",
            icon: <IconVideo className="h-5 w-5 shrink-0" />,
        },
        {
            label: "Recaps",
            href: "/dashboard/recaps",
            icon: <IconNotes className="h-5 w-5 shrink-0" />,
        },
        {
            label: "Action Items",
            href: "/dashboard/action-items",
            icon: <IconListDetails className="h-5 w-5 shrink-0" />,
        },
        {
            label: "Recordings",
            href: "/dashboard/recordings",
            icon: <IconMicrophone className="h-5 w-5 shrink-0" />,
        },
        {
            label: "Settings",
            href: "/dashboard/settings",
            icon: <IconSettings className="h-5 w-5 shrink-0" />,
        },
    ];

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <div className="flex items-center pt-4 pb-2 px-2">
                        <DynamicLogo />
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {links.map((link, idx) => (
                                    <SidebarMenuItem key={idx}>
                                        <SidebarMenuButton render={<a href={link.href} className="flex items-center gap-2" />} tooltip={link.label}>
                                            {link.icon}
                                            <span>{link.label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton render={<a href="#" />} size="lg">
                                <img
                                    src="https://assets.aceternity.com/manu.png"
                                    className="h-8 w-8 shrink-0 rounded-full"
                                    alt="Avatar"
                                />
                                <span className="font-medium text-sm">Manu Arora</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            
            <SidebarInset className="flex flex-col bg-gray-50/50 dark:bg-neutral-900/50 h-screen overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white dark:bg-neutral-900 px-4 shadow-sm z-10 relative">
                    <SidebarTrigger className="-ml-1" />
                    <div className="font-semibold text-lg ml-2 font-serif text-[#0a1f16] dark:text-white">Dashboard</div>
                </header>
                <div className="flex-1 overflow-auto">
                    <DashboardContent />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

const DynamicLogo = () => {
    const { state } = useSidebar();
    
    return (
        <a href="/dashboard" className="relative z-20 flex items-center h-8">
            <AnimatePresence mode="wait">
                {state === "expanded" ? (
                    <motion.div
                        key="logo-full"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="flex items-center h-full"
                    >
                        <img
                            src="/icons/orbit-wordmark-paper.svg"
                            alt="Orbit"
                            className="h-7 w-auto block dark:hidden"
                        />
                        <img
                            src="/icons/orbit-wordmark.svg"
                            alt="Orbit"
                            className="h-7 w-auto hidden dark:block"
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="logo-icon"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="h-7 w-7 overflow-hidden shrink-0 flex items-center justify-center"
                    >
                        <img
                            src="/icons/orbit-wordmark-paper.svg"
                            alt="Orbit"
                            className="h-7 min-w-[100px] object-cover object-left block dark:hidden"
                            style={{ objectPosition: '0 0' }}
                        />
                        <img
                            src="/icons/orbit-wordmark.svg"
                            alt="Orbit"
                            className="h-7 min-w-[100px] object-cover object-left hidden dark:block"
                            style={{ objectPosition: '0 0' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </a>
    );
};

// Dummy dashboard component with content
const DashboardContent = () => {
    return (
        <div className="p-4 md:p-8 h-full flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...new Array(4)].map((_, idx) => (
                    <div
                        key={"stat-" + idx}
                        className="h-32 w-full animate-pulse rounded-2xl bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/5 shadow-sm"
                    ></div>
                ))}
            </div>
            <div className="flex flex-1 gap-4">
                {[...new Array(2)].map((_, idx) => (
                    <div
                        key={"panel-" + idx}
                        className="h-full w-full animate-pulse rounded-2xl bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/5 shadow-sm"
                    ></div>
                ))}
            </div>
        </div>
    );
};
