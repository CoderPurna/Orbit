"use client";

import { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Users,
  ScreenShare,
  Signal,
  Wifi,
  Lock,
  Pin
} from "lucide-react";
import { cn } from "@/lib/utils";

const participants = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Staff Designer",
    color: "oklch(0.672 0.135 158)",
    muted: false,
    speaking: true,
    pinned: true,
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop&auto=format",
  },
  {
    id: 2,
    name: "Marcus Webb",
    role: "Engineering",
    color: "oklch(0.771 0.098 225)",
    muted: true,
    speaking: false,
    pinned: false,
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&auto=format",
  },
  {
    id: 3,
    name: "Priya Nair",
    role: "Product Lead",
    color: "oklch(0.812 0.135 82)",
    muted: false,
    speaking: false,
    pinned: false,
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&auto=format",
  },
  {
    id: 4,
    name: "Tom Fischer",
    role: "Core Infra",
    initials: "TF",
    color: "oklch(0.24 0.02 265)",
    muted: false,
    speaking: false,
    pinned: false,
    img: null,
  },
];

function SpeakingRing({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "absolute inset-0 rounded-[14px] transition-all duration-300 pointer-events-none",
        active && "ring-2 ring-[#3FB27A] shadow-[0_0_15px_rgba(63,178,122,0.4)]"
      )}
    />
  );
}

function ParticipantTile({
  participant,
  large,
}: {
  participant: (typeof participants)[0];
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-[14px] overflow-hidden bg-[#18181b] border border-white/5 flex items-end",
        "transition-all duration-300 hover:border-white/15",
        large ? "col-span-2 row-span-2" : ""
      )}
      style={{ minHeight: large ? 240 : 125 }}
    >
      {participant.img ? (
        <img
          src={participant.img}
          alt={participant.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center font-semibold text-white/90"
          style={{ background: participant.color }}
        >
          <span className="text-xl tracking-wider">{participant.initials}</span>
        </div>
      )}

      {/* Atmospheric bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <SpeakingRing active={participant.speaking} />

      {/* Pinned pill tag */}
      {participant.pinned && (
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/90">
          <Pin size={10} className="text-[#3FB27A]" />
          Spotlight
        </div>
      )}

      {/* Name and audio status tag */}
      <div className="relative z-10 w-full flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white font-medium drop-shadow-sm">{participant.name}</span>
        </div>

        <div>
          {participant.muted ? (
            <span className="p-1 rounded bg-black/50 text-red-400 backdrop-blur-sm inline-flex">
              <MicOff size={11} />
            </span>
          ) : participant.speaking ? (
            <div className="flex gap-[2px] items-end h-3 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
              {[4, 7, 5, 8, 4].map((h, i) => (
                <span
                  key={i}
                  className="w-0.5 bg-[#3FB27A] rounded-full"
                  style={{
                    height: h * 1.5,
                    animation: `rec-pulse ${0.5 + i * 0.12}s ease-in-out infinite alternate`,
                  }}
                />
              ))}
            </div>
          ) : (
            <span className="p-1 rounded bg-black/40 text-white/60 backdrop-blur-sm inline-flex">
              <Mic size={11} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CallTimer() {
  const [seconds, setSeconds] = useState(1432);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return (
    <span className="font-mono text-[11px] tabular-nums text-white/60">
      {m}:{s}
    </span>
  );
}

export function StreamingHero() {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  return (
    <div className="relative w-full max-w-[580px] mx-auto rounded-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-white/10 bg-[#0c0d0e]">
      {/* Chrome window header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#131416] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {/* Mac style dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80" />
          </div>

          <div className="h-3 w-px bg-white/10 ml-0.5" />

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3FB27A] animate-[rec-pulse_1.8s_ease-in-out_infinite]" />
            <span className="text-[11px] font-medium text-white/90">Design Sync · Q3 Roadmap</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <CallTimer />
          <div className="flex items-center gap-1 text-white/60">
            <Users size={11} />
            <span className="text-[11px] font-mono">{participants.length}</span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="p-2.5 grid grid-cols-3 gap-2 bg-[#090a0b]" style={{ minHeight: 330 }}>
        <ParticipantTile participant={participants[0]} large />
        <ParticipantTile participant={participants[1]} />
        <ParticipantTile participant={participants[2]} />
        <ParticipantTile participant={participants[3]} />
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#131416]/90 backdrop-blur-md border-t border-white/[0.06]">
        {/* Left media toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMicOn(!micOn)}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 text-white active:scale-95",
              micOn
                ? "bg-white/10 hover:bg-white/15"
                : "bg-red-500/90 text-white shadow-lg shadow-red-500/25"
            )}
            aria-label={micOn ? "Mute" : "Unmute"}
          >
            {micOn ? <Mic size={15} /> : <MicOff size={15} />}
          </button>
          <button
            onClick={() => setVideoOn(!videoOn)}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 text-white active:scale-95",
              videoOn
                ? "bg-white/10 hover:bg-white/15"
                : "bg-red-500/90 text-white shadow-lg shadow-red-500/25"
            )}
            aria-label={videoOn ? "Stop video" : "Start video"}
          >
            {videoOn ? <Video size={15} /> : <VideoOff size={15} />}
          </button>
          <button 
            onClick={() => setIsSharing(!isSharing)}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95",
              isSharing ? "bg-[#3FB27A] text-white" : "bg-white/10 hover:bg-white/15 text-white"
            )}
            aria-label="Share screen"
          >
            <ScreenShare size={15} />
          </button>
        </div>

        {/* End Call button */}
        <button
          className="px-4 h-9 rounded-xl flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold tracking-wide shadow-lg shadow-red-600/20 active:scale-95 transition-all"
        >
          <PhoneOff size={14} />
          <span>Leave</span>
        </button>

        {/* Right drawer toggles */}
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all">
            <MessageSquare size={15} />
          </button>
          <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all">
            <Users size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
