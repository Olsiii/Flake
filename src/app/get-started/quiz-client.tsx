"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROPERTY_TYPES } from "@/types/listing";
import {
  DEFAULT_QUIZ_ANSWERS,
  QUIZ_AMENITIES,
  QUIZ_REASONS,
  type QuizAnswers,
  type QuizReason,
} from "@/types/quiz";
import { useUser } from "@/hooks/use-user";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { filtersToParams } from "../search/url-state";
import { translateAnswersToFilters } from "./translate-answers";
import { useLanguage } from "@/i18n/language-provider";

const STEP_COUNT = 6;

const inputClass = "input-sm";

function toggleInArray<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function QuizClient() {
  const { t } = useLanguage();
  const { user } = useUser();
  const router = useRouter();

  const REASON_LABELS: Record<QuizReason, string> = {
    "first-home": t.quiz.reasonFirstHome,
    upsizing: t.quiz.reasonUpsizing,
    downsizing: t.quiz.reasonDownsizing,
    investment: t.quiz.reasonInvestment,
    "just-browsing": t.quiz.reasonJustBrowsing,
  };

  const PROPERTY_TYPE_LABELS: Record<
    (typeof PROPERTY_TYPES)[number],
    string
  > = {
    house: t.common.propertyTypeHouse,
    apartment: t.common.propertyTypeApartment,
    office: t.common.propertyTypeOffice,
    land: t.common.propertyTypeLand,
  };

  const AMENITY_LABELS: Record<(typeof QUIZ_AMENITIES)[number]["value"], string> = {
    "no-hoa": t.quiz.amenityNoHoa,
    garage: t.quiz.amenityGarage,
    pool: t.quiz.amenityPool,
    "new-construction": t.quiz.amenityNewConstruction,
    "move-in-ready": t.quiz.amenityMoveInReady,
  };
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(DEFAULT_QUIZ_ANSWERS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(update: Partial<QuizAnswers>) {
    setAnswers((prev) => ({ ...prev, ...update }));
  }

  async function handleFinish() {
    setSubmitting(true);
    setError(null);

    const supabase = getSupabaseBrowser();
    const { error: insertError } = await supabase
      .from("quiz_responses")
      .insert({ user_id: user?.id ?? null, answers: { ...answers } });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    const filters = translateAnswersToFilters(answers);
    const params = filtersToParams(filters, null);
    router.push(`/search?${params.toString()}`);
  }

  const isLast = step === STEP_COUNT - 1;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-h1">{t.quiz.findYourMatch}</h1>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="bg-accent-600 h-full rounded-full transition-all"
            style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          {t.quiz.stepOf
            .replace("{current}", String(step + 1))
            .replace("{total}", String(STEP_COUNT))}
        </p>
      </div>

      <div className="min-h-56">
        {step === 0 && (
          <StepShell title={t.quiz.whatsYourBudget}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder={t.common.min}
                value={answers.minPrice ?? ""}
                onChange={(e) =>
                  patch({
                    minPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className={`${inputClass} w-28`}
              />
              <span className="text-neutral-400">–</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder={t.common.max}
                value={answers.maxPrice ?? ""}
                onChange={(e) =>
                  patch({
                    maxPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className={`${inputClass} w-28`}
              />
            </div>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell title={t.quiz.mustHaveBedsBaths}>
            <div className="flex items-center gap-4">
              <label className="flex flex-col gap-1 text-sm">
                {t.quiz.beds}
                <select
                  value={answers.minBeds ?? ""}
                  onChange={(e) =>
                    patch({
                      minBeds: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className={inputClass}
                >
                  <option value="">{t.common.any}</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}+
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                {t.quiz.baths}
                <select
                  value={answers.minBaths ?? ""}
                  onChange={(e) =>
                    patch({
                      minBaths: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className={inputClass}
                >
                  <option value="">{t.common.any}</option>
                  {[1, 1.5, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}+
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title={t.quiz.whatType}>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => (
                <ChoiceChip
                  key={type}
                  label={PROPERTY_TYPE_LABELS[type]}
                  selected={answers.propertyTypes.includes(type)}
                  onClick={() =>
                    patch({
                      propertyTypes: toggleInArray(answers.propertyTypes, type),
                    })
                  }
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title={t.quiz.whatsBringingYou}>
            <div className="flex flex-col gap-2">
              {QUIZ_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => patch({ reason })}
                  className={`min-h-11 rounded-lg border px-4 py-3 text-left text-sm ${
                    answers.reason === reason
                      ? "border-accent-600 bg-accent-50 dark:bg-accent-950"
                      : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800"
                  }`}
                >
                  {REASON_LABELS[reason]}
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell title={t.quiz.preferredCity}>
            <input
              value={answers.city}
              onChange={(e) => patch({ city: e.target.value })}
              placeholder={t.quiz.preferredCityPlaceholder}
              className={`${inputClass} w-full`}
            />
          </StepShell>
        )}

        {step === 5 && (
          <StepShell title={t.quiz.anyMustHaves}>
            <div className="flex flex-wrap gap-2">
              {QUIZ_AMENITIES.map((a) => (
                <ChoiceChip
                  key={a.value}
                  label={AMENITY_LABELS[a.value]}
                  selected={answers.amenities.includes(a.value)}
                  onClick={() =>
                    patch({
                      amenities: toggleInArray(answers.amenities, a.value),
                    })
                  }
                />
              ))}
            </div>
          </StepShell>
        )}
      </div>

      {error && (
        <p className="text-danger-600 dark:text-danger-400 text-sm">{error}</p>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="btn btn-ghost"
        >
          {t.quiz.back}
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={handleFinish}
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? t.quiz.findingMatches : t.quiz.seeMyMatches}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEP_COUNT - 1, s + 1))}
            className="btn btn-primary"
          >
            {t.quiz.next}
          </button>
        )}
      </div>
    </div>
  );
}

function StepShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-h2">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ChoiceChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 rounded-full border px-3 py-1.5 text-sm capitalize ${
        selected
          ? "border-accent-600 bg-accent-600 text-white"
          : "border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
      }`}
    >
      {label}
    </button>
  );
}
