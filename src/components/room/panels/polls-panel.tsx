"use client";

import * as React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalParticipant } from "@livekit/components-react";
import { BarChart3, Check, Lock, Plus, Trash2, Unlock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PanelShell } from "@/components/room/panels/panel-shell";
import { useCall } from "@/components/room/call-context";
import {
  useCreatePoll,
  usePolls,
  useUpdatePollStatus,
  useVotePoll,
} from "@/hooks/use-meetings";
import type { Poll } from "@/lib/api-types";
import { pollFormSchema, type PollFormValues } from "@/lib/validations/meeting";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function PollsPanel() {
  const call = useCall();
  const { localParticipant } = useLocalParticipant();
  const key = call.meeting?.id ?? call.code;
  const polls = usePolls(key);
  const [creating, setCreating] = React.useState(false);

  // Others' poll activity arrives over the data channel → refetch.
  React.useEffect(() => {
    return call.subscribe((m) => {
      if (m.t === "poll") void polls.refetch();
    });
  }, [call, polls]);

  const myPid = call.roster.get(localParticipant.identity)?.id;

  return (
    <PanelShell
      title="Polls"
      subtitle="Anyone in the call can ask; results update live"
      actions={
        !creating ? (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus />
            New
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-3 p-3">
        {creating && (
          <CreatePollForm meetingKey={key} onDone={() => setCreating(false)} />
        )}
        {polls.isPending ? (
          <div className="flex justify-center py-8">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : polls.isError ? (
          <p className="text-destructive text-sm">Could not load polls.</p>
        ) : polls.data.length === 0 && !creating ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
            <BarChart3 className="size-6" />
            <p>No polls yet. Ask the room something.</p>
          </div>
        ) : (
          [...polls.data]
            .reverse()
            .map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                meetingKey={key}
                myParticipantId={myPid}
              />
            ))
        )}
      </div>
    </PanelShell>
  );
}

