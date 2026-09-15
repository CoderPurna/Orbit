"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  MeetingStatusBadge,
  PrivacyBadge,
} from "@/components/meetings/meeting-badges";
import { CopyLinkButton } from "@/components/meetings/copy-link-button";
import { MeetingActionsMenu } from "@/components/meetings/meeting-actions-menu";
import { MeetingEditForm } from "@/components/meetings/meeting-edit-form";
import { InviteDialog } from "@/components/meetings/invite-dialog";
import { SummaryView } from "@/components/recap/summary-view";
import { TranscriptView } from "@/components/recap/transcript-view";
import { useMeeting } from "@/hooks/use-meetings";
import { isFullMeeting, type Invite, type Meeting } from "@/lib/api-types";
import { isApiError } from "@/lib/api-client";
import {
  DetailSkeleton,
  InvitesTab,
  OverviewTab,
  RecordingsTab,
} from "@/components/meetings/meeting-detail-tabs";

const TABS = [
  "overview",
  "settings",
  "invites",
  "recap",
  "transcript",
  "recordings",
] as const;
type Tab = (typeof TABS)[number];

export default function MeetingDetailPage() {
  return (
    <React.Suspense fallback={<DetailSkeleton />}>
      <MeetingDetail />
    </React.Suspense>
  );
}

function MeetingDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab = TABS.includes(tabParam as Tab)
    ? (tabParam as Tab)
    : "overview";

  const { data, isPending, error } = useMeeting(params.id, {
    refetchInterval: 30_000,
  });

  const setTab = (next: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (next === "overview") sp.delete("tab");
    else sp.set("tab", next);
    router.replace(
      `/dashboard/meetings/${params.id}${sp.size ? `?${sp}` : ""}`,
    );
  };

  if (isPending) return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12">
      <DetailSkeleton />
    </div>
  );

  if (error || !data) {
    const notFound = isApiError(error) && error.status === 404;
    return (
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12">
        <Empty className="bg-background border border-border/40 py-24 rounded-3xl shadow-sm">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="mb-4">
              <Video className="size-10 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle className="text-xl font-semibold">
              {notFound ? "Meeting not found" : "Couldn't load this meeting"}
            </EmptyTitle>
            <EmptyDescription className="text-base font-medium mt-2">
              {notFound
                ? "It may have been deleted, or the link is wrong."
                : "Try again in a moment."}
            </EmptyDescription>
          </EmptyHeader>
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              className="rounded-full px-6 font-semibold shadow-sm"
              render={<Link href="/dashboard/meetings" />}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to meetings
            </Button>
          </div>
        </Empty>
      </div>
    );
  }

  if (!isFullMeeting(data)) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-24">
      <MeetingDetailView meeting={data} tab={tab} setTab={setTab} />
    </div>
  );
}

