import { SITE_URL } from "./site";

/** Minimal HTML-escaping for values interpolated into email HTML — names
 * and listing titles are user/DB-supplied, not safe to inline as-is. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Wraps a client-facing email body in Flake's branded HTML shell (logo +
 * card). `bodyHtml` must already be escaped/trusted markup. Only used for
 * emails end users see (not internal agent/Flake notification emails). */
export function brandedEmailHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#F4EEE4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EEE4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:480px;">
            <tr>
              <td style="padding:28px 32px 0;">
                <img src="${SITE_URL}/no-bg-flake.png" alt="Flake" height="28" style="display:block;height:28px;width:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;color:#12100E;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
