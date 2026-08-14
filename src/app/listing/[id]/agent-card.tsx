"use client";

import Image from "next/image";
import { useState } from "react";
import type { Agent } from "@/types/listing";

type Tab = "contact" | "tour";

/** A non-2xx response isn't guaranteed to have a JSON body (e.g. a thrown
 * error before the route handler's own try/catch runs). */
async function submitJson(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return;

  const data = await res.json().catch(() => null);
  throw new Error(data?.error ?? "Something went wrong. Please try again.");
}

interface AgentCardProps {
  agent: Agent;
  listingId: string;
}

export function AgentCard({ agent, listingId }: AgentCardProps) {
  const [tab, setTab] = useState<Tab>("contact");

  return (
    <section className="card p-4">
      <div className="flex items-center gap-3">
        {agent.photo_url ? (
          <Image
            src={agent.photo_url}
            alt={agent.name}
            width={48}
            height={48}
            className="rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{agent.name}</div>
          <div className="truncate text-xs text-neutral-500">
            {agent.phone} {agent.phone && agent.email && "·"} {agent.email}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-1 rounded-md bg-neutral-100 p-1 text-sm dark:bg-neutral-800">
        <button
          type="button"
          onClick={() => setTab("contact")}
          className={`min-h-9 flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
            tab === "contact"
              ? "bg-white shadow-sm dark:bg-neutral-700"
              : "text-neutral-500"
          }`}
        >
          Contact Agent
        </button>
        <button
          type="button"
          onClick={() => setTab("tour")}
          className={`min-h-9 flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
            tab === "tour"
              ? "bg-white shadow-sm dark:bg-neutral-700"
              : "text-neutral-500"
          }`}
        >
          Request a Tour
        </button>
      </div>

      <div className="mt-4">
        {tab === "contact" ? (
          <ContactAgentForm listingId={listingId} />
        ) : (
          <RequestTourForm listingId={listingId} />
        )}
      </div>
    </section>
  );
}

function SuccessMessage({ text }: { text: string }) {
  return (
    <div className="bg-success-50 text-success-800 dark:bg-success-950 dark:text-success-300 rounded-md p-3 text-sm">
      {text}
    </div>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <div className="bg-danger-50 text-danger-700 dark:bg-danger-950 dark:text-danger-300 rounded-md p-3 text-sm">
      {text}
    </div>
  );
}

const inputClass = "input";

function ContactAgentForm({ listingId }: { listingId: string }) {
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

function RequestTourForm({ listingId }: { listingId: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredTime: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitJson("/api/tour-requests", {
        listingId,
        ...form,
        preferredTime: new Date(form.preferredTime).toISOString(),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <SuccessMessage text="Tour requested! The agent will confirm your preferred time by email." />
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
      <input
        required
        type="datetime-local"
        value={form.preferredTime}
        onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary w-full"
      >
        {submitting ? "Requesting…" : "Request tour"}
      </button>
    </form>
  );
}