function MeetingDetailView({
  meeting,
  tab,
  setTab,
}: {
  meeting: Meeting;
  tab: Tab;
  setTab: (t: string) => void;
}) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [sentInvites, setSentInvites] = React.useState<Invite[]>([]);
  const canJoin =
    meeting.status !== "cancelled" &&
    !(meeting.status === "ended" && meeting.type === "instant");
  const isLive = meeting.status === "live";

  return (
    <>
      <div className="py-6 mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground font-semibold px-0 -ml-2 rounded-full"
          render={<Link href="/dashboard/meetings" />}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to meetings
        </Button>
      </div>

      {/* Cinematic Hero */}
      <section className="mb-12 border-b border-border/20 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-foreground bg-muted font-mono px-3 py-1 rounded-md text-sm tracking-wide">
                {meeting.roomCode}
              </span>
              <MeetingStatusBadge status={meeting.status} />
              <PrivacyBadge mode={meeting.privacyMode} />
            </div>
            
            <h1 className="text-[clamp(2.5rem,4vw,3.5rem)] leading-[1.05] font-black tracking-tight" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
              {meeting.title}
            </h1>
            
            <p className="text-xl text-muted-foreground font-light tracking-wide">
              Hosted by <span className="font-semibold text-foreground">{meeting.isHost ? "you" : meeting.hostName}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:shrink-0">
            {canJoin && (
              <Button
                variant={isLive ? "default" : "outline"}
                className="rounded-full px-8 py-6 font-bold shadow-sm text-base"
                render={<Link href={`/m/${meeting.roomCode}`} />}
              >
                <Video className="mr-2 size-5" />
                {isLive ? "Join now" : meeting.isHost ? "Start meeting" : "Join meeting"}
              </Button>
            )}
            <CopyLinkButton roomCode={meeting.roomCode} className="rounded-full py-6 px-6 font-semibold" size="default" />
            {meeting.isHost && (
              <Button variant="outline" className="rounded-full py-6 px-6 font-semibold" onClick={() => setInviteOpen(true)}>
                <UserPlus className="mr-2 size-5" />
                Invite
              </Button>
            )}
            {meeting.isHost && (
              <div className="ml-2">
                <MeetingActionsMenu
                  meeting={meeting}
                  hostName={meeting.hostName}
                  showOpen={false}
                  onDeleted={() => router.push("/dashboard/meetings")}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-8">
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto border-b border-border/20 gap-6"
        >
          <TabsTrigger value="overview" className="pb-4 text-base tracking-wide uppercase font-semibold">
            Overview
          </TabsTrigger>
          {meeting.isHost && (
            <TabsTrigger value="settings" className="pb-4 text-base tracking-wide uppercase font-semibold">
              Settings
            </TabsTrigger>
          )}
          {meeting.isHost && (
            <TabsTrigger value="invites" className="pb-4 text-base tracking-wide uppercase font-semibold">
              Invites
            </TabsTrigger>
          )}
          <TabsTrigger value="recap" className="pb-4 text-base tracking-wide uppercase font-semibold">
            Recap
          </TabsTrigger>
          <TabsTrigger value="transcript" className="pb-4 text-base tracking-wide uppercase font-semibold">
            Transcript
          </TabsTrigger>
          {meeting.privacyMode !== "private" && (
            <TabsTrigger value="recordings" className="pb-4 text-base tracking-wide uppercase font-semibold">
              Recordings
            </TabsTrigger>
          )}
        </TabsList>

        <div className="mt-8">
          <TabsContent value="overview" className="m-0 focus-visible:outline-none">
            <OverviewTab meeting={meeting} onInvite={() => setInviteOpen(true)} />
          </TabsContent>
          {meeting.isHost && (
            <TabsContent value="settings" className="m-0 focus-visible:outline-none max-w-3xl mt-6">
              <MeetingEditForm meeting={meeting} />
            </TabsContent>
          )}
          {meeting.isHost && (
            <TabsContent value="invites" className="m-0 focus-visible:outline-none">
              <InvitesTab
                meeting={meeting}
                sent={sentInvites}
                onInvite={() => setInviteOpen(true)}
              />
            </TabsContent>
          )}
          <TabsContent value="recap" className="m-0 focus-visible:outline-none mt-6">
            <SummaryView meeting={meeting} />
          </TabsContent>
          <TabsContent value="transcript" className="m-0 focus-visible:outline-none mt-6">
            <TranscriptView meeting={meeting} />
          </TabsContent>
          {meeting.privacyMode !== "private" && (
            <TabsContent value="recordings" className="m-0 focus-visible:outline-none">
              <RecordingsTab meeting={meeting} />
            </TabsContent>
          )}
        </div>
      </Tabs>

      {meeting.isHost && (
        <InviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          meetingId={meeting.id}
          waitingRoomEnabled={meeting.waitingRoomEnabled}
          onSent={(invites) => setSentInvites((prev) => [...invites, ...prev])}
        />
      )}
    </>
  );
}
