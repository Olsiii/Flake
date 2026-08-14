"use client";

import Image from "next/image";
import { useState } from "react";
import type { Agent } from "@/types/listing";
import {
  ContactAgentForm,
  ErrorMessage,
  SuccessMessage,
  submitJson,
} from "@/components/contact-agent-form";

type Tab = "contact" | "tour";

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

const inputClass = "input";

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
