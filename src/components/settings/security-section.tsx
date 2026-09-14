"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Fingerprint,
  KeyRound,
  Laptop,
  LogOut,
  Plus,
  Smartphone,
  Trash2,
} from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTime, formatRelative } from "@/lib/format";
import { notify } from "@/lib/toast";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "At least 8 characters").max(128),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export function SecuritySection() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PasskeysCard />
      <PasswordCard />
      <div className="lg:col-span-2">
        <SessionsCard />
      </div>
    </div>
  );
}

type PasskeyRow = {
  id: string;
  name?: string | null;
  deviceType: string;
  createdAt?: Date | string | null;
  backedUp: boolean;
};

function PasskeysCard() {
  const qc = useQueryClient();
  const passkeys = useQuery({
    queryKey: queryKeys.passkeys(),
    queryFn: async () => {
      const res = await authClient.passkey.listUserPasskeys();
      if (res.error)
        throw new Error(res.error.message ?? "Failed to load passkeys");
      return (res.data ?? []) as PasskeyRow[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const name = suggestPasskeyName();
      const res = await authClient.passkey.addPasskey({ name });
      if (res?.error)
        throw new Error(res.error.message ?? "Could not register the passkey");
      return res;
    },
    onSuccess: () => {
      notify.success("Passkey added", "You can sign in with it from now on.");
      qc.invalidateQueries({ queryKey: queryKeys.passkeys() });
    },
    onError: (error) => notify.error("Passkey registration failed", error),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await authClient.passkey.deletePasskey({ id });
      if (res.error)
        throw new Error(res.error.message ?? "Could not delete the passkey");
    },
    onSuccess: () => {
      notify.success("Passkey removed");
      qc.invalidateQueries({ queryKey: queryKeys.passkeys() });
    },
    onError: (error) => notify.error("Could not remove the passkey", error),
  });

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <Fingerprint className="text-primary size-4" />
            Passkeys
          </span>
          <Button
            size="sm"
            onClick={() => add.mutate()}
            disabled={add.isPending}
          >
            {add.isPending ? <Spinner /> : <Plus />}
            Add passkey
          </Button>
        </CardTitle>
        <CardDescription>
          Sign in with Face ID, Touch ID, Windows Hello or a hardware key.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {passkeys.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : passkeys.isError ? (
          <p className="text-destructive text-sm">
            Could not load your passkeys.
          </p>
        ) : passkeys.data.length === 0 ? (
          <Empty className="py-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <KeyRound />
              </EmptyMedia>
              <EmptyTitle>No passkeys yet</EmptyTitle>
              <EmptyDescription>
                Add one to skip passwords entirely on this device.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y">
            {passkeys.data.map((pk) => (
              <li
                key={pk.id}
                className="flex items-center gap-3 py-2.5 text-sm"
              >
                {pk.deviceType === "multiDevice" || pk.backedUp ? (
                  <Smartphone className="text-muted-foreground size-4" />
                ) : (
                  <Laptop className="text-muted-foreground size-4" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{pk.name || "Passkey"}</p>
                  <p className="text-muted-foreground text-xs">
                    {pk.backedUp ? "Synced" : "This device"}
                    {pk.createdAt
                      ? ` · added ${formatDateTime(pk.createdAt)}`
                      : ""}
                  </p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Remove passkey"
                  onClick={() => remove.mutate(pk.id)}
                  disabled={remove.isPending}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function suggestPasskeyName(): string {
  if (typeof navigator === "undefined") return "Passkey";
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return "iPhone / iPad";
  if (/Android/.test(ua)) return "Android device";
  if (/Mac OS/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux machine";
  return "Passkey";
}

function PasswordCard() {
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
  });
  const { register, handleSubmit, reset, formState } = form;

  const onSubmit = handleSubmit(async (values) => {
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: true,
    });
    if (error) {
      notify.error("Could not change your password", error);
      return;
    }
    notify.success("Password changed", "Other devices were signed out.");
    reset();
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card className="h-full">
        <CardHeader className="border-b">
          <CardTitle className="inline-flex items-center gap-2">
            <KeyRound className="text-primary size-4" />
            Password
          </CardTitle>
          <CardDescription>
            Changing it signs out every other device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-3">
            <Field
              data-invalid={
                Boolean(formState.errors.currentPassword) || undefined
              }
            >
              <FieldLabel htmlFor="pw-current">Current password</FieldLabel>
              <Input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                {...register("currentPassword")}
              />
              <FieldError errors={[formState.errors.currentPassword]} />
            </Field>
            <Field
              data-invalid={Boolean(formState.errors.newPassword) || undefined}
            >
              <FieldLabel htmlFor="pw-new">New password</FieldLabel>
              <Input
                id="pw-new"
                type="password"
                autoComplete="new-password"
                {...register("newPassword")}
              />
              <FieldError errors={[formState.errors.newPassword]} />
            </Field>
            <Field
              data-invalid={Boolean(formState.errors.confirm) || undefined}
            >
              <FieldLabel htmlFor="pw-confirm">Confirm new password</FieldLabel>
              <Input
                id="pw-confirm"
                type="password"
                autoComplete="new-password"
                {...register("confirm")}
              />
              <FieldError errors={[formState.errors.confirm]} />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? <Spinner /> : null}
            Update password
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

type SessionRow = {
  id: string;
  token: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function SessionsCard() {
  const qc = useQueryClient();
  const { data: current } = useSession();
  const sessions = useQuery({
    queryKey: queryKeys.authSessions(),
    queryFn: async () => {
      const res = await authClient.listSessions();
      if (res.error)
        throw new Error(res.error.message ?? "Failed to load sessions");
      return (res.data ?? []) as SessionRow[];
    },
  });

  const revoke = useMutation({
    mutationFn: async (token: string) => {
      const res = await authClient.revokeSession({ token });
      if (res.error)
        throw new Error(res.error.message ?? "Could not revoke the session");
    },
    onSuccess: () => {
      notify.success("Session signed out");
      qc.invalidateQueries({ queryKey: queryKeys.authSessions() });
    },
    onError: (error) => notify.error("Could not sign out that session", error),
  });

  const revokeOthers = useMutation({
    mutationFn: async () => {
      const res = await authClient.revokeOtherSessions();
      if (res.error)
        throw new Error(res.error.message ?? "Could not revoke sessions");
    },
    onSuccess: () => {
      notify.success("Other devices signed out");
      qc.invalidateQueries({ queryKey: queryKeys.authSessions() });
    },
    onError: (error) => notify.error("Could not sign out other devices", error),
  });

  const currentToken = current?.session?.token;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <Laptop className="text-primary size-4" />
            Active sessions
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => revokeOthers.mutate()}
            disabled={
              revokeOthers.isPending || (sessions.data?.length ?? 0) < 2
            }
          >
            {revokeOthers.isPending ? <Spinner /> : <LogOut />}
            Sign out other devices
          </Button>
        </CardTitle>
        <CardDescription>
          Where you&apos;re signed in. IPs are stored hashed; only this list
          sees the raw value.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : sessions.isError ? (
          <p className="text-destructive text-sm">Could not load sessions.</p>
        ) : (
          <ul className="divide-y">
            {sessions.data.map((s) => {
              const isCurrent = s.token === currentToken;
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 py-2.5 text-sm"
                >
                  <Laptop className="text-muted-foreground size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {describeUserAgent(s.userAgent)}
                      {isCurrent && (
                        <Badge className="bg-signal/15 text-signal-muted dark:text-signal ml-2">
                          This device
                        </Badge>
                      )}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      Signed in {formatRelative(s.createdAt)} · expires{" "}
                      {formatRelative(s.expiresAt)}
                      {s.ipAddress ? ` · ${s.ipAddress}` : ""}
                    </p>
                  </div>
                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => revoke.mutate(s.token)}
                      disabled={revoke.isPending}
                    >
                      Sign out
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function describeUserAgent(ua?: string | null): string {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad/.test(ua)
        ? "iOS"
        : /Mac OS/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} on ${os}` : browser;
}
