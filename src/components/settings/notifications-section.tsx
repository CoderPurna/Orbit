"use client";

import * as React from "react";
import { Bell, BellOff, BellRing, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api-client";
import { notify } from "@/lib/toast";

type PushState =
  | "checking"
  | "unsupported"
  | "not_configured"
  | "denied"
  | "subscribed"
  | "unsubscribed";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * F21: Web Push reminders. The subscription is registered with
 * POST /api/push/subscribe; delivery is the reminders cron's job.
 */
export function NotificationsSection() {
  const [state, setState] = React.useState<PushState>("checking");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setState("unsupported");
        return;
      }
      if (!VAPID_PUBLIC_KEY) {
        setState("not_configured");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (!cancelled) setState(sub ? "subscribed" : "unsubscribed");
      } catch {
        if (!cancelled) setState("unsubscribed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = async () => {
    if (!VAPID_PUBLIC_KEY) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "unsubscribed");
        notify.warning(
          "Notifications blocked",
          "Allow notifications for this site in your browser settings.",
        );
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      const json = sub.toJSON();
      await api("/api/push/subscribe", {
        method: "POST",
        body: {
          endpoint: sub.endpoint,
          keys: json.keys,
          platform: "browser",
          userAgent: navigator.userAgent,
        },
      });
      setState("subscribed");
      notify.success(
        "Reminders on",
        "You'll get a push notification before meetings.",
      );
    } catch (error) {
      notify.error("Could not enable push reminders", error);
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) await sub.unsubscribe();
      setState("unsubscribed");
      notify.info("Push reminders off on this device");
    } catch (error) {
      notify.error("Could not disable push reminders", error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="inline-flex items-center gap-2">
            <BellRing className="text-primary size-4" />
            Push reminders
          </CardTitle>
          <CardDescription>
            A nudge on this device shortly before a scheduled meeting starts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">Status</span>
            <PushBadge state={state} />
          </div>
          <p className="text-muted-foreground text-xs">
            {state === "unsupported" &&
              "This browser doesn't support Web Push. Chrome, Edge and Android Chrome do."}
            {state === "not_configured" &&
              "Push isn't configured for this deployment yet (missing public VAPID key)."}
            {state === "denied" &&
              "Notifications are blocked for this site. Re-enable them in your browser's site settings."}
            {state === "subscribed" &&
              "Reminders are enabled on this device. Other devices need to opt in separately."}
            {state === "unsubscribed" &&
              "Enable to receive reminders here. You can turn it off any time."}
            {state === "checking" && "Checking this device…"}
          </p>
          {(state === "subscribed" || state === "unsubscribed") && (
            <Button
              variant={state === "subscribed" ? "outline" : "default"}
              onClick={state === "subscribed" ? unsubscribe : subscribe}
              disabled={busy}
            >
              {busy ? (
                <Spinner />
              ) : state === "subscribed" ? (
                <BellOff />
              ) : (
                <Bell />
              )}
              {state === "subscribed"
                ? "Turn off on this device"
                : "Enable push reminders"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="inline-flex items-center gap-2">
            <Mail className="text-primary size-4" />
            Email
          </CardTitle>
          <CardDescription>What lands in your inbox.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start justify-between gap-3">
              <span>Meeting invitations you send are emailed to invitees.</span>
              <Badge variant="secondary">Always</Badge>
            </li>
            <li className="flex items-start justify-between gap-3">
              <span>Reminders go to invitees before scheduled meetings.</span>
              <Badge variant="secondary">Always</Badge>
            </li>
            <li className="flex items-start justify-between gap-3">
              <span>Verification codes when you sign up or change email.</span>
              <Badge variant="secondary">Always</Badge>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function PushBadge({ state }: { state: PushState }) {
  switch (state) {
    case "subscribed":
      return (
        <Badge className="bg-signal/15 text-signal-muted dark:text-signal">
          Enabled
        </Badge>
      );
    case "unsubscribed":
      return <Badge variant="secondary">Off</Badge>;
    case "denied":
      return <Badge variant="destructive">Blocked</Badge>;
    case "unsupported":
      return <Badge variant="outline">Unsupported</Badge>;
    case "not_configured":
      return <Badge variant="outline">Not configured</Badge>;
    case "checking":
      return <Badge variant="outline">Checking…</Badge>;
  }
}
