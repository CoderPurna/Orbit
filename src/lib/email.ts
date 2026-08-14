import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Email not sent.");
    return null;
  }

  const from = process.env.EMAIL_FROM || "Orbit <onboarding@resend.dev>";

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend email error:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Failed to send email via Resend:", err instanceof Error ? err.message : err);
    return null;
  }
}
