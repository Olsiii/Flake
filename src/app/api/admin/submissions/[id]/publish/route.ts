import { NextResponse, after } from "next/server";
import {
  ValidationError,
  publishSubmission,
  validateSubmissionEditPayload,
} from "@/lib/admin/submissions";
import { isRateLimited } from "@/lib/rate-limit";
import { brandedEmailHtml, escapeHtml } from "@/lib/email-template";
import { getResendClient, getResendFrom } from "@/lib/resend";
import { SITE_URL } from "@/lib/site";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (isRateLimited(request, "admin-submissions-write", 30, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const listingDraftId =
    typeof (body as { id?: unknown })?.id === "string"
      ? (body as { id: string }).id
      : undefined;
  try {
    validateSubmissionEditPayload(body);
    const result = await publishSubmission(id, body, listingDraftId);

    after(() =>
      sendPublishedEmail(result).catch((err) => {
        console.error("Failed to send listing-published email", err);
      }),
    );

    return NextResponse.json({ ok: true, listingId: result.listingId });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

async function sendPublishedEmail(result: {
  listingId: string;
  title: string;
  submitterEmail: string;
  submitterName: string | null;
}) {
  const resend = getResendClient();
  if (!resend || !result.submitterEmail) return;

  const listingUrl = `${SITE_URL}/listing/${result.listingId}`;
  const greeting = result.submitterName ? `Hi ${result.submitterName},` : "Hi,";

  await resend.emails.send({
    from: getResendFrom(),
    to: result.submitterEmail,
    subject: `Your listing "${result.title}" is now published on Flake`,
    text: `${greeting}\n\nGood news — your listing "${result.title}" has been reviewed and published on Flake.\n\nView it here: ${listingUrl}\n\n— The team at Flake`,
    html: brandedEmailHtml(
      `<p>${escapeHtml(greeting)}</p>` +
        `<p>Good news — your listing "${escapeHtml(result.title)}" has been reviewed and published on Flake.</p>` +
        `<p><a href="${listingUrl}">View your listing</a></p>` +
        `<p>— The team at Flake</p>`,
    ),
  });
}
