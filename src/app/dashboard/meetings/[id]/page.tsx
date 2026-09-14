"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  Globe,
  Hash,
  Lock,
  LockOpen,
  Mail,
  User,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field";
import {
  GateBadges,
  MeetingStatusBadge,
  PrivacyBadge,
} from "@/components/meetings/meeting-badges";
import { CopyLinkButton } from "@/components/meetings/copy-link-button";
import { MeetingActionsMenu } from "@/components/meetings/meeting-actions-menu";
import { MeetingEditForm } from "@/components/meetings/meeting-edit-form";
import { InviteDialog } from "@/components/meetings/invite-dialog";
import { SummaryView } from "@/components/recap/summary-view";
import { TranscriptView } from "@/components/recap/transcript-view";
import { RecordingsList } from "@/components/recap/recordings-list";
import {
  downloadIcs,
  useMeeting,
  useRecordings,
  useUpdateMeeting,
} from "@/hooks/use-meetings";
import { isFullMeeting, type Invite, type Meeting } from "@/lib/api-types";
import { isApiError } from "@/lib/api-client";
import { formatDateTime, formatDuration, formatWhen } from "@/lib/format";
import { notify } from "@/lib/toast";

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

  if (isPending) return <DetailSkeleton />;

  if (error || !data) {
    const notFound = isApiError(error) && error.status === 404;
    return (
      <Empty className="bg-card border py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Video />
          </EmptyMedia>
          <EmptyTitle>
            {notFound ? "Meeting not found" : "Couldn't load this meeting"}
          </EmptyTitle>
          <EmptyDescription>
            {notFound
              ? "It may have been deleted, or the link is wrong."
              : "Try again in a moment."}
          </EmptyDescription>
        </EmptyHeader>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/meetings" />}
        >
          <ArrowLeft />
          Back to meetings
        </Button>
      </Empty>
    );
  }

  if (!isFullMeeting(data)) {
    // Signed-in users always receive the full shape; this is a type guard.
    return null;
  }

  return <MeetingDetailView meeting={data} tab={tab} setTab={setTab} />;
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
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground -ml-2"
          render={<Link href="/dashboard/meetings" />}
        >
          <ArrowLeft />
          Meetings
        </Button>
      </div>

      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <span className="text-foreground font-mono tracking-normal normal-case">
              {meeting.roomCode}
            </span>
            <MeetingStatusBadge status={meeting.status} />
            <PrivacyBadge mode={meeting.privacyMode} />
          </span>
        }
        title={meeting.title}
        description={
          meeting.scheduledStartAt ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {formatWhen(meeting.scheduledStartAt)}
              {meeting.scheduledEndAt && (
                <span className="text-muted-foreground/70">
                  ·{" "}
                  {formatDuration(
                    (new Date(meeting.scheduledEndAt).getTime() -
                      new Date(meeting.scheduledStartAt).getTime()) /
                      1000,
                  )}
                </span>
              )}
            </span>
          ) : (
            `Hosted by ${meeting.isHost ? "you" : meeting.hostName}`
          )
        }
        actions={
          <>
            {canJoin && (
              <Button
                variant={isLive ? "default" : "outline"}
                render={<Link href={`/m/${meeting.roomCode}`} />}
              >
                <Video />
                {isLive ? "Join" : meeting.isHost ? "Start" : "Join"}
              </Button>
            )}
            <CopyLinkButton roomCode={meeting.roomCode} size="default" />
            {meeting.isHost && (
              <Button variant="outline" onClick={() => setInviteOpen(true)}>
                <UserPlus />
                Invite
              </Button>
            )}
            {meeting.isHost && (
              <MeetingActionsMenu
                meeting={meeting}
                hostName={meeting.hostName}
                showOpen={false}
                onDeleted={() => router.push("/dashboard/meetings")}
              />
            )}
          </>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="gap-5">
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto border-b"
        >
          <TabsTrigger value="overview" className="px-3">
            Overview
          </TabsTrigger>
          {meeting.isHost && (
            <TabsTrigger value="settings" className="px-3">
              Settings
            </TabsTrigger>
          )}
          {meeting.isHost && (
            <TabsTrigger value="invites" className="px-3">
              Invites
            </TabsTrigger>
          )}
          <TabsTrigger value="recap" className="px-3">
            Recap
          </TabsTrigger>
          <TabsTrigger value="transcript" className="px-3">
            Transcript
          </TabsTrigger>
          {meeting.privacyMode !== "private" && (
            <TabsTrigger value="recordings" className="px-3">
              Recordings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab meeting={meeting} onInvite={() => setInviteOpen(true)} />
        </TabsContent>
        {meeting.isHost && (
          <TabsContent value="settings">
            <MeetingEditForm meeting={meeting} />
          </TabsContent>
        )}
        {meeting.isHost && (
          <TabsContent value="invites">
            <InvitesTab
              meeting={meeting}
              sent={sentInvites}
              onInvite={() => setInviteOpen(true)}
            />
          </TabsContent>
        )}
        <TabsContent value="recap">
          <SummaryView meeting={meeting} />
        </TabsContent>
        <TabsContent value="transcript">
          <TranscriptView meeting={meeting} />
        </TabsContent>
        {meeting.privacyMode !== "private" && (
          <TabsContent value="recordings">
            <RecordingsTab meeting={meeting} />
          </TabsContent>
        )}
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

function OverviewTab({
  meeting,
  onInvite,
}: {
  meeting: Meeting;
  onInvite: () => void;
}) {
  const update = useUpdateMeeting(meeting.id);

  const toggle = async (
    field: "isLocked" | "waitingRoomEnabled" | "allowChat",
    value: boolean,
  ) => {
    try {
      await update.mutateAsync({ [field]: value });
      notify.success(
        field === "isLocked"
          ? value
            ? "Meeting locked"
            : "Meeting unlocked"
          : field === "waitingRoomEnabled"
            ? value
              ? "Waiting room on"
              : "Waiting room off"
            : value
              ? "Chat enabled"
              : "Chat disabled",
      );
    } catch (error) {
      notify.error("Could not update the meeting", error);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {meeting.description ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {meeting.description}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">No agenda yet.</p>
            )}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Detail icon={<Hash />} label="Room code">
                <span className="font-mono">{meeting.roomCode}</span>
              </Detail>
              <Detail icon={<User />} label="Host">
                {meeting.hostName}
              </Detail>
              <Detail icon={<CalendarPlus />} label="Type">
                {meeting.type === "instant"
                  ? "Instant"
                  : meeting.type === "scheduled"
                    ? "Scheduled"
                    : "Recurring"}
              </Detail>
              <Detail icon={<Users />} label="Capacity">
                Up to {meeting.maxParticipants} people
              </Detail>
              {meeting.scheduledStartAt && (
                <Detail icon={<Clock />} label="Starts">
                  {formatDateTime(meeting.scheduledStartAt)}
                </Detail>
              )}
              <Detail icon={<Globe />} label="Timezone">
                <span className="font-mono">{meeting.timezone}</span>
              </Detail>
            </dl>
            <GateBadges
              isLocked={meeting.isLocked}
              passcodeRequired={meeting.passcodeRequired}
              waitingRoomEnabled={meeting.waitingRoomEnabled}
              aiSummaryEnabled={meeting.aiSummaryEnabled}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {meeting.isHost && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Quick controls</CardTitle>
              <CardDescription>
                Take effect on the next join attempt.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <Field
                orientation="horizontal"
                className="py-2.5 first:pt-0 last:pb-0"
              >
                {meeting.isLocked ? (
                  <Lock className="text-caution size-4" />
                ) : (
                  <LockOpen className="text-muted-foreground size-4" />
                )}
                <FieldContent>
                  <FieldTitle>Locked</FieldTitle>
                  <FieldDescription className="text-xs">
                    Nobody new can join; hosts and co-hosts still can.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  checked={meeting.isLocked}
                  disabled={update.isPending}
                  onCheckedChange={(v) => toggle("isLocked", v)}
                />
              </Field>
              <Field orientation="horizontal" className="py-2.5 last:pb-0">
                <Users className="text-muted-foreground size-4" />
                <FieldContent>
                  <FieldTitle>Waiting room</FieldTitle>
                  <FieldDescription className="text-xs">
                    Participants knock and wait for you.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  checked={meeting.waitingRoomEnabled}
                  disabled={update.isPending}
                  onCheckedChange={(v) => toggle("waitingRoomEnabled", v)}
                />
              </Field>
              <Field orientation="horizontal" className="py-2.5 last:pb-0">
                <Mail className="text-muted-foreground size-4" />
                <FieldContent>
                  <FieldTitle>Chat</FieldTitle>
                  <FieldDescription className="text-xs">
                    Disables the composer for everyone.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  checked={meeting.allowChat}
                  disabled={update.isPending}
                  onCheckedChange={(v) => toggle("allowChat", v)}
                />
              </Field>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Share</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <CopyLinkButton
              roomCode={meeting.roomCode}
              size="default"
              className="justify-start"
            />
            {meeting.scheduledStartAt && (
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => downloadIcs(meeting.id, meeting.roomCode)}
              >
                <CalendarPlus />
                Add to calendar (.ics)
              </Button>
            )}
            {meeting.isHost && (
              <Button
                variant="outline"
                className="justify-start"
                onClick={onInvite}
              >
                <UserPlus />
                Invite by email
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-muted-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center [&_svg]:size-3.5">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="truncate">{children}</dd>
      </div>
    </div>
  );
}

function InvitesTab({
  meeting,
  sent,
  onInvite,
}: {
  meeting: Meeting;
  sent: Invite[];
  onInvite: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between">
            Invites
            <Button size="sm" onClick={onInvite}>
              <UserPlus />
              Invite people
            </Button>
          </CardTitle>
          <CardDescription>
            Each invitee receives an email with the join link. Co-hosts skip the
            waiting room and can moderate.
            {meeting.passcodeRequired &&
              " The passcode is not included in the email — share it separately."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Invites you send in this session are listed here. Re-inviting the
              same address updates the role instead of duplicating it.
            </p>
          ) : (
            <ul className="divide-y">
              {sent.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="inline-flex items-center gap-2 truncate">
                    <Mail className="text-muted-foreground size-3.5" />
                    {inv.invitedEmail}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Badge variant="secondary">
                      {inv.role === "co_host" ? "Co-host" : "Participant"}
                    </Badge>
                    {inv.bypassWaitingRoom && (
                      <Badge variant="outline">Skips waiting room</Badge>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RecordingsTab({ meeting }: { meeting: Meeting }) {
  const { data, isPending } = useRecordings(meeting.id);
  return (
    <RecordingsList
      recordings={data}
      isPending={isPending}
      emptyDescription={
        meeting.allowRecording
          ? "Start a recording from the meeting controls. Files appear here once processing completes and stay for the retention window."
          : "Recording is disabled for this meeting. Turn it on in Settings."
      }
    />
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-8 w-full max-w-md" />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}
