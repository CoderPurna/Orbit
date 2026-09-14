"use client";

import * as React from "react";
import { ulid } from "ulid";
import type { Participant } from "livekit-client";
import {
  fetchChatHistory,
  persistChatMessage,
} from "@/hooks/use-session-actions";
import { api } from "@/lib/api-client";
import type { AttachmentUrl, PresignResponse } from "@/lib/api-types";
import type { ChatAttachmentMeta, OrbitMessage } from "@/lib/realtime/envelope";
import { UPLOAD_ALLOWED_MIME, UPLOAD_MAX_BYTES } from "@/lib/media-support";

export type ChatStatus = "sent" | "saving" | "saved" | "unsaved" | "ephemeral";

export type ChatItem = {
  id: string;
  body: string;
  at: number;
  senderIdentity: string | null;
  senderName: string;
  mine: boolean;
  attachment?: ChatAttachmentMeta;
  status: ChatStatus;
  /** From history rather than the live channel. */
  historical?: boolean;
};

type Options = {
  sessionId: string;
  localIdentity: string;
  localName: string;
  privateMode: boolean;
  chatAllowed: boolean;
  send: (message: OrbitMessage) => Promise<void>;
  subscribe: (
    handler: (m: OrbitMessage, from: Participant | undefined) => void,
  ) => () => void;
  /** Resolve a DB participant id to a LiveKit identity, when the roster knows it. */
  identityForParticipantId: (pid: string) => string | null;
  onIncoming?: (item: ChatItem) => void;
  enabled: boolean;
};

/**
 * Chat (PRD F8): dual-path write. The client mints a ULID, broadcasts over the
 * reliable data channel and POSTs to /messages in parallel; receivers render
 * from the channel and de-duplicate against history by id. In Private mode
 * the POST path is skipped and nothing is stored.
 */
