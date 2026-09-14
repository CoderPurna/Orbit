"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, ChevronDown, Plus, Video, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import { MeetingSettingsFields } from "@/components/meetings/meeting-settings-fields";
import { useCreateMeeting } from "@/hooks/use-meetings";
import { useSession } from "@/lib/auth-client";
import { isApiError } from "@/lib/api-client";
import type { CreateMeetingInput, MeetingType } from "@/lib/api-types";
import { localTimezone, toDateTimeLocal } from "@/lib/format";
import { notify } from "@/lib/toast";
import {
  meetingFormDefaults,
  meetingFormSchema,
  type MeetingFormValues,
} from "@/lib/validations/meeting";
import { cn } from "@/lib/utils";

export function toCreateInput(v: MeetingFormValues): CreateMeetingInput {
  const scheduled = v.type !== "instant" && v.scheduledStartAt;
  const start = scheduled ? new Date(v.scheduledStartAt as string) : null;
  const isPrivate = v.privacyMode === "private";
  return {
    title: v.title.trim(),
    description: v.description?.trim() || null,
    type: v.type,
    privacyMode: v.privacyMode,
    scheduledStartAt: start ? start.toISOString() : null,
    scheduledEndAt: start
      ? new Date(start.getTime() + v.durationMinutes * 60_000).toISOString()
      : null,
    timezone: v.timezone,
    maxParticipants: v.maxParticipants,
    passcode: v.passcode ? v.passcode : null,
    waitingRoomEnabled: v.waitingRoomEnabled,
    allowChat: v.allowChat,
    allowScreenShare: v.allowScreenShare,
    allowReactions: v.allowReactions,
    allowRecording: isPrivate ? false : v.allowRecording,
    autoRecord: isPrivate ? false : v.autoRecord,
    aiSummaryEnabled: isPrivate ? false : v.aiSummaryEnabled,
  };
}

function nextRoundHour() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

export function CreateMeetingDialog({
  open,
  onOpenChange,
  initialType = "instant",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: MeetingType;
}) {
  const router = useRouter();
  const create = useCreateMeeting();
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: meetingFormDefaults,
  });
  const { register, control, handleSubmit, watch, setValue, reset, formState } =
    form;
  const type = watch("type");

  React.useEffect(() => {
    if (open) {
      reset({
        ...meetingFormDefaults,
        type: initialType,
        timezone: localTimezone(),
        scheduledStartAt: toDateTimeLocal(nextRoundHour()),
      });
      setAdvancedOpen(false);
    }
  }, [open, initialType, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const meeting = await create.mutateAsync(toCreateInput(values));
      onOpenChange(false);
      if (meeting.type === "instant") {
        router.push(`/m/${meeting.roomCode}`);
      } else {
        notify.success(
          "Meeting scheduled",
          `${meeting.title} · ${meeting.roomCode}`,
        );
        router.push(`/dashboard/meetings/${meeting.id}`);
      }
    } catch (error) {
      if (isApiError(error) && error.code === "email_not_verified") {
        notify.error("Verify your email first", error);
        router.push("/verify-email");
        return;
      }
      notify.error("Could not create the meeting", error);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-tight">
            New meeting
          </DialogTitle>
          <DialogDescription>
            Start now or schedule for later. You can change any setting
            afterwards.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          <Tabs
            value={type}
            onValueChange={(v) =>
              setValue("type", v as MeetingType, { shouldDirty: true })
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="instant">
                <Zap />
                Instant
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                <CalendarPlus />
                Scheduled
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(formState.errors.title) || undefined}>
              <FieldLabel htmlFor="cm-title">Title</FieldLabel>
              <Input
                id="cm-title"
                placeholder={
                  type === "instant" ? "Quick sync" : "Weekly planning"
                }
                autoFocus
                aria-invalid={Boolean(formState.errors.title)}
                {...register("title")}
              />
              <FieldError errors={[formState.errors.title]} />
            </Field>

            {type !== "instant" && (
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <Field
                  data-invalid={
                    Boolean(formState.errors.scheduledStartAt) || undefined
                  }
                >
                  <FieldLabel htmlFor="cm-start">Starts</FieldLabel>
                  <Input
                    id="cm-start"
                    type="datetime-local"
                    aria-invalid={Boolean(formState.errors.scheduledStartAt)}
                    {...register("scheduledStartAt")}
                  />
                  <FieldDescription className="text-xs">
                    Your timezone:{" "}
                    <span className="font-mono">{watch("timezone")}</span>
                  </FieldDescription>
                  <FieldError errors={[formState.errors.scheduledStartAt]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="cm-duration">Duration</FieldLabel>
                  <NativeSelect className="w-full sm:w-36">
                    <select
                      id="cm-duration"
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
              </div>
            )}

            <Field
              data-invalid={Boolean(formState.errors.description) || undefined}
            >
              <FieldLabel htmlFor="cm-description">
                Agenda{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </FieldLabel>
              <Textarea
                id="cm-description"
                rows={2}
                placeholder="What's this meeting about?"
                {...register("description")}
              />
              <FieldError errors={[formState.errors.description]} />
            </Field>
          </FieldGroup>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger
              render={
                <button
                  type="button"
                  className="hover:bg-muted/60 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium"
                />
              }
            >
              <span>Privacy &amp; controls</span>
              <ChevronDown
                className={cn(
                  "text-muted-foreground size-4 transition-transform",
                  advancedOpen && "rotate-180",
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <MeetingSettingsFields
                control={control}
                register={register}
                errors={formState.errors}
                setValue={setValue}
              />
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? (
                <Spinner />
              ) : type === "instant" ? (
                <Video />
              ) : (
                <CalendarPlus />
              )}
              {type === "instant" ? "Start meeting" : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Opens the create dialog; used in the shell header and page actions. */
export function NewMeetingButton({
  initialType = "instant",
  label = "New meeting",
  className,
  ...props
}: { initialType?: MeetingType; label?: string } & Omit<
  React.ComponentProps<typeof Button>,
  "onClick" | "children"
>) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button {...props} className={className} onClick={() => setOpen(true)}>
        <Plus />
        {label}
      </Button>
      <CreateMeetingDialog
        open={open}
        onOpenChange={setOpen}
        initialType={initialType}
      />
    </>
  );
}

/** F1: one action → a room. Creates an instant meeting and jumps straight in. */
export function QuickStartButton({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "children">) {
  const router = useRouter();
  const create = useCreateMeeting();
  const { data: session } = useSession();

  const start = async () => {
    const first = session?.user?.name?.split(" ")[0];
    try {
      const meeting = await create.mutateAsync({
        title: first ? `${first}'s meeting` : "Instant meeting",
        type: "instant",
        timezone: localTimezone(),
      });
      router.push(`/m/${meeting.roomCode}`);
    } catch (error) {
      if (isApiError(error) && error.code === "email_not_verified") {
        notify.error("Verify your email first", error);
        router.push("/verify-email");
        return;
      }
      notify.error("Could not start a meeting", error);
    }
  };

  return (
    <Button
      {...props}
      className={className}
      onClick={start}
      disabled={create.isPending}
    >
      {create.isPending ? <Spinner /> : <Zap />}
      {create.isPending ? "Creating room…" : "Start instant meeting"}
    </Button>
  );
}
