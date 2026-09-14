"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { MeetingSettingsFields } from "@/components/meetings/meeting-settings-fields";
import { useUpdateMeeting } from "@/hooks/use-meetings";
import type { Meeting, UpdateMeetingInput } from "@/lib/api-types";
import { toDateTimeLocal } from "@/lib/format";
import { notify } from "@/lib/toast";
import {
  meetingFormSchema,
  type MeetingFormValues,
} from "@/lib/validations/meeting";

function toFormValues(m: Meeting): MeetingFormValues {
  const start = m.scheduledStartAt ? new Date(m.scheduledStartAt) : null;
  const end = m.scheduledEndAt ? new Date(m.scheduledEndAt) : null;
  const duration =
    start && end
      ? Math.max(15, Math.round((end.getTime() - start.getTime()) / 60_000))
      : 60;
  return {
    title: m.title,
    description: m.description ?? "",
    type: m.type,
    scheduledStartAt: start ? toDateTimeLocal(start) : "",
    durationMinutes: duration,
    timezone: m.timezone,
    privacyMode: m.privacyMode,
    passcode: "",
    maxParticipants: m.maxParticipants,
    waitingRoomEnabled: m.waitingRoomEnabled,
    allowChat: m.allowChat,
    allowScreenShare: m.allowScreenShare,
    allowReactions: m.allowReactions,
    allowRecording: m.allowRecording,
    autoRecord: m.autoRecord,
    aiSummaryEnabled: m.aiSummaryEnabled,
  };
}

export function MeetingEditForm({ meeting }: { meeting: Meeting }) {
  const update = useUpdateMeeting(meeting.id);
  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: toFormValues(meeting),
  });
  const { register, control, handleSubmit, setValue, reset, watch, formState } =
    form;
  const dirty = formState.dirtyFields;
  const isScheduled = meeting.type !== "instant";

  React.useEffect(() => {
    reset(toFormValues(meeting));
  }, [meeting, reset]);

  const onSubmit = handleSubmit(async (v) => {
    const payload: UpdateMeetingInput = {};
    if (dirty.title) payload.title = v.title.trim();
    if (dirty.description) payload.description = v.description?.trim() || null;
    if (dirty.timezone) payload.timezone = v.timezone;
    if (dirty.maxParticipants) payload.maxParticipants = v.maxParticipants;
    if (dirty.privacyMode) payload.privacyMode = v.privacyMode;
    if (dirty.passcode && v.passcode) payload.passcode = v.passcode;
    if (
      isScheduled &&
      (dirty.scheduledStartAt || dirty.durationMinutes) &&
      v.scheduledStartAt
    ) {
      const start = new Date(v.scheduledStartAt);
      payload.scheduledStartAt = start.toISOString();
      payload.scheduledEndAt = new Date(
        start.getTime() + v.durationMinutes * 60_000,
      ).toISOString();
    }
    for (const key of [
      "waitingRoomEnabled",
      "allowChat",
      "allowScreenShare",
      "allowReactions",
      "allowRecording",
      "autoRecord",
      "aiSummaryEnabled",
    ] as const) {
      if (dirty[key]) payload[key] = v[key];
    }

    if (Object.keys(payload).length === 0) {
      notify.info("Nothing to save");
      return;
    }

    try {
      await update.mutateAsync(payload);
      notify.success("Settings saved");
    } catch (error) {
      notify.error("Could not save the meeting", error);
    }
  });

  const removePasscode = async () => {
    try {
      await update.mutateAsync({ passcode: null });
      notify.success("Passcode removed");
    } catch (error) {
      notify.error("Could not remove the passcode", error);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Details</CardTitle>
          <CardDescription>Title, agenda and schedule.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(formState.errors.title) || undefined}>
              <FieldLabel htmlFor="me-title">Title</FieldLabel>
              <Input
                id="me-title"
                aria-invalid={Boolean(formState.errors.title)}
                {...register("title")}
              />
              <FieldError errors={[formState.errors.title]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="me-description">Agenda</FieldLabel>
              <Textarea
                id="me-description"
                rows={3}
                {...register("description")}
              />
              <FieldError errors={[formState.errors.description]} />
            </Field>
            {isScheduled && (
              <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
                <Field
                  data-invalid={
                    Boolean(formState.errors.scheduledStartAt) || undefined
                  }
                >
                  <FieldLabel htmlFor="me-start">Starts</FieldLabel>
                  <Input
                    id="me-start"
                    type="datetime-local"
                    {...register("scheduledStartAt")}
                  />
                  <FieldError errors={[formState.errors.scheduledStartAt]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="me-duration">Duration</FieldLabel>
                  <NativeSelect className="w-full sm:w-32">
                    <select
                      id="me-duration"
                      {...register("durationMinutes", { valueAsNumber: true })}
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-full min-w-0 appearance-none rounded-lg border bg-transparent py-1 pr-8 pl-2.5 text-sm outline-none focus-visible:ring-3"
                    >
                      {[15, 30, 45, 60, 90, 120, 180, 240].map((m) => (
                        <NativeSelectOption key={m} value={m}>
                          {m < 60
                            ? `${m} min`
                            : `${m / 60} h${m % 60 ? ` ${m % 60} min` : ""}`}
                        </NativeSelectOption>
                      ))}
                    </select>
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="me-tz">Timezone</FieldLabel>
                  <Input
                    id="me-tz"
                    className="font-mono sm:w-44"
                    {...register("timezone")}
                  />
                  <FieldDescription className="text-xs">
                    IANA name, e.g. Europe/Berlin
                  </FieldDescription>
                </Field>
              </div>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Privacy &amp; controls</CardTitle>
          <CardDescription>
            Changes apply to the next join. Switching to Private turns off
            recording and AI recap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {meeting.passcodeRequired && (
            <div className="border-caution/30 bg-caution-subtle flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-2">
                <KeyRound className="text-caution size-4" />A passcode is set.
                Enter a new one below to replace it.
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={removePasscode}
                disabled={update.isPending}
              >
                <Trash2 />
                Remove
              </Button>
            </div>
          )}
          <MeetingSettingsFields
            control={control}
            register={register}
            errors={formState.errors}
            setValue={setValue}
            hasExistingPasscode={meeting.passcodeRequired}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => reset(toFormValues(meeting))}
          disabled={!formState.isDirty || update.isPending}
        >
          Discard
        </Button>
        <Button type="submit" disabled={!formState.isDirty || update.isPending}>
          {update.isPending ? <Spinner /> : <Save />}
          Save changes
        </Button>
      </div>
      {/* keep watch subscribed so privacy-mode effects run */}
      <span className="hidden">{watch("privacyMode")}</span>
    </form>
  );
}
