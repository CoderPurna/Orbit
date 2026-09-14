import { z } from "zod";

/**
 * Mirrors the server's createMeetingSchema (POST /api/meetings) — the client
 * schema is a convenience, never the authority (Architecture §10).
 */
export const meetingFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Give the meeting a name")
      .max(200, "Keep it under 200 characters"),
    description: z
      .string()
      .max(5000, "Keep it under 5000 characters")
      .optional(),
    type: z.enum(["instant", "scheduled", "recurring"]),
    scheduledStartAt: z.string().optional(),
    durationMinutes: z.number().int().min(15).max(480),
    timezone: z.string().min(1).max(64),
    privacyMode: z.enum(["standard", "private"]),
    passcode: z
      .string()
      .max(64, "Passcodes are capped at 64 characters")
      .optional()
      .refine(
        (v) => !v || v.length >= 4,
        "Passcodes need at least 4 characters",
      ),
    maxParticipants: z
      .number()
      .int()
      .min(2, "At least 2")
      .max(50, "At most 50"),
    waitingRoomEnabled: z.boolean(),
    allowChat: z.boolean(),
    allowScreenShare: z.boolean(),
    allowReactions: z.boolean(),
    allowRecording: z.boolean(),
    autoRecord: z.boolean(),
    aiSummaryEnabled: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.type !== "instant") {
      if (!values.scheduledStartAt) {
        ctx.addIssue({
          code: "custom",
          path: ["scheduledStartAt"],
          message: "Pick a start time",
        });
      } else if (Number.isNaN(new Date(values.scheduledStartAt).getTime())) {
        ctx.addIssue({
          code: "custom",
          path: ["scheduledStartAt"],
          message: "That date doesn't look right",
        });
      }
    }
  });

export type MeetingFormValues = z.infer<typeof meetingFormSchema>;

export const meetingFormDefaults: MeetingFormValues = {
  title: "",
  description: "",
  type: "instant",
  scheduledStartAt: "",
  durationMinutes: 60,
  timezone: "UTC",
  privacyMode: "standard",
  passcode: "",
  maxParticipants: 25,
  waitingRoomEnabled: false,
  allowChat: true,
  allowScreenShare: true,
  allowReactions: true,
  allowRecording: true,
  autoRecord: false,
  aiSummaryEnabled: false,
};

export const inviteFormSchema = z.object({
  emails: z
    .string()
    .trim()
    .min(1, "Add at least one email")
    .transform((raw) =>
      raw
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(z.string().email("One of those emails is invalid"))
        .min(1, "Add at least one email")
        .max(50, "Invite up to 50 people at a time"),
    ),
  role: z.enum(["participant", "co_host"]),
  bypassWaitingRoom: z.boolean(),
});

export type InviteFormInput = z.input<typeof inviteFormSchema>;
export type InviteFormValues = z.output<typeof inviteFormSchema>;

export const pollFormSchema = z.object({
  question: z.string().trim().min(1, "Ask something").max(500),
  options: z
    .array(
      z.object({
        text: z.string().trim().min(1, "Option can't be empty").max(500),
      }),
    )
    .min(2, "At least two options")
    .max(10, "At most ten options"),
  isAnonymous: z.boolean(),
  allowMultiple: z.boolean(),
});

export type PollFormValues = z.infer<typeof pollFormSchema>;
