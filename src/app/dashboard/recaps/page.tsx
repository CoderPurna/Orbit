"use client";

import Link from "next/link";
import { ArrowRight, ListChecks, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PrivacyBadge } from "@/components/meetings/meeting-badges";
import { PipelineStatusBadge } from "@/components/recap/pipeline-status";
import { useMeetings } from "@/hooks/use-meetings";
import { useMeetingRecaps } from "@/hooks/use-recaps";
import { formatWhen } from "@/lib/format";

export default function RecapsPage() {
  const meetings = useMeetings({ limit: 50 });
  const { recaps, isPending, truncated } = useMeetingRecaps(meetings.data);

  const withRecap = recaps.filter((r) => r.data?.summary);
  const loading = meetings.isPending || isPending;

  return (
    <>
      <PageHeader
        title="Recaps"
        description="AI summaries, decisions and action items from recorded meetings."
      />

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : withRecap.length === 0 ? (
        <Empty className="bg-card border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Sparkles />
            </EmptyMedia>
            <EmptyTitle>No recaps yet</EmptyTitle>
            <EmptyDescription>
              Turn on <strong>AI recap</strong> in a meeting&apos;s settings,
              record the session, and a summary with decisions and action items
              appears here within minutes of it ending.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {withRecap.map(({ meeting, data }) => {
            const summary = data!.summary!;
            const openItems = data!.actionItems.filter(
              (a) => a.status === "open" || a.status === "in_progress",
            ).length;
            return (
              <Link
                key={meeting.id}
                href={`/dashboard/meetings/${meeting.id}?tab=recap`}
                className="group focus-visible:ring-ring/50 rounded-xl outline-none focus-visible:ring-3"
              >
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <PipelineStatusBadge status={summary.status} />
                      <PrivacyBadge mode={meeting.privacyMode} />
                      <span className="text-muted-foreground ml-auto text-xs">
                        {formatWhen(
                          meeting.scheduledStartAt ?? meeting.createdAt,
                        )}
                      </span>
                    </div>
                    <CardTitle className="mt-1 group-hover:underline">
                      {meeting.title}
                    </CardTitle>
                    {summary.tldr && (
                      <CardDescription className="line-clamp-3 leading-relaxed">
                        {summary.tldr}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="text-muted-foreground mt-auto flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-3">
                      {summary.decisions.length > 0 && (
                        <span>{summary.decisions.length} decisions</span>
                      )}
                      {data!.actionItems.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <ListChecks className="size-3.5" />
                          {openItems}/{data!.actionItems.length} open
                        </span>
                      )}
                    </span>
                    <span className="text-foreground/80 inline-flex items-center gap-1 font-medium">
                      Open recap
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {truncated && (
        <p className="text-muted-foreground mt-4 text-xs">
          Showing recaps for your 30 most recent meetings. Older ones are
          available from each meeting&apos;s Recap tab.{" "}
          <Badge variant="outline">30 max</Badge>
        </p>
      )}
    </>
  );
}
