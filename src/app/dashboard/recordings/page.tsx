"use client";

import Link from "next/link";
import { Film } from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/app-shell/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordingsList } from "@/components/recap/recordings-list";
import { useMeetings } from "@/hooks/use-meetings";
import { useMeetingRecordings } from "@/hooks/use-recaps";
import { formatWhen } from "@/lib/format";

export default function RecordingsPage() {
  const meetings = useMeetings({ limit: 50 });
  const { groups, isPending } = useMeetingRecordings(meetings.data);
  const withRecordings = groups.filter((g) => g.recordings.length > 0);
  const loading = meetings.isPending || isPending;

  return (
    <>
      <PageHeader
        title="Recordings"
        description="Every recording you can access, with signed download links valid for 7 days."
      />

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          ))}
        </div>
      ) : withRecordings.length === 0 ? (
        <Empty className="bg-card border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Film />
            </EmptyMedia>
            <EmptyTitle>No recordings yet</EmptyTitle>
            <EmptyDescription>
              Hosts and co-hosts can start a recording from the in-call
              controls. Everyone in the room sees a persistent indicator while
              it runs.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-8">
          {withRecordings.map(({ meeting, recordings }) => (
            <section key={meeting.id}>
              <SectionHeading
                title={
                  <Link
                    href={`/dashboard/meetings/${meeting.id}?tab=recordings`}
                    className="hover:underline"
                  >
                    {meeting.title}
                  </Link>
                }
                description={`${meeting.roomCode} · ${formatWhen(meeting.scheduledStartAt ?? meeting.createdAt)}`}
              />
              <RecordingsList recordings={recordings} />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
