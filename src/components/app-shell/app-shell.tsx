"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  IconHome,
  IconVideo,
  IconNotes,
  IconListDetails,
  IconMicrophone,
  IconSettings,
} from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu, type ShellUser } from "@/components/app-shell/user-menu";
import { VerifyEmailBanner } from "@/components/app-shell/verify-email-banner";
import { NewMeetingButton } from "@/components/meetings/create-meeting-dialog";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Home", href: "/dashboard", icon: IconHome, exact: true },
  { label: "Meetings", href: "/dashboard/meetings", icon: IconVideo },
  { label: "Recaps", href: "/dashboard/recaps", icon: IconNotes },
  {
    label: "Action items",
    href: "/dashboard/action-items",
    icon: IconListDetails,
  },
  { label: "Recordings", href: "/dashboard/recordings", icon: IconMicrophone },
  { label: "Settings", href: "/dashboard/settings", icon: IconSettings },
] as const;

export const ShellUserContext = React.createContext<ShellUser | null>(null);

export function useShellUser(): ShellUser {
  const user = React.useContext(ShellUserContext);
  if (!user) throw new Error("useShellUser must be used inside AppShell");
  return user;
}

export function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const current =
    NAV.find((n) => pathname === n.href) ??
    NAV.find((n) => n.href !== "/dashboard" && pathname.startsWith(n.href)) ??
    NAV[0];

  return (
    <ShellUserContext.Provider value={user}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center px-2 pt-4 pb-2">
              <DynamicLogo />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV.map((item) => {
                    const active =
                      "exact" in item && item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={item.label}
                          render={<Link href={item.href} />}
                        >
                          <Icon className="size-5 shrink-0" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <UserMenu user={user} />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex h-svh flex-col overflow-hidden">
          <header className="bg-background/80 relative z-10 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur sm:px-5">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-1 h-5" />
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-foreground truncate text-sm font-medium">
                {current.label}
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <NewMeetingButton size="sm" className="hidden sm:inline-flex" />
              <ThemeToggle />
            </div>
          </header>

          <div className="custom-scrollbar flex-1 overflow-y-auto">
            <VerifyEmailBanner />
            <div
              className={cn(
                "mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-6 lg:px-8",
              )}
            >
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ShellUserContext.Provider>
  );
}

function DynamicLogo() {
  const { state } = useSidebar();

  return (
    <Link href="/dashboard" className="relative z-20 flex h-8 items-center">
      <AnimatePresence mode="wait" initial={false}>
        {state === "expanded" ? (
          <motion.div
            key="logo-full"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex h-full items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/orbit-wordmark-paper.svg"
              alt="Orbit"
              className="block h-7 w-auto dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/orbit-wordmark.svg"
              alt="Orbit"
              className="hidden h-7 w-auto dark:block"
            />
          </motion.div>
        ) : (
          <motion.div
            key="logo-icon"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex size-7 shrink-0 items-center justify-center overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/orbit-mark.svg" alt="Orbit" className="size-7" />
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}
