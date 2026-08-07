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

/**
 * HTML email template for Account Email Verification.
 */
export function getVerificationEmailHtml({
  name,
  verifyUrl,
  token,
}: {
  name: string;
  verifyUrl?: string;
  token?: string;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "";
  const isLocalhost = !appUrl || appUrl.includes("localhost") || appUrl.includes("127.0.0.1");
  const logoUrl = !isLocalhost ? `${appUrl.replace(/\/$/, "")}/icons/icon-192.png` : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Orbit account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; width: 100%; background-color: #121215; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 36px 36px 24px 36px; border-bottom: 1px solid #1f1f23;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    ${
                      logoUrl
                        ? `<img src="${logoUrl}" width="32" height="32" alt="Orbit" style="display: block; border: 0;" />`
                        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="32" height="32" role="img" aria-label="Orbit" style="display: block;"><mask id="orbit-gap"><rect width="48" height="48" fill="#fff"></rect><circle cx="24" cy="7" r="6.9" fill="#000"></circle></mask><circle cx="24" cy="24" r="17" fill="none" stroke="#3FB27A" stroke-width="5.33" mask="url(#orbit-gap)"></circle><circle cx="24" cy="7" r="5.33" fill="#3FB27A"></circle></svg>`
                    }
                  </td>
                  <td style="vertical-align: middle; padding-left: 12px;">
                    <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Orbit</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 36px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 600; color: #ffffff; letter-spacing: -0.3px;">Verify your email address</h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #a1a1aa; line-height: 1.6;">
                Welcome to Orbit, <strong style="color: #f4f4f5;">${name}</strong>! Please enter your 6-digit verification code to complete your account setup.
              </p>

              ${
                token
                  ? `
              <!-- OTP Token Box -->
              <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 28px; text-align: center;">
                <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #71717a; letter-spacing: 1.5px; margin-bottom: 12px;">Your 6-Digit Verification Code</div>
                <div style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 32px; font-weight: 700; color: #3FB27A; letter-spacing: 8px;">${token}</div>
              </div>
              `
                  : ""
              }

              ${
                verifyUrl
                  ? `
              <!-- Primary CTA Button -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #3FB27A;">
                    <a href="${verifyUrl}" target="_blank" style="font-size: 15px; font-weight: 600; color: #000000; text-decoration: none; border-radius: 10px; padding: 14px 28px; display: inline-block; letter-spacing: -0.2px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <p style="margin: 0 0 20px 0; font-size: 13px; color: #71717a; line-height: 1.5;">
                This code will expire shortly. If you did not sign up for an Orbit account, no further action is required.
              </p>

              ${
                verifyUrl
                  ? `
              <!-- Fallback Link -->
              <div style="border-top: 1px solid #1f1f23; padding-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #52525b; line-height: 1.5; word-break: break-all;">
                  Having trouble? Copy and paste this URL into your web browser:<br>
                  <a href="${verifyUrl}" style="color: #3FB27A; text-decoration: underline;">${verifyUrl}</a>
                </p>
              </div>
              `
                  : ""
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 32px 36px; background-color: #0d0d10; border-top: 1px solid #1f1f23; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #52525b;">
                &copy; ${new Date().getFullYear()} Orbit. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
