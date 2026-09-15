"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings as SettingsIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileSection } from "@/components/settings/profile-section";
import { SecuritySection } from "@/components/settings/security-section";
import { NotificationsSection } from "@/components/settings/notifications-section";
import { UsageSection } from "@/components/settings/usage-section";
import { ActivitySection } from "@/components/settings/activity-section";
import { DataSection } from "@/components/settings/data-section";

const TABS = [
  "profile",
  "security",
  "notifications",
  "usage",
  "activity",
  "data",
] as const;
type Tab = (typeof TABS)[number];

export default function SettingsPage() {
  return (
    <React.Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
      <Settings />
    </React.Suspense>
  );
}

function Settings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab = TABS.includes(tabParam as Tab)
    ? (tabParam as Tab)
    : "profile";

  const setTab = (next: string) => {
    router.replace(
      next === "profile"
        ? "/dashboard/settings"
        : `/dashboard/settings?tab=${next}`,
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-24">
      {/* Cinematic Header */}
      <section className="mb-12 border-b border-border/20 pt-16 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-[clamp(2.5rem,4vw,3.5rem)] leading-[1.05] font-black tracking-tight" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
              Settings
            </h1>
            
            <p className="text-xl text-muted-foreground font-light tracking-wide">
              Manage your account, security, notifications and data.
            </p>
          </div>
          <div className="hidden md:block opacity-10">
            <SettingsIcon className="size-32 text-foreground" />
          </div>
        </div>
      </section>

      <Tabs
        value={tab}
        onValueChange={setTab}
        orientation="horizontal"
        className="flex flex-col gap-8"
      >
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto border-b border-border/20 gap-6"
        >
          <TabsTrigger value="profile" className="pb-4 text-base tracking-wide uppercase font-semibold">
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="pb-4 text-base tracking-wide uppercase font-semibold">
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="pb-4 text-base tracking-wide uppercase font-semibold">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="usage" className="pb-4 text-base tracking-wide uppercase font-semibold">
            Usage
          </TabsTrigger>
          <TabsTrigger value="activity" className="pb-4 text-base tracking-wide uppercase font-semibold">
            Activity
          </TabsTrigger>
          <TabsTrigger value="data" className="pb-4 text-base tracking-wide uppercase font-semibold">
            Data &amp; privacy
          </TabsTrigger>
        </TabsList>

        <div className="mt-8 max-w-4xl">
          <TabsContent value="profile" className="m-0 focus-visible:outline-none">
            <ProfileSection />
          </TabsContent>
          <TabsContent value="security" className="m-0 focus-visible:outline-none">
            <SecuritySection />
          </TabsContent>
          <TabsContent value="notifications" className="m-0 focus-visible:outline-none">
            <NotificationsSection />
          </TabsContent>
          <TabsContent value="usage" className="m-0 focus-visible:outline-none">
            <UsageSection />
          </TabsContent>
          <TabsContent value="activity" className="m-0 focus-visible:outline-none">
            <ActivitySection />
          </TabsContent>
          <TabsContent value="data" className="m-0 focus-visible:outline-none">
            <DataSection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
