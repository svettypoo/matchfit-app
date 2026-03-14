export function buildProgramEmailTemplate(playerName, programName, url) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#059669;padding:24px 32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:rgba(255,255,255,0.2);border-radius:8px;padding:6px 8px;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;font-weight:bold;">&#9889;</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">MatchFit</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:20px;color:#111827;">Hey ${escapeHtml(playerName)}!</h1>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Your program <strong style="color:#111827;">${escapeHtml(programName)}</strong> is ready. Tap below to view your workouts and start training.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${url}" style="display:inline-block;background:#059669;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">
                      View Program
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;padding:16px;background:#f0fdf4;border-radius:8px;color:#065f46;font-size:13px;text-align:center;">
                No account needed &mdash; just tap the link to get started.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Sent by MatchFit &bull; <a href="${url}" style="color:#059669;text-decoration:none;">View in browser</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildProfileEmailTemplate(playerName, url) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#059669;padding:24px 32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:rgba(255,255,255,0.2);border-radius:8px;padding:6px 8px;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;font-weight:bold;">&#9889;</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">MatchFit</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:20px;color:#111827;">Hey ${escapeHtml(playerName)}!</h1>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Here's your personal MatchFit profile. View your stats, programs, workouts, and rewards all in one place.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${url}" style="display:inline-block;background:#059669;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">
                      View My Profile
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;padding:16px;background:#f0fdf4;border-radius:8px;color:#065f46;font-size:13px;text-align:center;">
                No account needed &mdash; just tap the link to access your profile.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Sent by MatchFit &bull; <a href="${url}" style="color:#059669;text-decoration:none;">View in browser</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
