"use client";

import * as React from "react";
import {
  useLocalParticipant,
  useLocalParticipantPermissions,
} from "@livekit/components-react";
import {
  AlertCircle,
  FileText,
  Loader2,
  MessageSquareOff,
  Paperclip,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { PanelShell } from "@/components/room/panels/panel-shell";
import { useCall } from "@/components/room/call-context";
import { useChat, type ChatItem } from "@/hooks/use-chat";
import { useRoomStore } from "@/store/useRoomStore";
import { UPLOAD_ACCEPT } from "@/lib/media-support";
import { formatBytes, formatTime } from "@/lib/format";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

const URL_SPLIT_RE = /(https?:\/\/[^\s<]+)/g;
const URL_TEST_RE = /^https?:\/\/[^\s<]+$/;

function linkify(text: string): React.ReactNode[] {
  const parts = text.split(URL_SPLIT_RE);
  return parts.map((part, i) =>
    URL_TEST_RE.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-signal hover:text-signal-muted break-all underline underline-offset-2"
      >
        {part}
      </a>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

export function ChatPanel() {
  const call = useCall();
  const { localParticipant } = useLocalParticipant();
  const permissions = useLocalParticipantPermissions();
  const incrementUnread = useRoomStore((s) => s.incrementUnread);
  const clearUnread = useRoomStore((s) => s.clearUnread);

  const privateMode = call.meeting?.privacyMode === "private";
  const chatAllowed =
    call.flags.allowChat && (permissions?.canPublishData ?? true);

  const pidToIdentity = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const [identity, row] of call.roster) map.set(row.id, identity);
    return map;
  }, [call.roster]);

  const chat = useChat({
    sessionId: call.sessionId,
    localIdentity: localParticipant.identity,
    localName: localParticipant.name || "You",
    privateMode,
    chatAllowed,
    send: call.send,
    subscribe: call.subscribe,
    identityForParticipantId: (pid) => pidToIdentity.get(pid) ?? null,
    onIncoming: () => incrementUnread(),
    enabled: true,
  });

  React.useEffect(() => {
    clearUnread();
  }, [clearUnread, chat.items.length]);

  const listRef = React.useRef<HTMLDivElement>(null);
  const stickToBottom = React.useRef(true);
  React.useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [chat.items.length, chat.typing.length]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stickToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };

  const [draft, setDraft] = React.useState("");
  const [uploading, setUploading] = React.useState<number | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!draft.trim()) return;
    const text = draft;
    setDraft("");
    await chat.sendMessage(text);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(0);
    try {
      const meta = await chat.uploadAttachment(file, setUploading);
      await chat.sendMessage(file.name, meta);
    } catch (error) {
      notify.error("Could not share the file", error);
    } finally {
      setUploading(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const openAttachment = async (id: string) => {
    try {
      const res = await chat.fetchAttachmentUrl(id);
      window.open(res.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      notify.error("Could not open the file", error);
    }
  };

  return (
    <PanelShell
      title="Chat"
      subtitle={
        privateMode ? (
          <span className="text-shield inline-flex items-center gap-1">
            <ShieldCheck className="size-3" />
            Private mode: messages are never stored
          </span>
        ) : (
          "Messages stay for the meeting's retention window"
        )
      }
      footer={
        <div className="space-y-2">
          {chat.typing.length > 0 && (
            <p
              className="text-muted-foreground px-1 text-[11px]"
              aria-live="polite"
            >
              {chat.typing.slice(0, 2).join(", ")}
              {chat.typing.length > 2
                ? ` and ${chat.typing.length - 2} more`
                : ""}{" "}
              typing…
            </p>
          )}
          {!chatAllowed ? (
            <div className="border-room-border bg-room text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
              <MessageSquareOff className="size-4" />
              {call.flags.allowChat
                ? "You can't send messages right now."
                : "The host has turned chat off."}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
              className="flex items-end gap-1.5"
            >
              <input
                ref={fileInput}
                type="file"
                accept={UPLOAD_ACCEPT}
                className="hidden"
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
              {!privateMode && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Attach a file (25 MB max)"
                  disabled={uploading !== null}
                  onClick={() => fileInput.current?.click()}
                  className="shrink-0 rounded-full"
                >
                  {uploading !== null ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Paperclip />
                  )}
                </Button>
              )}
              <Textarea
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value.slice(0, 4000));
                  chat.notifyTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit();
                  }
                }}
                rows={1}
                placeholder="Message everyone"
                aria-label="Message"
                className="border-room-border bg-room max-h-32 min-h-9 flex-1 resize-none rounded-xl py-2 text-sm"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Send"
                disabled={!draft.trim()}
                className="shrink-0 rounded-full"
              >
                <Send />
              </Button>
            </form>
          )}
          {uploading !== null && (
            <p className="text-muted-foreground px-1 text-[11px]">
              Uploading… {uploading}%
            </p>
          )}
        </div>
      }
    >
      <div
        ref={listRef}
        onScroll={onScroll}
        className="flex h-full flex-col gap-1 p-3"
      >
        {!chat.historyLoaded ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : chat.items.length === 0 ? (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm">
            <p>No messages yet.</p>
            <p className="text-xs">
              Links open in a new tab. Files up to 25 MB.
            </p>
          </div>
        ) : (
          chat.items.map((item, i) => (
            <MessageRow
              key={item.id}
              item={item}
              grouped={
                i > 0 &&
                chat.items[i - 1].senderIdentity === item.senderIdentity &&
                item.at - chat.items[i - 1].at < 120_000
              }
              onRetry={() => chat.retry(item.id)}
              onOpenAttachment={openAttachment}
            />
          ))
        )}
      </div>
    </PanelShell>
  );
}

