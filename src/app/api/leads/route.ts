import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isRateLimited } from "@/lib/rate-limit";
import { brandedEmailHtml, escapeHtml } from "@/lib/email-template";
import {
  getAgentNotificationEmail,
  getFlakeNotificationEmail,
  getResendClient,
  getResendFrom,
} from "@/lib/resend";

interface LeadPayload {
  listingId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  if (isRateLimited(request, "leads", 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as LeadPayload | null;
  if (!body?.name?.trim() || !body.email?.trim()) {
    return NextResponse.json(
      { error: "name and email are required" },
      { status: 400 },
    );
  }
  if (!isValidEmail(body.email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error: insertError } = await supabase.from("leads").insert({
      listing_id: body.listingId ?? null,
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || null,
      message: body.message?.trim() || null,
      source: "listing_page",
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

  // Best-effort: a lead is captured either way, email delivery shouldn't
  // block the success response.
  sendLeadEmails(body).catch((err) => {
    console.error("Failed to send lead notification emails", err);
  });

  return NextResponse.json({ ok: true });
}

async function sendLeadEmails(body: LeadPayload) {
  const resend = getResendClient();
  if (!resend) return;

  const listingTitle = await lookupListingTitle(body.listingId);
  const from = getResendFrom();

  await resend.emails.send({
    from,
    to: getAgentNotificationEmail(),
    subject: `New inquiry: ${listingTitle}`,
    text: `${body.name} (${body.email}${body.phone ? `, ${body.phone}` : ""}) is interested in "${listingTitle}".\n\nMessage:\n${body.message || "(no message)"}`,
  });

  await resend.emails.send({
    from,
    to: getFlakeNotificationEmail(),
    subject: `New inquiry: ${listingTitle}`,
    text: `${body.name} (${body.email}${body.phone ? `, ${body.phone}` : ""}) is interested in "${listingTitle}".\n\nMessage:\n${body.message || "(no message)"}`,
  });

  await resend.emails.send({
    from,
    to: body.email,
    subject: `We received your inquiry about ${listingTitle}`,
    text: `Hi ${body.name},\n\nThanks for reaching out about "${listingTitle}". An agent will be in touch shortly.\n\n— The team at Flake`,
    html: brandedEmailHtml(
      `<p>Hi ${escapeHtml(body.name)},</p>` +
        `<p>Thanks for reaching out about "${escapeHtml(listingTitle)}". An agent will be in touch shortly.</p>` +
        `<p>— The team at Flake</p>`,
    ),
  });
}

async function lookupListingTitle(listingId: string | null | undefined) {
  if (!listingId) return "a listing";
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("listings")
    .select("title")
    .eq("id", listingId)
    .maybeSingle();
  return data?.title ?? "a listing";
}
