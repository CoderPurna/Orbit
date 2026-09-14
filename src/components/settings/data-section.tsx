"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, ShieldAlert, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api-client";
import { notify } from "@/lib/toast";

export function DataSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="inline-flex items-center gap-2">
            <Download className="text-primary size-4" />
            Export your data
          </CardTitle>
          <CardDescription>
            A JSON file with your profile, preferences and the meetings you
            host. GDPR and DPDP portability.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Recordings and transcripts are not bundled; download those from each
            meeting&apos;s Recordings tab.
          </p>
          <Button
            variant="outline"
            render={<a href="/api/me/export" download />}
          >
            <Download />
            Download JSON
          </Button>
        </CardContent>
      </Card>

      <DeleteAccountCard />
    </div>
  );
}

function DeleteAccountCard() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  const deleteAccount = async () => {
    setPending(true);
    try {
      await api("/api/me", { method: "DELETE" });
      await authClient.signOut().catch(() => null);
      notify.success("Account deleted", "We're sorry to see you go.");
      router.push("/");
      router.refresh();
    } catch (error) {
      notify.error("Could not delete your account", error);
      setPending(false);
    }
  };

  return (
    <Card className="ring-destructive/30">
      <CardHeader className="border-b">
        <CardTitle className="text-destructive inline-flex items-center gap-2">
          <ShieldAlert className="size-4" />
          Delete account
        </CardTitle>
        <CardDescription>
          Removes your profile, preferences and sign-in methods. Meetings you
          host are retired and their links stop working. This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          <Trash2 />
          Delete my account
        </Button>
      </CardContent>

      <AlertDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setConfirmText("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Type{" "}
              <span className="text-foreground font-mono font-medium">
                DELETE
              </span>{" "}
              to confirm. You&apos;ll be signed out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label
              htmlFor="del-confirm"
              className="text-muted-foreground text-xs"
            >
              Confirmation
            </Label>
            <Input
              id="del-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="font-mono"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!canDelete || pending}
              onClick={deleteAccount}
            >
              {pending ? <Spinner /> : null}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
