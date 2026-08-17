"use client";

import { useState } from "react";
import { useLanguage } from "@/i18n/language-provider";
import { Modal } from "@/components/modal";

const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

type UtmParams = Partial<Record<(typeof UTM_PARAMS)[number], string>>;

/** Reads UTM params off the current URL once, via a lazy useState
 * initializer rather than next/navigation's useSearchParams — that hook
 * forces a Suspense boundary on every ancestor, which isn't worth it just
 * to read the URL a single time at mount. A visitor's utm_* tags describe
 * how they *arrived*, not whatever the URL happens to be by the time they
 * submit a form minutes later, so "once at mount" is correct anyway. */
export function useUtmParams(): UtmParams {
  const [utm] = useState<UtmParams>(() => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    const result: UtmParams = {};
    for (const key of UTM_PARAMS) {
      const value = params.get(key);
      if (value) result[key] = value;
    }
    return result;
  });
  return utm;
}

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
  const { t } = useLanguage();
  const utm = useUtmParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitJson("/api/leads", { listingId, ...form, ...utm });
      setModalOpen(true);
      setForm({ name: "", email: "", phone: "", message: "" });
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
          {t.listing.contactSuccessMessage}
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
      <textarea
        placeholder={t.listing.message}
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
        {submitting ? t.listing.sending : t.listing.sendMessage}
      </button>
    </form>
  );
}
