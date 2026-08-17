"use client";

import Image from "next/image";
import { useState } from "react";
import type { Agent } from "@/types/listing";
import {
  ContactAgentForm,
  ErrorMessage,
  submitJson,
  useUtmParams,
} from "@/components/contact-agent-form";
import { useLanguage } from "@/i18n/language-provider";
import { Modal } from "@/components/modal";

type Tab = "contact" | "tour";

interface AgentCardProps {
  agent: Agent;
  listingId: string;
}

export function AgentCard({ agent, listingId }: AgentCardProps) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("contact");

  return (
    <section id="agent-card" className="card scroll-mt-6 p-4">
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
          {t.listing.contactAgent}
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
          {t.listing.requestATour}
        </button>
      </div>

      <div className="mt-4">
        {tab === "contact" ? (
          <ContactAgentForm listingId={listingId} />
        ) : (
          <RequestTourForm listingId={listingId} />
        )}
      </div>

      <p className="mt-3 text-center text-xs text-neutral-400">
        {t.listing.responseTimePromise}
      </p>
    </section>
  );
}

const inputClass = "input";

function RequestTourForm({ listingId }: { listingId: string }) {
  const { t } = useLanguage();
  const utm = useUtmParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredTime: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitJson("/api/tour-requests", {
        listingId,
        ...form,
        ...utm,
        preferredTime: new Date(form.preferredTime).toISOString(),
      });
      setModalOpen(true);
      setForm({ name: "", email: "", phone: "", preferredTime: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.listing.somethingWrong);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t.listing.thankYouTitle}
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t.listing.tourSuccessMessage}
        </p>
      </Modal>
      {error && <ErrorMessage text={error} />}
      <input
        required
        placeholder={t.listing.name}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className={inputClass}
      />
      <input
        required
        type="email"
        placeholder={t.listing.email}
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className={inputClass}
      />
      <input
        type="tel"
        placeholder={t.listing.phone}
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
        {submitting ? t.listing.requesting : t.listing.requestTourBtn}
      </button>
    </form>
  );
}
