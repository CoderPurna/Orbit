"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { parseJoinInput } from "@/lib/room-code-format";
import { cn } from "@/lib/utils";

/**
 * F2: paste a code or a full link. Accepts `orb-xxxx-xxxx`, `xxxx-xxxx`,
 * `xxxxxxxx`, or `https://…/m/orb-xxxx-xxxx`.
 */
export function JoinByCode({
  className,
  size = "default",
  autoFocus,
}: {
  className?: string;
  size?: "default" | "lg";
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = parseJoinInput(value);
    if (!code) {
      setError("That doesn't look like an Orbit code. Try orb-xxxx-xxxx.");
      return;
    }
    setError(null);
    setPending(true);
    router.push(`/m/${code}`);
  };

  return (
    <form onSubmit={submit} className={cn("w-full", className)} noValidate>
      <InputGroup className={cn(size === "lg" && "h-11 rounded-xl")}>
        <InputGroupAddon>
          <Hash />
        </InputGroupAddon>
        <InputGroupInput
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Enter a code or paste a link"
          aria-label="Meeting code or link"
          aria-invalid={Boolean(error)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus={autoFocus}
          className={cn("font-mono", size === "lg" && "text-base")}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="submit"
            variant="default"
            size={size === "lg" ? "sm" : "xs"}
            disabled={!value.trim() || pending}
            className={cn(size === "lg" && "h-8 rounded-lg px-3")}
          >
            Join
            <ArrowRight />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error && (
        <p role="alert" className="text-destructive mt-1.5 text-xs">
          {error}
        </p>
      )}
    </form>
  );
}

export function JoinButton({
  roomCode,
  children,
  ...props
}: { roomCode: string } & React.ComponentProps<typeof Button>) {
  const router = useRouter();
  return (
    <Button {...props} onClick={() => router.push(`/m/${roomCode}`)}>
      {children}
    </Button>
  );
}
