"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app-shell/page-header";
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
    <>
      <PageHeader
        title="Settings"
        description="Your account, security, notifications and data."
      />

      <Tabs
        value={tab}
        onValueChange={setTab}
        orientation="horizontal"
        className="gap-6"
      >
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto border-b"
        >
          <TabsTrigger value="profile" className="px-3">
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="px-3">
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="px-3">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="usage" className="px-3">
            Usage
          </TabsTrigger>
          <TabsTrigger value="activity" className="px-3">
            Activity
          </TabsTrigger>
          <TabsTrigger value="data" className="px-3">
            Data &amp; privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSection />
        </TabsContent>
        <TabsContent value="security">
          <SecuritySection />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsSection />
        </TabsContent>
        <TabsContent value="usage">
          <UsageSection />
        </TabsContent>
        <TabsContent value="activity">
          <ActivitySection />
        </TabsContent>
        <TabsContent value="data">
          <DataSection />
        </TabsContent>
      </Tabs>
    </>
  );
}
