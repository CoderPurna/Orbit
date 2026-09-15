import * as React from "react";
import {
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field";
import { GateBadges } from "@/components/meetings/meeting-badges";
import { CopyLinkButton } from "@/components/meetings/copy-link-button";
import { RecordingsList } from "@/components/recap/recordings-list";
import {
  downloadIcs,
  useRecordings,
  useUpdateMeeting,
} from "@/hooks/use-meetings";
import { type Invite, type Meeting } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";
import { notify } from "@/lib/toast";

export function OverviewTab({
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
    <div className="grid gap-8 lg:gap-16 lg:grid-cols-[1fr_22rem] mt-6">
      <div className="space-y-12">
        {/* About Section */}
        <section>
          <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-6">
            About Meeting
          </h2>
          {meeting.description ? (
            <p className="text-lg leading-relaxed whitespace-pre-wrap max-w-3xl">
              {meeting.description}
            </p>
          ) : (
            <p className="text-muted-foreground/60 text-lg italic">
              No agenda or description provided.
            </p>
          )}

          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            <Detail icon={<Hash />} label="Room code">
              <span className="font-mono tracking-tight">{meeting.roomCode}</span>
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
              <span className="font-mono tracking-tight text-xs">{meeting.timezone}</span>
            </Detail>
          </div>
          
          <div className="mt-8">
            <GateBadges
              isLocked={meeting.isLocked}
              passcodeRequired={meeting.passcodeRequired}
              waitingRoomEnabled={meeting.waitingRoomEnabled}
              aiSummaryEnabled={meeting.aiSummaryEnabled}
            />
          </div>
        </section>
      </div>

      <div className="space-y-12">
        {/* Quick Controls Section */}
        {meeting.isHost && (
          <section>
            <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-6">
              Live Settings
            </h2>
            <div className="flex flex-col gap-1 border-l-2 border-border/40 pl-6">
              <Field
                orientation="horizontal"
                className="py-4 hover:bg-foreground/5 transition-colors -ml-4 pl-4 rounded-xl items-center"
              >
                {meeting.isLocked ? (
                  <Lock className="text-destructive size-5" />
                ) : (
                  <LockOpen className="text-muted-foreground size-5" />
                )}
                <FieldContent className="flex-1 min-w-0 pr-4">
                  <FieldTitle className="text-base font-semibold">Lock meeting</FieldTitle>
                  <FieldDescription className="text-xs">
                    Prevent new users from joining.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  checked={meeting.isLocked}
                  disabled={update.isPending}
                  onCheckedChange={(v) => toggle("isLocked", v)}
                />
              </Field>
              
              <Field orientation="horizontal" className="py-4 hover:bg-foreground/5 transition-colors -ml-4 pl-4 rounded-xl items-center">
                <Users className="text-muted-foreground size-5" />
                <FieldContent className="flex-1 min-w-0 pr-4">
                  <FieldTitle className="text-base font-semibold">Waiting room</FieldTitle>
                  <FieldDescription className="text-xs">
                    Admit guests manually.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  checked={meeting.waitingRoomEnabled}
                  disabled={update.isPending}
                  onCheckedChange={(v) => toggle("waitingRoomEnabled", v)}
                />
              </Field>
              
              <Field orientation="horizontal" className="py-4 hover:bg-foreground/5 transition-colors -ml-4 pl-4 rounded-xl items-center">
                <Mail className="text-muted-foreground size-5" />
                <FieldContent className="flex-1 min-w-0 pr-4">
                  <FieldTitle className="text-base font-semibold">In-room chat</FieldTitle>
                  <FieldDescription className="text-xs">
                    Allow participants to chat.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  checked={meeting.allowChat}
                  disabled={update.isPending}
                  onCheckedChange={(v) => toggle("allowChat", v)}
                />
              </Field>
            </div>
          </section>
        )}

        {/* Share Section */}
        <section>
          <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-6">
            Share
          </h2>
          <div className="flex flex-col gap-3">
            <CopyLinkButton
              roomCode={meeting.roomCode}
              size="default"
              className="justify-start w-full font-semibold rounded-xl"
            />
            {meeting.scheduledStartAt && (
              <Button
                variant="outline"
                className="justify-start w-full font-semibold rounded-xl"
                onClick={() => downloadIcs(meeting.id, meeting.roomCode)}
              >
                <CalendarPlus className="mr-2 size-4" />
                Add to calendar (.ics)
              </Button>
            )}
            {meeting.isHost && (
              <Button
                variant="outline"
                className="justify-start w-full font-semibold rounded-xl"
                onClick={onInvite}
              >
                <UserPlus className="mr-2 size-4" />
                Invite by email
              </Button>
            )}
          </div>
        </section>
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
    <div className="flex items-start gap-4">
      <span className="text-primary mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        {icon}
      </span>
      <div className="min-w-0 pt-1">
        <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{label}</dt>
        <dd className="truncate font-medium text-foreground mt-0.5">{children}</dd>
      </div>
    </div>
  );
}

export function InvitesTab({
  meeting,
  sent,
  onInvite,
}: {
  meeting: Meeting;
  sent: Invite[];
  onInvite: () => void;
}) {
  return (
    <div className="space-y-8 max-w-4xl mt-6">
      <div className="flex items-center justify-between border-b border-border/20 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sent Invites</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Each invitee receives an email with the join link.
            {meeting.passcodeRequired && " The passcode is not included."}
          </p>
        </div>
        <Button onClick={onInvite} className="rounded-full px-6 font-semibold shadow-sm">
          <UserPlus className="mr-2 size-4" />
          Invite
        </Button>
      </div>
      
      {sent.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground font-medium text-lg">
            No invites sent in this session.
          </p>
          <p className="text-muted-foreground/60 text-sm mt-2">
            Re-inviting the same address updates the role instead of duplicating it.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/20">
          {sent.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Mail className="size-4 text-muted-foreground" />
                </div>
                <span className="truncate font-medium">{inv.invitedEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                {inv.bypassWaitingRoom && (
                  <Badge variant="outline" className="text-xs font-medium bg-background">Skips waiting room</Badge>
                )}
                <Badge variant="secondary" className="text-xs font-semibold">
                  {inv.role === "co_host" ? "Co-host" : "Participant"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RecordingsTab({ meeting }: { meeting: Meeting }) {
  const { data, isPending } = useRecordings(meeting.id);
  return (
    <div className="mt-6">
      <RecordingsList
        recordings={data}
        isPending={isPending}
        emptyDescription={
          meeting.allowRecording
            ? "Start a recording from the meeting controls. Files appear here once processing completes."
            : "Recording is disabled for this meeting. Turn it on in Settings."
        }
      />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-16 w-3/4 rounded-xl" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>
      
      <div className="flex gap-8">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-8 lg:gap-16 lg:grid-cols-[1fr_22rem]">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </div>
  );
}