export function useChat(opts: Options) {
  const {
    sessionId,
    localIdentity,
    localName,
    privateMode,
    chatAllowed,
    send,
    subscribe,
    identityForParticipantId,
    onIncoming,
    enabled,
  } = opts;

  const [items, setItems] = React.useState<ChatItem[]>([]);
  const [typing, setTyping] = React.useState<
    Map<string, { name: string; until: number }>
  >(new Map());
  const [historyFetched, setHistoryFetched] = React.useState(false);
  // Nothing to fetch when disabled or in Private mode (never stored).
  const historyLoaded = !enabled || privateMode || historyFetched;
  const seen = React.useRef<Set<string>>(new Set());

  const upsert = React.useCallback((item: ChatItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((m) => m.id === item.id);
      if (idx >= 0) {
        const next = prev.slice();
        // Never downgrade a live message to "historical"; do keep server names.
        next[idx] = {
          ...next[idx],
          ...item,
          status: prev[idx].status === "unsaved" ? "unsaved" : item.status,
          historical: prev[idx].historical ?? item.historical,
        };
        return next;
      }
      const next = [...prev, item];
      next.sort((a, b) => a.id.localeCompare(b.id)); // ULIDs sort by time
      return next;
    });
  }, []);

  // History on join (last 100), unless Private mode (never stored).
  React.useEffect(() => {
    if (!enabled || privateMode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchChatHistory(sessionId);
        if (cancelled) return;
        for (const row of res.messages) {
          if (seen.current.has(row.id)) continue;
          seen.current.add(row.id);
          const identity = identityForParticipantId(row.senderParticipantId);
          upsert({
            id: row.id,
            body: row.body ?? "",
            at: new Date(row.sentAt).getTime(),
            senderIdentity: identity,
            senderName: row.senderName ?? "Participant",
            mine: identity === localIdentity,
            attachment: row.attachmentId
              ? {
                  id: row.attachmentId,
                  name: row.body ?? "Attachment",
                  size: 0,
                  mime: "",
                }
              : undefined,
            status: "saved",
            historical: true,
          });
        }
      } catch {
        // History is best-effort; the live channel still works.
      } finally {
        if (!cancelled) setHistoryFetched(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, privateMode, sessionId]);

  // Live channel.
  React.useEffect(() => {
    if (!enabled) return;
    return subscribe((m, from) => {
      if (m.t === "chat") {
        if (!from || from.identity === localIdentity) return;
        if (seen.current.has(m.id)) return;
        seen.current.add(m.id);
        const item: ChatItem = {
          id: m.id,
          body: m.body,
          at: m.at,
          senderIdentity: from.identity,
          senderName: from.name || "Participant",
          mine: false,
          attachment: m.attachment,
          status: privateMode ? "ephemeral" : "sent",
        };
        upsert(item);
        onIncoming?.(item);
        setTyping((prev) => {
          if (!prev.has(from.identity)) return prev;
          const next = new Map(prev);
          next.delete(from.identity);
          return next;
        });
      } else if (m.t === "typing") {
        if (!from || from.identity === localIdentity) return;
        setTyping((prev) => {
          const next = new Map(prev);
          if (m.on)
            next.set(from.identity, {
              name: from.name || "Someone",
              until: Date.now() + 4000,
            });
          else next.delete(from.identity);
          return next;
        });
      }
    });
  }, [enabled, subscribe, localIdentity, privateMode, upsert, onIncoming]);

  // Expire stale typing indicators.
  React.useEffect(() => {
    if (typing.size === 0) return;
    const t = setInterval(() => {
      const now = Date.now();
      setTyping((prev) => {
        let changed = false;
        const next = new Map(prev);
        for (const [k, v] of prev) {
          if (v.until < now) {
            next.delete(k);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [typing.size]);

  const persist = React.useCallback(
    async (item: ChatItem): Promise<void> => {
      // Up to three attempts with backoff; the ULID makes retries idempotent.
      const attempt = async (n: number): Promise<void> => {
        try {
          await persistChatMessage(sessionId, {
            id: item.id,
            body: item.body || null,
            type: item.attachment ? "file" : "text",
            attachmentId: item.attachment?.id ?? null,
          });
          setItems((prev) =>
            prev.map((m) => (m.id === item.id ? { ...m, status: "saved" } : m)),
          );
        } catch {
          if (n < 2) {
            await new Promise((r) => setTimeout(r, 1500 * (n + 1)));
            return attempt(n + 1);
          }
          setItems((prev) =>
            prev.map((m) =>
              m.id === item.id ? { ...m, status: "unsaved" } : m,
            ),
          );
        }
      };
      return attempt(0);
    },
    [sessionId],
  );

  const sendMessage = React.useCallback(
    async (body: string, attachment?: ChatAttachmentMeta) => {
      const text = body.trim();
      if ((!text && !attachment) || !chatAllowed) return;
      const id = ulid();
      const at = Date.now();
      const item: ChatItem = {
        id,
        body: text.slice(0, 4000),
        at,
        senderIdentity: localIdentity,
        senderName: localName,
        mine: true,
        attachment,
        status: privateMode ? "ephemeral" : "saving",
      };
      seen.current.add(id);
      upsert(item);

      const fast = send({
        v: 1,
        t: "chat",
        id,
        body: item.body,
        at,
        attachment,
      }).catch(() => null);
      const durable = privateMode ? Promise.resolve() : persist(item);
      await Promise.all([fast, durable]);
    },
    [chatAllowed, localIdentity, localName, privateMode, send, upsert, persist],
  );

  const retry = React.useCallback(
    (id: string) => {
      const item = items.find((m) => m.id === id);
      if (!item) return;
      setItems((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "saving" } : m)),
      );
      void persist(item);
    },
    [items, persist],
  );

  const lastTyping = React.useRef(0);
  const notifyTyping = React.useCallback(() => {
    const now = Date.now();
    if (now - lastTyping.current < 2500) return;
    lastTyping.current = now;
    void send({ v: 1, t: "typing", on: true }).catch(() => null);
  }, [send]);

  const uploadAttachment = React.useCallback(
    async (
      file: File,
      onProgress?: (pct: number) => void,
    ): Promise<ChatAttachmentMeta> => {
      if (file.size > UPLOAD_MAX_BYTES)
        throw new Error("Files are capped at 25 MB");
      if (!UPLOAD_ALLOWED_MIME.has(file.type))
        throw new Error("This file type can't be shared");
      const presign = await api<PresignResponse>("/api/uploads/presign", {
        method: "POST",
        body: {
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          sessionId,
        },
      });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presign.uploadUrl);
        for (const [k, v] of Object.entries(presign.headers ?? {}))
          xhr.setRequestHeader(k, v);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress)
            onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Upload failed (${xhr.status})`));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });
      return {
        id: presign.attachmentId,
        name: file.name,
        size: file.size,
        mime: file.type,
      };
    },
    [sessionId],
  );

  const fetchAttachmentUrl = React.useCallback(
    (id: string) => api<AttachmentUrl>(`/api/attachments/${id}/url`),
    [],
  );

  return {
    items,
    historyLoaded,
    typing: [...typing.values()].map((t) => t.name),
    sendMessage,
    retry,
    notifyTyping,
    uploadAttachment,
    fetchAttachmentUrl,
  };
}
