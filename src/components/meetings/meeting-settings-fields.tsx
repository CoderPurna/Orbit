"use client";

import * as React from "react";
import {
  Controller,
  type Control,
  type UseFormRegister,
  type FieldErrors,
  useWatch,
  type UseFormSetValue,
} from "react-hook-form";
import {
  ShieldCheck,
  Video,
  KeyRound,
  DoorOpen,
  MessageSquare,
  MonitorUp,
  Smile,
  CircleDot,
  Sparkles,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldContent,
  FieldTitle,
} from "@/components/ui/field";
import type { MeetingFormValues } from "@/lib/validations/meeting";
import { cn } from "@/lib/utils";

type Props = {
  control: Control<MeetingFormValues>;
  register: UseFormRegister<MeetingFormValues>;
  errors: FieldErrors<MeetingFormValues>;
  setValue: UseFormSetValue<MeetingFormValues>;
  /** Whether a passcode already exists on the server (edit mode). */
  hasExistingPasscode?: boolean;
};

/**
 * Advanced meeting settings shared by the create dialog and the edit form.
 * Encodes PRD §4.4 in the UI: Private mode greys out recording and AI.
 */
export function MeetingSettingsFields({
  control,
  register,
  errors,
  setValue,
  hasExistingPasscode,
}: Props) {
  const privacyMode = useWatch({ control, name: "privacyMode" });
  const allowRecording = useWatch({ control, name: "allowRecording" });
  const isPrivate = privacyMode === "private";

  React.useEffect(() => {
    if (isPrivate) {
      setValue("allowRecording", false, { shouldDirty: true });
      setValue("autoRecord", false, { shouldDirty: true });
      setValue("aiSummaryEnabled", false, { shouldDirty: true });
    }
  }, [isPrivate, setValue]);

  React.useEffect(() => {
    if (!allowRecording) setValue("autoRecord", false, { shouldDirty: true });
  }, [allowRecording, setValue]);

  return (
    <FieldGroup className="gap-4">
      <Controller
        control={control}
        name="privacyMode"
        render={({ field }) => (
          <div
            role="radiogroup"
            aria-label="Privacy mode"
            className="grid grid-cols-2 gap-2"
          >
            <ModeOption
              selected={field.value === "standard"}
              onSelect={() => field.onChange("standard")}
              icon={<Video />}
              title="Standard"
              description="Recording and AI recap available."
            />
            <ModeOption
              selected={field.value === "private"}
              onSelect={() => field.onChange("private")}
              icon={<ShieldCheck />}
              title="Private"
              description="End-to-end encrypted. No recording, no AI."
              accent="shield"
            />
          </div>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.passcode) || undefined}>
          <FieldLabel htmlFor="mf-passcode">
            <KeyRound className="text-muted-foreground size-3.5" />
            Passcode
          </FieldLabel>
          <Input
            id="mf-passcode"
            type="text"
            autoComplete="off"
            placeholder={
              hasExistingPasscode
                ? "Leave blank to keep current"
                : "Optional, 4+ characters"
            }
            aria-invalid={Boolean(errors.passcode)}
            {...register("passcode")}
          />
          <FieldError errors={[errors.passcode]} />
        </Field>

        <Field data-invalid={Boolean(errors.maxParticipants) || undefined}>
          <FieldLabel htmlFor="mf-max">
            <Users className="text-muted-foreground size-3.5" />
            Max participants
          </FieldLabel>
          <Input
            id="mf-max"
            type="number"
            min={2}
            max={50}
            inputMode="numeric"
            aria-invalid={Boolean(errors.maxParticipants)}
            {...register("maxParticipants", { valueAsNumber: true })}
          />
          <FieldError errors={[errors.maxParticipants]} />
        </Field>
      </div>

      <div className="divide-y rounded-lg border">
        <SwitchRow
          control={control}
          name="waitingRoomEnabled"
          icon={<DoorOpen />}
          title="Waiting room"
          description="People knock and you admit them. Invitees can bypass."
        />
        <SwitchRow
          control={control}
          name="allowChat"
          icon={<MessageSquare />}
          title="Chat"
          description={
            isPrivate
              ? "Delivered live only, never stored in Private mode."
              : "Messages are stored for the meeting's retention window."
          }
        />
        <SwitchRow
          control={control}
          name="allowScreenShare"
          icon={<MonitorUp />}
          title="Screen sharing"
        />
        <SwitchRow
          control={control}
          name="allowReactions"
          icon={<Smile />}
          title="Reactions"
        />
        <SwitchRow
          control={control}
          name="allowRecording"
          icon={<CircleDot />}
          title="Allow recording"
          description={
            isPrivate
              ? "Unavailable: the server only ever sees ciphertext in Private mode."
              : "Host and co-hosts can record to encrypted storage."
          }
          disabled={isPrivate}
        />
        <SwitchRow
          control={control}
          name="autoRecord"
          icon={<CircleDot />}
          title="Record automatically"
          description="Start recording as soon as the meeting begins."
          disabled={isPrivate || !allowRecording}
          nested
        />
        <SwitchRow
          control={control}
          name="aiSummaryEnabled"
          icon={<Sparkles />}
          title="AI recap"
          description={
            isPrivate
              ? "Unavailable in Private mode."
              : "Transcript, summary and action items after the meeting. Requires a recording."
          }
          disabled={isPrivate}
        />
      </div>
    </FieldGroup>
  );
}

function ModeOption({
  selected,
  onSelect,
  icon,
  title,
  description,
  accent = "signal",
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: "signal" | "shield";
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "focus-visible:ring-ring/50 flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-3",
        selected
          ? accent === "shield"
            ? "border-shield/50 bg-shield-subtle"
            : "border-primary/40 bg-primary/5"
          : "border-border hover:bg-muted/60",
      )}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-md [&_svg]:size-4",
          selected
            ? accent === "shield"
              ? "bg-shield text-shield-foreground"
              : "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-medium">{title}</span>
      <span className="text-muted-foreground text-xs leading-snug">
        {description}
      </span>
    </button>
  );
}

function SwitchRow({
  control,
  name,
  icon,
  title,
  description,
  disabled,
  nested,
}: {
  control: Control<MeetingFormValues>;
  name:
    | "waitingRoomEnabled"
    | "allowChat"
    | "allowScreenShare"
    | "allowReactions"
    | "allowRecording"
    | "autoRecord"
    | "aiSummaryEnabled";
  icon: React.ReactNode;
  title: string;
  description?: string;
  disabled?: boolean;
  nested?: boolean;
}) {
  const id = `mf-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field
          orientation="horizontal"
          className={cn(
            "px-3 py-2.5",
            nested && "pl-8",
            disabled && "opacity-60",
          )}
          data-disabled={disabled || undefined}
        >
          <span className="text-muted-foreground flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
            {icon}
          </span>
          <FieldContent>
            <FieldTitle>
              <label htmlFor={id} className="cursor-pointer">
                {title}
              </label>
            </FieldTitle>
            {description && (
              <FieldDescription className="text-xs">
                {description}
              </FieldDescription>
            )}
          </FieldContent>
          <Switch
            id={id}
            checked={field.value}
            disabled={disabled}
            onCheckedChange={(checked) => field.onChange(checked)}
          />
        </Field>
      )}
    />
  );
}
