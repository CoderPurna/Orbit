"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";
import { api, isApiError } from "@/lib/api-client";
import {
  isFullMeeting,
  type Meeting,
  type PublicMeeting,
  type TokenResponse,
} from "@/lib/api-types";
import { useMeeting } from "@/hooks/use-meetings";
import { supportsCalls } from "@/lib/media-support";
import { useRoomStore } from "@/store/useRoomStore";
import { RoomGate, type GateKind } from "@/components/room/room-gate";
import { Lobby, type LobbyChoices } from "@/components/room/lobby";
import { CallRoom, type CallExit } from "@/components/room/call-room";
import { PostCall } from "@/components/room/post-call";

type Phase =
  | { kind: "lobby"; passcodeError?: string | null }
  | { kind: "joining" }
  | {
      kind: "connected";
      token: TokenResponse;
      choices: LobbyChoices;
      joinedAt: number;
    }
  | { kind: "gate"; gate: GateKind; detail?: string }
  | { kind: "left"; exit: CallExit; joinedAt: number | null };

/**
 * The join path from the client's side (Architecture §5): resolve → lobby →
 * token mint on Join → connect. Every dead end is a specific, non-alarming
 * message, never a 500 or a bare sign-in prompt (PRD F2).
 */
export function RoomPage({ code }: { code: string }) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const resetRoomSession = useRoomStore((s) => s.resetSession);

  const [phase, setPhase] = React.useState<Phase>({ kind: "lobby" });
  const [supported] = React.useState(() => supportsCalls());

  React.useEffect(() => {
    resetRoomSession();
  }, [resetRoomSession]);

  // Re-resolve once the session arrives so we upgrade from the public shape.
  const meetingQuery = useMeeting(code, {
    enabled: Boolean(code),
    refetchInterval: phase.kind === "lobby" ? 20_000 : false,
  });

  React.useEffect(() => {
    if (!sessionPending && session?.user) meetingQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPending, session?.user?.id]);

  const meeting = meetingQuery.data;

  React.useEffect(() => {
    if (meeting && isFullMeeting(meeting)) {
      document.title = `${meeting.title} · Orbit`;
    }
  }, [meeting]);

  const join = React.useCallback(
    async (choices: LobbyChoices) => {
      setPhase({ kind: "joining" });
      try {
        const token = await api<TokenResponse>(`/api/meetings/${code}/token`, {
          method: "POST",
          body: choices.passcode ? { passcode: choices.passcode } : {},
        });
        setPhase({ kind: "connected", token, choices, joinedAt: Date.now() });
      } catch (error) {
        if (isApiError(error)) {
          switch (error.code) {
            case "invalid_passcode":
              setPhase({ kind: "lobby", passcodeError: error.message });
              return;
            case "meeting_locked":
              setPhase({ kind: "gate", gate: "locked" });
              return;
            case "meeting_full":
              setPhase({ kind: "gate", gate: "full" });
              return;
            case "meeting_ended":
              setPhase({
                kind: "gate",
                gate: meeting?.status === "cancelled" ? "cancelled" : "ended",
              });
              return;
            case "not_found":
              setPhase({ kind: "gate", gate: "not_found" });
              return;
            case "unauthorized":
              router.push(`/signin?next=${encodeURIComponent(`/m/${code}`)}`);
              return;
            case "rate_limited":
              setPhase({ kind: "gate", gate: "rate_limited" });
              return;
            case "media_not_configured":
              setPhase({
                kind: "gate",
                gate: "error",
                detail:
                  "The media service isn't configured for this deployment yet.",
              });
              return;
          }
        }
        setPhase({ kind: "gate", gate: "error" });
      }
    },
    [code, meeting?.status, router],
  );

  const backToLobby = React.useCallback(() => {
    resetRoomSession();
    setPhase({ kind: "lobby" });
    meetingQuery.refetch();
  }, [meetingQuery, resetRoomSession]);

  /* ----------------------------- rendering ----------------------------- */

  if (!supported) {
    return <RoomGate kind="unsupported" code={code} />;
  }

  if (phase.kind === "connected") {
    return (
      <CallRoom
        key={phase.token.sessionId + phase.token.token.slice(-8)}
        meeting={meeting && isFullMeeting(meeting) ? meeting : null}
        code={code}
        token={phase.token}
        choices={phase.choices}
        onExit={(exit) =>
          setPhase({ kind: "left", exit, joinedAt: phase.joinedAt })
        }
      />
    );
  }

  if (phase.kind === "left") {
    return (
      <PostCall
        exit={phase.exit}
        code={code}
        meeting={meeting && isFullMeeting(meeting) ? meeting : null}
        joinedAt={phase.joinedAt}
        onRejoin={backToLobby}
      />
    );
  }

  if (phase.kind === "gate") {
    return (
      <RoomGate
        kind={phase.gate}
        code={code}
        detail={phase.detail}
        onRetry={
          phase.gate === "locked" ||
          phase.gate === "full" ||
          phase.gate === "error" ||
          phase.gate === "rate_limited"
            ? backToLobby
            : undefined
        }
      />
    );
  }

  if (meetingQuery.isPending || sessionPending) {
    return (
      <main className="text-muted-foreground flex min-h-svh flex-col items-center justify-center gap-3">
        <Spinner className="size-6" />
        <p className="font-mono text-xs tracking-[0.14em] uppercase">{code}</p>
      </main>
    );
  }

  if (meetingQuery.isError || !meeting) {
    const err = meetingQuery.error;
    if (isApiError(err) && err.status === 404)
      return <RoomGate kind="not_found" code={code} />;
    if (isApiError(err) && err.status === 429)
      return (
        <RoomGate
          kind="rate_limited"
          code={code}
          onRetry={() => meetingQuery.refetch()}
        />
      );
    return (
      <RoomGate
        kind="error"
        code={code}
        onRetry={() => meetingQuery.refetch()}
      />
    );
  }

  if (meeting.status === "cancelled")
    return <RoomGate kind="cancelled" code={code} />;
  if (
    meeting.status === "ended" &&
    isFullMeeting(meeting) &&
    meeting.type === "instant"
  ) {
    return <RoomGate kind="ended" code={code} />;
  }

  if (!session?.user || !isFullMeeting(meeting)) {
    const pub = meeting as PublicMeeting;
    const next = encodeURIComponent(`/m/${code}`);
    return (
      <RoomGate kind="signin" code={code} hostName={pub.hostName}>
        <Button size="lg" render={<Link href={`/signin?next=${next}`} />}>
          <LogIn />
          Sign in and join
        </Button>
        <Button
          size="lg"
          variant="outline"
          render={<Link href={`/signup?next=${next}`} />}
        >
          <UserPlus />
          Create account
        </Button>
      </RoomGate>
    );
  }

  return (
    <Lobby
      meeting={meeting as Meeting}
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      joining={phase.kind === "joining"}
      passcodeError={
        phase.kind === "lobby" ? (phase.passcodeError ?? null) : null
      }
      onJoin={join}
    />
  );
}
