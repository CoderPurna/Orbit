"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
    IconNotes,
    IconVideo,
    IconHome,
    IconMicrophone,
    IconSettings,
    IconListDetails,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function SidebarItem() {
    const links = [
        {
            label: "Home",
            href: "/dashboard",
            icon: (
                <IconHome className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
            ),
        },
        {
            label: "Meetings",
            href: "/profile",
            icon: (
                <IconVideo className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
            ),
        },
        {
            label: "Recaps",
            href: "#",
            icon: (
                <IconNotes className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
            ),
        },
        {
            label: "Action Items",
            href: "#",
            icon: (
                <IconListDetails className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
            ),
        }, {
            label: "Recordings",
            href: "#",
            icon: (
                <IconMicrophone className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
            ),
        },{
            label: "Settings",
            href: "#",
            icon: (
                <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
            ),
        },
    ];
    const [open, setOpen] = useState(false);
    return (
        <div
            className={cn(
                "flex h-screen w-full flex-1 flex-col overflow-hidden bg-gray-100 md:flex-row dark:bg-neutral-900",
            )}
        >
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {open ? <Logo key="logo-full" /> : <LogoIcon key="logo-icon" />}
                        </AnimatePresence>
                        <div className="mt-8 flex flex-col gap-2">
                            {links.map((link, idx) => (
                                <SidebarLink key={idx} link={link} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <SidebarLink
                            link={{
                                label: "Manu Arora",
                                href: "#",
                                icon: (
                                    <img
                                        src="https://assets.aceternity.com/manu.png"
                                        className="h-7 w-7 shrink-0 rounded-full"
                                        width={50}
                                        height={50}
                                        alt="Avatar"
                                    />
                                ),
                            }}
                        />
                    </div>
                </SidebarBody>
            </Sidebar>
            <Dashboard />
        </div>
    );
}
export const Logo = () => {
    return (
        <a
            href="/dashboard"
            className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal"
        >
            <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="flex items-center"
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
        </a>
    );
};
export const LogoIcon = () => {
    return (
        <a
            href="/dashboard"
            className="relative z-20 flex items-center py-1 text-sm font-normal"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="relative h-7 w-7 overflow-hidden shrink-0"
            >
                <img
                    src="/icons/orbit-wordmark-paper.svg"
                    alt="Orbit"
                    className="h-7 max-w-none block dark:hidden object-left"
                />
                <img
                    src="/icons/orbit-wordmark.svg"
                    alt="Orbit"
                    className="h-7 max-w-none hidden dark:block object-left"
                />
            </motion.div>
        </a>
    );
};

// Dummy dashboard component with content
const Dashboard = () => {
    return (
        <div className="flex flex-1">
            <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex gap-2">
                    {[...new Array(4)].map((i, idx) => (
                        <div
                            key={"first-array-demo-1" + idx}
                            className="h-20 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800"
                        ></div>
                    ))}
                </div>
                <div className="flex flex-1 gap-2">
                    {[...new Array(2)].map((i, idx) => (
                        <div
                            key={"second-array-demo-1" + idx}
                            className="h-full w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800"
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
};
