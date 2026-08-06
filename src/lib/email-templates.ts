/**
 * HTML email template for Meeting Invites.
 */
export function getInviteEmailHtml({
  title,
  hostName,
  joinUrl,
  scheduledStartAt,
}: {
  title: string;
  hostName: string;
  joinUrl: string;
  scheduledStartAt?: string | null;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 40px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; padding: 32px;">
    <tr>
      <td>
        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #ffffff;">Orbit Meeting Invitation</h2>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #a1a1aa; line-height: 1.5;">
          <strong style="color: #f4f4f5;">${hostName}</strong> has invited you to join a meeting.
        </p>
        <div style="background-color: #27272a; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <div style="font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 4px;">${title}</div>
          ${scheduledStartAt ? `<div style="font-size: 13px; color: #a1a1aa;">Scheduled for: ${scheduledStartAt}</div>` : ""}
        </div>
        <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td style="border-radius: 6px; background-color: #6366f1;">
              <a href="${joinUrl}" target="_blank" style="font-size: 14px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 12px 24px; display: inline-block;">Join Meeting</a>
            </td>
          </tr>
        </table>
        <p style="margin: 0; font-size: 12px; color: #71717a;">Or copy this link: <a href="${joinUrl}" style="color: #818cf8;">${joinUrl}</a></p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * HTML email template for 15-minute Meeting Reminders.
 */
export function getReminderEmailHtml({
  title,
  joinUrl,
}: {
  title: string;
  joinUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Starting Soon</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 40px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; padding: 32px;">
    <tr>
      <td>
        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #ffffff;">Starting in 15 Minutes</h2>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #a1a1aa; line-height: 1.5;">
          Your meeting <strong style="color: #f4f4f5;">${title}</strong> is about to begin.
        </p>
        <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td style="border-radius: 6px; background-color: #10b981;">
              <a href="${joinUrl}" target="_blank" style="font-size: 14px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 12px 24px; display: inline-block;">Join Now</a>
            </td>
          </tr>
        </table>
        <p style="margin: 0; font-size: 12px; color: #71717a;">Join link: <a href="${joinUrl}" style="color: #34d399;">${joinUrl}</a></p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