function PollCard({
  poll,
  meetingKey,
  myParticipantId,
}: {
  poll: Poll;
  meetingKey: string;
  myParticipantId?: string;
}) {
  const call = useCall();
  const vote = useVotePoll(meetingKey);
  const status = useUpdatePollStatus(meetingKey);
  const [voted, setVoted] = React.useState<Set<string>>(new Set());
  const total = poll.options.reduce((s, o) => s + o.voteCount, 0);
  const canManage =
    call.isModerator ||
    (myParticipantId != null && poll.creatorParticipantId === myParticipantId);
  const open = poll.status === "open";

  const cast = async (optionId: string) => {
    if (!open) return;
    if (!poll.allowMultiple && voted.size > 0) {
      notify.info("You already voted on this poll");
      return;
    }
    try {
      const res = await vote.mutateAsync({ pollId: poll.id, optionId });
      setVoted((prev) => new Set(prev).add(optionId));
      if (!res.counted)
        notify.info(
          "Already counted",
          "Your vote for that option was recorded earlier.",
        );
      void call.send({ v: 1, t: "poll", action: "voted", pollId: poll.id });
    } catch (error) {
      notify.error("Could not vote", error);
    }
  };

  const setStatus = async (next: Poll["status"]) => {
    try {
      await status.mutateAsync({ pollId: poll.id, status: next });
      void call.send({ v: 1, t: "poll", action: "updated", pollId: poll.id });
    } catch (error) {
      notify.error("Could not update the poll", error);
    }
  };

  return (
    <article className="border-room-border bg-room rounded-xl border p-3">
      <header className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm leading-snug font-medium">{poll.question}</h3>
        <Badge
          variant={open ? "default" : "outline"}
          className={cn(
            open ? "bg-signal/20 text-signal" : "text-muted-foreground",
          )}
        >
          {open ? "Open" : poll.status === "closed" ? "Closed" : "Draft"}
        </Badge>
      </header>
      <ul className="space-y-1.5">
        {poll.options.map((o) => {
          const pct = total > 0 ? Math.round((o.voteCount / total) * 100) : 0;
          const mine = voted.has(o.id);
          return (
            <li key={o.id}>
              <button
                type="button"
                disabled={!open || vote.isPending}
                onClick={() => cast(o.id)}
                className={cn(
                  "focus-visible:ring-ring/50 relative w-full overflow-hidden rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors outline-none focus-visible:ring-3 disabled:cursor-default",
                  mine ? "border-signal/50" : "border-room-border",
                  open && "hover:bg-room-raised/60",
                )}
              >
                <span
                  className="bg-signal/15 absolute inset-y-0 left-0 transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                  aria-hidden="true"
                />
                <span className="relative flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    {mine && <Check className="text-signal size-3.5" />}
                    {o.optionText}
                  </span>
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {o.voteCount} · {pct}%
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <footer className="text-muted-foreground mt-2 flex items-center justify-between text-[11px]">
        <span>
          {total} {total === 1 ? "vote" : "votes"}
          {poll.isAnonymous ? " · anonymous" : ""}
          {poll.allowMultiple ? " · multiple choice" : ""}
        </span>
        {canManage && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setStatus(open ? "closed" : "open")}
            disabled={status.isPending}
          >
            {open ? <Lock /> : <Unlock />}
            {open ? "Close" : "Reopen"}
          </Button>
        )}
      </footer>
    </article>
  );
}

function CreatePollForm({
  meetingKey,
  onDone,
}: {
  meetingKey: string;
  onDone: () => void;
}) {
  const call = useCall();
  const create = useCreatePoll(meetingKey);
  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      question: "",
      options: [{ text: "" }, { text: "" }],
      isAnonymous: false,
      allowMultiple: false,
    },
  });
  const { register, control, handleSubmit, formState } = form;
  const options = useFieldArray({ control, name: "options" });

  const onSubmit = handleSubmit(async (v) => {
    try {
      const res = await create.mutateAsync({
        question: v.question,
        options: v.options.map((o) => o.text),
        isAnonymous: v.isAnonymous,
        allowMultiple: v.allowMultiple,
      });
      void call.send({
        v: 1,
        t: "poll",
        action: "created",
        pollId: res.poll.id,
      });
      notify.success("Poll posted");
      onDone();
    } catch (error) {
      notify.error("Could not create the poll", error);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="border-signal/30 bg-room space-y-3 rounded-xl border p-3"
      noValidate
    >
      <Field data-invalid={Boolean(formState.errors.question) || undefined}>
        <FieldLabel htmlFor="poll-q" className="text-xs">
          Question
        </FieldLabel>
        <Input
          id="poll-q"
          autoFocus
          placeholder="What should we decide?"
          className="border-room-border"
          {...register("question")}
        />
        <FieldError errors={[formState.errors.question]} />
      </Field>
      <div className="space-y-1.5">
        <span className="text-xs font-medium">Options</span>
        {options.fields.map((f, i) => (
          <div key={f.id} className="flex items-center gap-1.5">
            <Input
              placeholder={`Option ${i + 1}`}
              className="border-room-border"
              {...register(`options.${i}.text` as const)}
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Remove option"
              disabled={options.fields.length <= 2}
              onClick={() => options.remove(i)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <FieldError
          errors={[
            formState.errors.options?.root,
            ...(formState.errors.options?.map?.((e) => e?.text) ?? []),
          ]}
        />
        {options.fields.length < 10 && (
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => options.append({ text: "" })}
          >
            <Plus />
            Add option
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        <Controller
          control={control}
          name="allowMultiple"
          render={({ field }) => (
            <label className="inline-flex items-center gap-2">
              <Switch
                size="sm"
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v)}
              />
              Multiple choice
            </label>
          )}
        />
        <Controller
          control={control}
          name="isAnonymous"
          render={({ field }) => (
            <label className="inline-flex items-center gap-2">
              <Switch
                size="sm"
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v)}
              />
              Anonymous
            </label>
          )}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          <X />
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={create.isPending}>
          {create.isPending ? <Spinner /> : <BarChart3 />}
          Post poll
        </Button>
      </div>
    </form>
  );
}
