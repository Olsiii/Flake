import { NextResponse, after } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  ValidationError,
  createSubmission,
  validateSubmissionPayload,
} from "@/lib/submissions";
import { isGloballyRateLimited, isRateLimited } from "@/lib/rate-limit";
import { brandedEmailHtml, escapeHtml } from "@/lib/email-template";
import {
  getFlakeNotificationEmail,
  getResendClient,
  getResendFrom,
} from "@/lib/resend";
import { SITE_URL } from "@/lib/site";
import type { SubmissionPayload } from "@/types/listing-submission";

export async function POST(request: Request) {
  if (
    isRateLimited(request, "submissions", 10, 10 * 60 * 1000) ||
    isGloballyRateLimited("submissions", 100, 10 * 60 * 1000)
  ) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  try {
    validateSubmissionPayload(body);
    const row = await createSubmission(user.id, body);

    after(() =>
      sendSubmissionNotification(row.id, body).catch((err) => {
        console.error("Failed to send submission notification email", err);
      }),
    );
    after(() =>
      sendSubmissionConfirmation(user, body).catch((err) => {
        console.error("Failed to send submission confirmation email", err);
      }),
    );

    return NextResponse.json(row);
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

async function sendSubmissionNotification(
  submissionId: string,
  payload: SubmissionPayload,
) {
  const resend = getResendClient();
  if (!resend) return;

  const reviewUrl = `${SITE_URL}/admin/submissions/${submissionId}`;

  await resend.emails.send({
    from: getResendFrom(),
    to: getFlakeNotificationEmail(),
    subject: `New listing submitted: ${payload.title}`,
    text: `A new listing was submitted for review.\n\nTitle: ${payload.title}\nCity: ${payload.city}\nPrice: ${payload.price}\n\nReview it here: ${reviewUrl}`,
    html:
      `<p>A new listing was submitted for review.</p>` +
      `<p><strong>${escapeHtml(payload.title)}</strong><br/>` +
      `${escapeHtml(payload.city)} &middot; ${payload.price}</p>` +
      `<p><a href="${reviewUrl}" style="display:inline-block;background:#12100E;color:#ffffff;` +
      `text-decoration:none;padding:10px 20px;border-radius:6px;font-family:sans-serif;font-size:14px;">` +
      `Review listing</a></p>`,
  });
}

async function sendSubmissionConfirmation(user: User, payload: SubmissionPayload) {
  const resend = getResendClient();
  if (!resend || !user.email) return;

  const { data: profile } = await getSupabaseAdmin()
    .from("users")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();
  const greeting = profile?.name ? `Hi ${profile.name},` : "Hi,";

  await resend.emails.send({
    from: getResendFrom(),
    to: user.email,
    subject: `We received your listing: ${payload.title}`,
    text: `${greeting}\n\nThanks for submitting "${payload.title}" to Flake. Our team will review it and email you once it's published (or let you know if we can't list it).\n\n— The team at Flake`,
    html: brandedEmailHtml(
      `<p>${escapeHtml(greeting)}</p>` +
        `<p>Thanks for submitting "${escapeHtml(payload.title)}" to Flake. Our team will review it and email you once it's published (or let you know if we can't list it).</p>` +
        `<p>— The team at Flake</p>`,
    ),
  });
}
