"use client";

import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { joinUrlFor } from "@/lib/room-code-format";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function CopyLinkButton({
  roomCode,
  variant = "outline",
  size = "sm",
  label = "Copy link",
  className,
  iconOnly = false,
}: {
  roomCode: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  label?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const { copied, copy } = useClipboard();

  const handleCopy = async () => {
    const ok = await copy(joinUrlFor(roomCode));
    if (!ok) notify.error("Could not copy the link");
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-label={iconOnly ? (copied ? "Link copied" : label) : undefined}
      className={cn(copied && "text-primary", className)}
    >
      {copied ? <Check /> : <Link2 />}
      {!iconOnly && (copied ? "Copied" : label)}
    </Button>
  );
}

/** Invite text for chat/email: title + link + optional passcode note. */
export function buildInviteText(opts: {
  title: string;
  roomCode: string;
  hostName?: string;
  when?: string | null;
  passcodeRequired?: boolean;
}) {
  const lines = [
    `${opts.hostName ? `${opts.hostName} is inviting you to` : "Join"} "${opts.title}" on Orbit`,
    opts.when ? `When: ${opts.when}` : null,
    `Join: ${joinUrlFor(opts.roomCode)}`,
    `Code: ${opts.roomCode}`,
    opts.passcodeRequired
      ? "This meeting requires a passcode — ask the host."
      : null,
  ].filter(Boolean);
  return lines.join("\n");
}