function MessageRow({
  item,
  grouped,
  onRetry,
  onOpenAttachment,
}: {
  item: ChatItem;
  grouped: boolean;
  onRetry: () => void;
  onOpenAttachment: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "animate-message-in flex flex-col",
        item.mine ? "items-end" : "items-start",
        grouped ? "mt-0.5" : "mt-3",
      )}
    >
      {!grouped && (
        <div
          className={cn(
            "text-muted-foreground mb-0.5 flex items-baseline gap-1.5 px-1 text-[11px]",
            item.mine && "flex-row-reverse",
          )}
        >
          <span className="text-foreground/80 font-medium">
            {item.mine ? "You" : item.senderName}
          </span>
          <time dateTime={new Date(item.at).toISOString()}>
            {formatTime(new Date(item.at))}
          </time>
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-1.5 text-sm leading-relaxed break-words",
          item.mine
            ? "bg-signal text-signal-foreground rounded-br-md"
            : "bg-room-raised text-foreground rounded-bl-md",
        )}
      >
        {item.attachment ? (
          <button
            type="button"
            onClick={() => onOpenAttachment(item.attachment!.id)}
            className={cn(
              "flex items-center gap-2 text-left underline-offset-2 hover:underline",
              item.mine ? "text-signal-foreground" : "text-foreground",
            )}
          >
            <FileText className="size-4 shrink-0" />
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {item.attachment.name}
              </span>
              {item.attachment.size > 0 && (
                <span className="block text-[11px] opacity-80">
                  {formatBytes(item.attachment.size)}
                </span>
              )}
            </span>
          </button>
        ) : (
          <span className="whitespace-pre-wrap">{linkify(item.body)}</span>
        )}
      </div>
      {item.mine && item.status === "unsaved" && (
        <button
          type="button"
          onClick={onRetry}
          className="text-caution mt-0.5 inline-flex items-center gap-1 px-1 text-[11px] hover:underline"
        >
          <AlertCircle className="size-3" />
          Delivered, not saved · retry
          <RefreshCw className="size-3" />
        </button>
      )}
      {item.mine && item.status === "saving" && (
        <span className="text-muted-foreground mt-0.5 px-1 text-[10px]">
          Saving…
        </span>
      )}
    </div>
  );
}
