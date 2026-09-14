import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Room UI state (Architecture §3, "State ownership"): layout, pinned tile,
 * open panel, device selection. Participants, tracks, mute and connection
 * state are owned by LiveKit hooks and are never mirrored here.
 */
export type LayoutMode = "grid" | "speaker";
export type RoomPanel = "chat" | "people" | "polls" | null;

interface RoomState {
  layout: LayoutMode;
  pinnedIdentity: string | null;
  panel: RoomPanel;
  liteMode: boolean;
  audioOutputDeviceId: string;
  unreadChat: number;
  reactionsEnabled: boolean;

  setLayout: (layout: LayoutMode) => void;
  togglePin: (identity: string) => void;
  clearPin: () => void;
  setPanel: (panel: RoomPanel) => void;
  togglePanel: (panel: Exclude<RoomPanel, null>) => void;
  setLiteMode: (on: boolean) => void;
  setAudioOutputDeviceId: (id: string) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
  setReactionsEnabled: (on: boolean) => void;
  resetSession: () => void;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set, get) => ({
      layout: "grid",
      pinnedIdentity: null,
      panel: null,
      liteMode: false,
      audioOutputDeviceId: "",
      unreadChat: 0,
      reactionsEnabled: true,

      setLayout: (layout) => set({ layout }),
      togglePin: (identity) =>
        set((s) => ({
          pinnedIdentity: s.pinnedIdentity === identity ? null : identity,
          layout: s.pinnedIdentity === identity ? s.layout : "speaker",
        })),
      clearPin: () => set({ pinnedIdentity: null }),
      setPanel: (panel) =>
        set({ panel, unreadChat: panel === "chat" ? 0 : get().unreadChat }),
      togglePanel: (panel) =>
        set((s) => {
          const next = s.panel === panel ? null : panel;
          return {
            panel: next,
            unreadChat: next === "chat" ? 0 : s.unreadChat,
          };
        }),
      setLiteMode: (liteMode) => set({ liteMode }),
      setAudioOutputDeviceId: (audioOutputDeviceId) =>
        set({ audioOutputDeviceId }),
      incrementUnread: () =>
        set((s) => ({
          unreadChat: s.panel === "chat" ? 0 : s.unreadChat + 1,
        })),
      clearUnread: () => set({ unreadChat: 0 }),
      setReactionsEnabled: (reactionsEnabled) => set({ reactionsEnabled }),
      resetSession: () =>
        set({ pinnedIdentity: null, panel: null, unreadChat: 0 }),
    }),
    {
      name: "orbit-room",
      // Only durable preferences persist; per-call state resets every join.
      partialize: (s) => ({
        layout: s.layout,
        liteMode: s.liteMode,
        audioOutputDeviceId: s.audioOutputDeviceId,
        reactionsEnabled: s.reactionsEnabled,
      }),
    },
  ),
);
