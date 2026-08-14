import { Resend } from "resend";

const DEFAULT_FROM = "Flake <onboarding@resend.dev>";

/**
 * Null when RESEND_API_KEY isn't set, so callers can treat email as
 * best-effort — a lead/tour-request should still succeed even if the
 * email provider isn't configured yet or has an outage.
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

export function getResendFrom(): string {
  return process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
}

/** Where agent-facing notifications go — seeded agents have fake emails. */
export function getAgentNotificationEmail(): string {
  return (
    process.env.AGENT_NOTIFICATION_EMAIL || "agent-notifications@example.com"
  );
}

/** Flake's own inbox — cc'd on every lead so the company has a copy independent of the listing agent. */
export function getFlakeNotificationEmail(): string {
  return process.env.FLAKE_NOTIFICATION_EMAIL || "flakeeestate@gmail.com";
}
