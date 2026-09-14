"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useSendInvites } from "@/hooks/use-meetings";
import type { Invite } from "@/lib/api-types";
import {
  inviteFormSchema,
  type InviteFormInput,
  type InviteFormValues,
} from "@/lib/validations/meeting";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function InviteDialog({
  open,
  onOpenChange,
  meetingId,
  waitingRoomEnabled,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  waitingRoomEnabled: boolean;
  onSent?: (invites: Invite[]) => void;
}) {
  const send = useSendInvites(meetingId);
  const form = useForm<InviteFormInput, unknown, InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      emails: "",
      role: "participant",
      bypassWaitingRoom: false,
    },
  });
  const { register, control, handleSubmit, reset, formState, watch } = form;
  const role = watch("role");

  React.useEffect(() => {
    if (open)
      reset({ emails: "", role: "participant", bypassWaitingRoom: false });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await send.mutateAsync({
        emails: values.emails,
        role: values.role,
        bypassWaitingRoom: values.bypassWaitingRoom,
      });
      notify.success(
        `Invited ${result.count} ${result.count === 1 ? "person" : "people"}`,
        "Each gets an email with the join link.",
      );
      onSent?.(result.invites);
      onOpenChange(false);
    } catch (error) {
      notify.error("Could not send invites", error);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="text-primary size-4" />
            Invite people
          </DialogTitle>
          <DialogDescription>
            Separate addresses with commas, spaces or new lines. Invitees sign
            in with the same email to be recognised.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(formState.errors.emails) || undefined}>
              <FieldLabel htmlFor="inv-emails">
                <Mail className="text-muted-foreground size-3.5" />
                Email addresses
              </FieldLabel>
              <Textarea
                id="inv-emails"
                rows={4}
                placeholder={"priya@acme.com, dan@acme.com"}
                autoFocus
                aria-invalid={Boolean(formState.errors.emails)}
                {...register("emails")}
              />
              <FieldError
                errors={[
                  formState.errors.emails as { message?: string } | undefined,
                ]}
              />
            </Field>

            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <div
                  role="radiogroup"
                  aria-label="Role"
                  className="grid grid-cols-2 gap-2"
                >
                  {(["participant", "co_host"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={field.value === r}
                      onClick={() => field.onChange(r)}
                      className={cn(
                        "focus-visible:ring-ring/50 rounded-lg border px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-3",
                        field.value === r
                          ? "border-primary/40 bg-primary/5"
                          : "hover:bg-muted/60",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {r === "co_host" ? "Co-host" : "Participant"}
                        </span>
                        {r === "co_host" && (
                          <Badge variant="secondary">Can moderate</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {r === "co_host"
                          ? "Admits knocks, records, ends the meeting. Skips the waiting room."
                          : "Joins, chats and shares. Subject to the meeting's gates."}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            />

            {waitingRoomEnabled && role === "participant" && (
              <Controller
                control={control}
                name="bypassWaitingRoom"
                render={({ field }) => (
                  <Field
                    orientation="horizontal"
                    className="rounded-lg border px-3 py-2.5"
                  >
                    <FieldContent>
                      <FieldTitle>
                        <label htmlFor="inv-bypass" className="cursor-pointer">
                          Skip the waiting room
                        </label>
                      </FieldTitle>
                      <FieldDescription className="text-xs">
                        These invitees join directly without knocking.
                      </FieldDescription>
                    </FieldContent>
                    <Switch
                      id="inv-bypass"
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) => field.onChange(checked)}
                    />
                  </Field>
                )}
              />
            )}
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={send.isPending}>
              {send.isPending ? <Spinner /> : <Send />}
              Send invites
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
