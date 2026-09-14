"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  ClipboardList,
  ExternalLink,
  Link2,
  MoreHorizontal,
  Trash2,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useClipboard } from "@/hooks/use-clipboard";
import { downloadIcs, useDeleteMeeting } from "@/hooks/use-meetings";
import { joinUrlFor } from "@/lib/room-code-format";
import { buildInviteText } from "@/components/meetings/copy-link-button";
import { formatWhen } from "@/lib/format";
import { notify } from "@/lib/toast";

type MeetingLike = {
  id: string;
  roomCode: string;
  title: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  type: "instant" | "scheduled" | "recurring";
  scheduledStartAt: string | null;
  passcodeRequired?: boolean;
  passcodeHash?: string | null;
};

export function MeetingActionsMenu({
  meeting,
  hostName,
  showOpen = true,
  onDeleted,
  align = "end",
}: {
  meeting: MeetingLike;
  hostName?: string;
  showOpen?: boolean;
  onDeleted?: () => void;
  align?: "start" | "end";
}) {
  const router = useRouter();
  const { copy } = useClipboard();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const canJoin =
    meeting.status !== "cancelled" &&
    !(meeting.status === "ended" && meeting.type === "instant");

  const copyLink = async () => {
    if (await copy(joinUrlFor(meeting.roomCode))) notify.success("Link copied");
  };

  const copyInvite = async () => {
    const text = buildInviteText({
      title: meeting.title,
      roomCode: meeting.roomCode,
      hostName,
      when: meeting.scheduledStartAt
        ? formatWhen(meeting.scheduledStartAt)
        : null,
      passcodeRequired:
        meeting.passcodeRequired ?? Boolean(meeting.passcodeHash),
    });
    if (await copy(text)) notify.success("Invite text copied");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Meeting actions"
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-52">
          {showOpen && (
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/meetings/${meeting.id}`)}
            >
              <ExternalLink />
              Open details
            </DropdownMenuItem>
          )}
          {canJoin && (
            <DropdownMenuItem
              onClick={() => router.push(`/m/${meeting.roomCode}`)}
            >
              <Video />
              {meeting.status === "live" ? "Join" : "Start"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={copyLink}>
            <Link2 />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyInvite}>
            <ClipboardList />
            Copy invite text
          </DropdownMenuItem>
          {meeting.scheduledStartAt && (
            <DropdownMenuItem
              onClick={() => downloadIcs(meeting.id, meeting.roomCode)}
            >
              <CalendarPlus />
              Add to calendar (.ics)
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 />
            Delete meeting
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteMeetingDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        meeting={meeting}
        onDeleted={onDeleted}
      />
    </>
  );
}

export function DeleteMeetingDialog({
  open,
  onOpenChange,
  meeting,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Pick<MeetingLike, "id" | "title" | "status">;
  onDeleted?: () => void;
}) {
  const remove = useDeleteMeeting();

  const confirm = async () => {
    try {
      await remove.mutateAsync(meeting.id);
      notify.success("Meeting deleted", meeting.title);
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      notify.error("Could not delete the meeting", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this meeting?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{meeting.title}&rdquo; will disappear from your list and the
            join link will stop working.{" "}
            {meeting.status === "live"
              ? "Anyone currently in the room will be disconnected. "
              : ""}
            Recordings and recaps follow their own retention schedule.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>
            Keep it
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={confirm}
            disabled={remove.isPending}
          >
            {remove.isPending ? <Spinner /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
