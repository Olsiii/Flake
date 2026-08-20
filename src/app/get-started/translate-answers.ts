import { DEFAULT_FILTERS, type ListingFilters } from "@/types/listing";
import type { QuizAnswers } from "@/types/quiz";

/** How many years back counts as "new construction" for the amenities step. */
const NEW_CONSTRUCTION_YEARS = 2;

/**
 * Maps quiz answers onto search filters. Not every answer has a matching
 * filter field (e.g. "why are you looking" has no counterpart) — those stay
 * in quiz_responses.answers for future personalization but don't affect
 * the /search redirect.
 */
export function translateAnswersToFilters(
  answers: QuizAnswers,
): ListingFilters {
  const currentYear = new Date().getFullYear();

  return {
    ...DEFAULT_FILTERS,
    minPrice: answers.minPrice,
    maxPrice: answers.maxPrice,
    minBeds: answers.minBeds,
    minBaths: answers.minBaths,
    minSqft: answers.minSqft,
    maxSqft: answers.maxSqft,
    propertyTypes: answers.propertyTypes,
    city: answers.city.trim() || null,
    garageStorage: answers.amenities.includes("garage-storage"),
    minYearBuilt: answers.amenities.includes("new-construction")
      ? currentYear - NEW_CONSTRUCTION_YEARS
      : null,
  };
}
