"use client";

import { useState } from "react";

/** A non-2xx response isn't guaranteed to have a JSON body (e.g. a thrown
 * error before the route handler's own try/catch runs). */
export async function submitJson(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return;

  const data = await res.json().catch(() => null);
  throw new Error(data?.error ?? "Something went wrong. Please try again.");
}

export function SuccessMessage({ text }: { text: string }) {
  return (
    <div className="bg-success-50 text-success-800 dark:bg-success-950 dark:text-success-300 rounded-md p-3 text-sm">
      {text}
    </div>
  );
}

export function ErrorMessage({ text }: { text: string }) {
  return (
    <div className="bg-danger-50 text-danger-700 dark:bg-danger-950 dark:text-danger-300 rounded-md p-3 text-sm">
      {text}
    </div>
  );
}

const inputClass = "input";

/** Shared by the listing detail page's agent card and the map pin popup's
 * "Check availability" button — same /api/leads submission either way. */
export function ContactAgentForm({ listingId }: { listingId: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitJson("/api/leads", { listingId, ...form });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <SuccessMessage text="Thanks! Your message has been sent to the agent — check your email for a confirmation." />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <ErrorMessage text={error} />}
      <input
        required
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className={inputClass}
      />
      <input
        required
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className={inputClass}
      />
      <input
        type="tel"
        placeholder="Phone (optional)"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className={inputClass}
      />
      <textarea
        placeholder="Message (optional)"
        rows={3}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary w-full"
      >
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
