"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { RoomPage } from "@/components/room/room-page";
import { Spinner } from "@/components/ui/spinner";

export default function MeetingRoomPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toLowerCase();

  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Spinner className="text-muted-foreground size-6" />
        </div>
      }
    >
      <RoomPage code={code} />
    </React.Suspense>
  );
}
