import type { PropertyType } from "./listing";

export const QUIZ_REASONS = [
  "first-home",
  "upsizing",
  "downsizing",
  "investment",
  "just-browsing",
] as const;
export type QuizReason = (typeof QUIZ_REASONS)[number];

export const QUIZ_AMENITIES = [
  { value: "garage", label: "Garage" },
  { value: "garage-storage", label: "Storage room in garage" },
  { value: "pool", label: "Pool" },
  { value: "new-construction", label: "New construction" },
  { value: "move-in-ready", label: "Move-in ready" },
] as const;
export type QuizAmenity = (typeof QUIZ_AMENITIES)[number]["value"];

export interface QuizAnswers {
  minPrice: number | null;
  maxPrice: number | null;
  minBeds: number | null;
  minBaths: number | null;
  minSqft: number | null;
  maxSqft: number | null;
  propertyTypes: PropertyType[];
  reason: QuizReason | null;
  city: string;
  amenities: QuizAmenity[];
}

export const DEFAULT_QUIZ_ANSWERS: QuizAnswers = {
  minPrice: null,
  maxPrice: null,
  minBeds: null,
  minBaths: null,
  minSqft: null,
  maxSqft: null,
  propertyTypes: [],
  reason: null,
  city: "",
  amenities: [],
};
