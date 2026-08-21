import { NextResponse, after } from "next/server";
import { ValidationError, rejectSubmission } from "@/lib/admin/submissions";
import { isRateLimited } from "@/lib/rate-limit";
import { brandedEmailHtml, escapeHtml } from "@/lib/email-template";
import { getResendClient, getResendFrom } from "@/lib/resend";

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
  const note = typeof body?.note === "string" ? body.note : null;

  try {
    const result = await rejectSubmission(id, note);

    after(() =>
      sendRejectedEmail(result, note).catch((err) => {
        console.error("Failed to send listing-not-accepted email", err);
      }),
    );

    return NextResponse.json({ ok: true });
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

async function sendRejectedEmail(
  result: {
    title: string;
    submitterEmail: string;
    submitterName: string | null;
  },
  note: string | null,
) {
  const resend = getResendClient();
  if (!resend || !result.submitterEmail) return;

  const greeting = result.submitterName ? `Hi ${result.submitterName},` : "Hi,";
  const noteLine = note?.trim()
    ? `\n\nNote from our team: ${note.trim()}`
    : "";
  const noteHtml = note?.trim()
    ? `<p><em>Note from our team: ${escapeHtml(note.trim())}</em></p>`
    : "";

  await resend.emails.send({
    from: getResendFrom(),
    to: result.submitterEmail,
    subject: `An update on your listing "${result.title}"`,
    text: `${greeting}\n\nAfter review, your listing "${result.title}" wasn't published on Flake at this time.${noteLine}\n\n— The team at Flake`,
    html: brandedEmailHtml(
      `<p>${escapeHtml(greeting)}</p>` +
        `<p>After review, your listing "${escapeHtml(result.title)}" wasn't published on Flake at this time.</p>` +
        noteHtml +
        `<p>— The team at Flake</p>`,
    ),
  });
}
