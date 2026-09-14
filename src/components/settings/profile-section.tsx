"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailCheck, MailWarning, Save } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { initials } from "@/lib/format";
import { notify } from "@/lib/toast";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(60, "At most 60 characters"),
  image: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => !v || /^https?:\/\//i.test(v), "Must be an https:// URL")
    .optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileSection() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [sending, setSending] = React.useState(false);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", image: "" },
  });
  const { register, handleSubmit, reset, formState, watch } = form;

  React.useEffect(() => {
    if (session?.user) {
      reset({ name: session.user.name ?? "", image: session.user.image ?? "" });
    }
  }, [session?.user, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const { error } = await authClient.updateUser({
      name: values.name,
      image: values.image ? values.image : null,
    });
    if (error) {
      notify.error("Could not update your profile", error);
      return;
    }
    notify.success("Profile updated");
    await refetch();
    router.refresh();
  });

  const resendCode = async () => {
    if (!session?.user?.email) return;
    setSending(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: session.user.email,
      type: "email-verification",
    });
    setSending(false);
    if (error) {
      notify.error("Could not send the code", error);
      return;
    }
    notify.success("Code sent", `Check ${session.user.email}.`);
    router.push(
      `/verify-email?email=${encodeURIComponent(session.user.email)}&next=%2Fdashboard%2Fsettings`,
    );
  };

  if (isPending || !session?.user) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  const user = session.user;
  const previewImage = watch("image");

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <form onSubmit={onSubmit} noValidate>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              How you appear to other participants.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 sm:flex-row">
            <Avatar size="lg" className="size-16 shrink-0">
              <AvatarImage src={previewImage || undefined} alt={user.name} />
              <AvatarFallback className="text-lg">
                {initials(watch("name") || user.name)}
              </AvatarFallback>
            </Avatar>
            <FieldGroup className="flex-1 gap-4">
              <Field data-invalid={Boolean(formState.errors.name) || undefined}>
                <FieldLabel htmlFor="pf-name">Display name</FieldLabel>
                <Input
                  id="pf-name"
                  autoComplete="name"
                  aria-invalid={Boolean(formState.errors.name)}
                  {...register("name")}
                />
                <FieldDescription className="text-xs">
                  Used as your default name in meetings. You can override it per
                  call in the lobby.
                </FieldDescription>
                <FieldError errors={[formState.errors.name]} />
              </Field>
              <Field
                data-invalid={Boolean(formState.errors.image) || undefined}
              >
                <FieldLabel htmlFor="pf-image">Avatar URL</FieldLabel>
                <Input
                  id="pf-image"
                  type="url"
                  placeholder="https://…"
                  aria-invalid={Boolean(formState.errors.image)}
                  {...register("image")}
                />
                <FieldError errors={[formState.errors.image]} />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => reset()}
              disabled={!formState.isDirty || formState.isSubmitting}
            >
              Discard
            </Button>
            <Button
              type="submit"
              disabled={!formState.isDirty || formState.isSubmitting}
            >
              {formState.isSubmitting ? <Spinner /> : <Save />}
              Save
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="truncate text-sm font-medium">{user.email}</p>
          {user.emailVerified ? (
            <Badge className="bg-signal/15 text-signal-muted dark:text-signal">
              <MailCheck />
              Verified
            </Badge>
          ) : (
            <>
              <Badge className="bg-caution-subtle text-caution">
                <MailWarning />
                Not verified
              </Badge>
              <p className="text-muted-foreground text-xs">
                Verification unlocks meeting creation. Joining never requires
                it.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={resendCode} disabled={sending}>
                  {sending ? <Spinner /> : null}
                  Send code
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <Link
                      href={`/verify-email?email=${encodeURIComponent(user.email)}`}
                    />
                  }
                >
                  I have a code
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
