import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isRateLimited } from "@/lib/rate-limit";
import { brandedEmailHtml, escapeHtml } from "@/lib/email-template";
import {
  getAgentNotificationEmail,
  getResendClient,
  getResendFrom,
} from "@/lib/resend";

interface TourRequestPayload {
  listingId: string;
  name: string;
  email: string;
  phone?: string | null;
  preferredTime: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  if (isRateLimited(request, "tour-requests", 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const body = (await request
    .json()
    .catch(() => null)) as TourRequestPayload | null;

  if (
    !body?.listingId ||
    !body.name?.trim() ||
    !body.email?.trim() ||
    !body.preferredTime
  ) {
    return NextResponse.json(
      { error: "listingId, name, email, and preferredTime are required" },
      { status: 400 },
    );
  }
  if (!isValidEmail(body.email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 },
    );
  }
  const requestedTime = new Date(body.preferredTime);
  if (Number.isNaN(requestedTime.getTime())) {
    return NextResponse.json(
      { error: "Invalid preferredTime" },
      { status: 400 },
    );
  }

  let listingTitle: string;
  try {
    const supabase = getSupabaseAdmin();

    // Attach the signed-in user (if any) so the request shows up on their
    // dashboard — the form itself still works fully signed-out.
    let userId: string | null = null;
    try {
      const serverClient = await getSupabaseServer();
      const {
        data: { user },
      } = await serverClient.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // No session cookie / Supabase not configured — proceed anonymously.
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("title")
      .eq("id", body.listingId)
      .maybeSingle();
    if (listingError) {
      return NextResponse.json(
        { error: listingError.message },
        { status: 500 },
      );
    }
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    listingTitle = listing.title;

    const { error: insertError } = await supabase.from("tour_requests").insert({
      listing_id: body.listingId,
      user_id: userId,
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || null,
      requested_time: requestedTime.toISOString(),
      status: "requested",
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_term: body.utm_term || null,
      utm_content: body.utm_content || null,
    });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 },
    );
  }

  sendTourRequestEmails(body, listingTitle, requestedTime).catch((err) => {
    console.error("Failed to send tour request notification emails", err);
  });

  return NextResponse.json({ ok: true });
}

async function sendTourRequestEmails(
  body: TourRequestPayload,
  listingTitle: string,
  requestedTime: Date,
) {
  const resend = getResendClient();
  if (!resend) return;

  const from = getResendFrom();
  const formattedTime = requestedTime.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  await resend.emails.send({
    from,
    to: getAgentNotificationEmail(),
    subject: `Tour request: ${listingTitle}`,
    text: `${body.name} (${body.email}${body.phone ? `, ${body.phone}` : ""}) requested a tour of "${listingTitle}" for ${formattedTime}.`,
  });

  await resend.emails.send({
    from,
    to: body.email,
    subject: `Tour requested for ${listingTitle}`,
    text: `Hi ${body.name},\n\nYour tour request for "${listingTitle}" on ${formattedTime} has been sent to the agent. They'll confirm with you shortly.\n\n— The team at Flake`,
    html: brandedEmailHtml(
      `<p>Hi ${escapeHtml(body.name)},</p>` +
        `<p>Your tour request for "${escapeHtml(listingTitle)}" on ${escapeHtml(formattedTime)} has been sent to the agent. They'll confirm with you shortly.</p>` +
        `<p>— The team at Flake</p>`,
    ),
  });
}
