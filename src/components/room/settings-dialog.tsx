"use client";

import * as React from "react";
import {
  useMediaDeviceSelect,
  useRoomContext,
} from "@livekit/components-react";
import {
  Camera,
  Headphones,
  LayoutGrid,
  Mic,
  Presentation,
  Smile,
  Volume2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field";
import { useRoomStore } from "@/store/useRoomStore";
import { cn } from "@/lib/utils";

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-room-surface ring-room-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Devices switch immediately; preferences are remembered on this
            browser.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="devices">
          <TabsList className="bg-room w-full">
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="prefs">Preferences</TabsTrigger>
          </TabsList>
          <TabsContent value="devices" className="space-y-3 pt-2">
            {open && (
              <>
                <DeviceSelect
                  kind="videoinput"
                  label="Camera"
                  icon={<Camera />}
                />
                <DeviceSelect
                  kind="audioinput"
                  label="Microphone"
                  icon={<Mic />}
                />
                <DeviceSelect
                  kind="audiooutput"
                  label="Speaker"
                  icon={<Volume2 />}
                />
              </>
            )}
          </TabsContent>
          <TabsContent value="prefs" className="pt-2">
            <Preferences />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function DeviceSelect({
  kind,
  label,
  icon,
}: {
  kind: MediaDeviceKind;
  label: string;
  icon: React.ReactNode;
}) {
  const room = useRoomContext();
  const setAudioOutputDeviceId = useRoomStore((s) => s.setAudioOutputDeviceId);
  const { devices, activeDeviceId, setActiveMediaDevice } =
    useMediaDeviceSelect({
      kind,
      room,
      requestPermissions: false,
    });
  const id = `settings-${kind}`;

  return (
    <div className="space-y-1">
      <Label
        htmlFor={id}
        className="text-muted-foreground flex items-center gap-1.5 text-xs [&_svg]:size-3.5"
      >
        {icon}
        {label}
      </Label>
      <div className="relative">
        <select
          id={id}
          value={activeDeviceId}
          disabled={devices.length === 0}
          onChange={(e) => {
            void setActiveMediaDevice(e.target.value);
            if (kind === "audiooutput") setAudioOutputDeviceId(e.target.value);
          }}
          className="border-room-border bg-room focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full appearance-none truncate rounded-lg border px-2.5 pr-7 text-sm outline-none focus-visible:ring-3 disabled:cursor-not-allowed"
        >
          {devices.length === 0 && <option value="">No devices found</option>}
          {devices.map((d, i) => (
            <option key={d.deviceId || i} value={d.deviceId}>
              {d.label || `${label} ${i + 1}`}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
          ▾
        </span>
      </div>
    </div>
  );
}

function Preferences() {
  const layout = useRoomStore((s) => s.layout);
  const setLayout = useRoomStore((s) => s.setLayout);
  const liteMode = useRoomStore((s) => s.liteMode);
  const setLiteMode = useRoomStore((s) => s.setLiteMode);
  const reactionsEnabled = useRoomStore((s) => s.reactionsEnabled);
  const setReactionsEnabled = useRoomStore((s) => s.setReactionsEnabled);

  return (
    <div className="space-y-3">
      <div
        role="radiogroup"
        aria-label="Layout"
        className="grid grid-cols-2 gap-2"
      >
        {(
          [
            ["grid", "Grid", <LayoutGrid key="g" />, "Everyone at equal size."],
            [
              "speaker",
              "Speaker",
              <Presentation key="s" />,
              "Active speaker or pinned person large.",
            ],
          ] as const
        ).map(([value, title, icon, desc]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={layout === value}
            onClick={() => setLayout(value)}
            className={cn(
              "focus-visible:ring-ring/50 flex flex-col items-start gap-1 rounded-lg border p-3 text-left text-sm transition-colors outline-none focus-visible:ring-3 [&_svg]:size-4",
              layout === value
                ? "border-signal/50 bg-signal/10"
                : "border-room-border hover:bg-room-raised",
            )}
          >
            {icon}
            <span className="font-medium">{title}</span>
            <span className="text-muted-foreground text-xs">{desc}</span>
          </button>
        ))}
      </div>

      <div className="divide-room-border border-room-border divide-y rounded-lg border">
        <Field orientation="horizontal" className="px-3 py-2.5">
          <Headphones className="text-muted-foreground size-4" />
          <FieldContent>
            <FieldTitle>
              <label htmlFor="pref-lite" className="cursor-pointer">
                Audio-only (Lite)
              </label>
            </FieldTitle>
            <FieldDescription className="text-xs">
              No video in or out. The cost and bandwidth lever.
            </FieldDescription>
          </FieldContent>
          <Switch
            id="pref-lite"
            checked={liteMode}
            onCheckedChange={(v) => setLiteMode(v)}
          />
        </Field>
        <Field orientation="horizontal" className="px-3 py-2.5">
          <Smile className="text-muted-foreground size-4" />
          <FieldContent>
            <FieldTitle>
              <label htmlFor="pref-reactions" className="cursor-pointer">
                Show reactions
              </label>
            </FieldTitle>
            <FieldDescription className="text-xs">
              Hide floating emoji from others on your screen.
            </FieldDescription>
          </FieldContent>
          <Switch
            id="pref-reactions"
            checked={reactionsEnabled}
            onCheckedChange={(v) => setReactionsEnabled(v)}
          />
        </Field>
      </div>
    </div>
  );
}
