import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "@/lib/anthropic";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isGloballyRateLimited, isRateLimited } from "@/lib/rate-limit";
import {
  PROPERTY_TYPES,
  type AiDetectableFilterKey,
  type ListingFilters,
  type PropertyType,
} from "@/types/listing";

const MODEL = "claude-sonnet-5";

type ExtractedFilters = Partial<
  Pick<
    ListingFilters,
    | "minPrice"
    | "maxPrice"
    | "minBeds"
    | "minBaths"
    | "propertyTypes"
    | "minSqft"
    | "maxSqft"
    | "minYearBuilt"
    | "maxYearBuilt"
    | "hoaAllowed"
    | "garageStorage"
    | "city"
    | "keyword"
  >
>;

interface AiSearchResponse {
  filters: ExtractedFilters;
  detectedKeys: AiDetectableFilterKey[];
  usedFallback: boolean;
}

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_search_filters",
  description:
    "Extract structured real-estate search filters from a free-text query.",
  input_schema: {
    type: "object",
    properties: {
      minPrice: {
        type: ["number", "null"],
        description: "Minimum price in EUR, or null if not mentioned.",
      },
      maxPrice: {
        type: ["number", "null"],
        description: "Maximum price in EUR, or null if not mentioned.",
      },
      minBeds: {
        type: ["integer", "null"],
        description: "Minimum number of bedrooms, or null if not mentioned.",
      },
      minBaths: {
        type: ["number", "null"],
        description: "Minimum number of bathrooms, or null if not mentioned.",
      },
      propertyTypes: {
        type: "array",
        items: { type: "string", enum: [...PROPERTY_TYPES] },
        description:
          "Property types implied by the query, mapped onto this enum (e.g. 'home'/'house' -> house, 'flat'/'condo' -> apartment, 'commercial space' -> office). Empty array if none mentioned.",
      },
      minSqft: {
        type: ["integer", "null"],
        description: "Minimum size in square meters, or null if not mentioned.",
      },
      maxSqft: {
        type: ["integer", "null"],
        description: "Maximum size in square meters, or null if not mentioned.",
      },
      minYearBuilt: {
        type: ["integer", "null"],
        description:
          "Earliest construction year implied by the query (e.g. 'built after 2015' -> 2015, 'new construction'/'newly built' -> current year minus 2). Null if not mentioned.",
      },
      maxYearBuilt: {
        type: ["integer", "null"],
        description:
          "Latest construction year implied by the query (e.g. 'built before 1990' -> 1990). Null if not mentioned.",
      },
      excludeBuildingFee: {
        type: "boolean",
        description:
          "True only if the user explicitly wants to exclude listings with a building/HOA/maintenance fee (e.g. 'no HOA', 'no building fee'). False otherwise — this is NOT the default state, only an explicit exclusion.",
      },
      garageStorage: {
        type: "boolean",
        description:
          "True only if the user explicitly asks for a storage room in the garage. False otherwise.",
      },
      city: {
        type: ["string", "null"],
        description:
          "A specific city or named area (city, neighborhood, or district) mentioned in the query. Null if no specific place is given, e.g. a vague area like 'downtown' with nothing else to identify it.",
      },
    },
    required: [
      "minPrice",
      "maxPrice",
      "minBeds",
      "minBaths",
      "propertyTypes",
      "minSqft",
      "maxSqft",
      "minYearBuilt",
      "maxYearBuilt",
      "excludeBuildingFee",
      "garageStorage",
      "city",
    ],
  },
};

export async function POST(request: Request) {
  // Global backstop matters most here: each request costs an Anthropic
  // API call, so a header-rotating attacker bypassing the per-IP check
  // alone (see rate-limit.ts's clientIp() doc comment) translates directly
  // into unbounded spend.
  if (
    isRateLimited(request, "ai-search", 20, 5 * 60 * 1000) ||
    isGloballyRateLimited("ai-search", 200, 5 * 60 * 1000)
  ) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    query?: string;
  } | null;
  const query = body?.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const extracted = await extractFiltersWithAi(query);
  return NextResponse.json(extracted ?? fallbackResponse(query));
}

function fallbackResponse(query: string): AiSearchResponse {
  return {
    filters: { keyword: query },
    detectedKeys: ["keyword"],
    usedFallback: true,
  };
}

/** Case-insensitive match against neighborhoods.name — returns the DB's
 * canonical spelling so the keyword search and "detected filters" chip use
 * consistent casing/diacritics, not whatever the model produced. */
async function matchNeighborhoodName(place: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("name")
    .ilike("name", place)
    .maybeSingle();
  if (error || !data) return null;
  return data.name as string;
}

async function extractFiltersWithAi(
  query: string,
): Promise<AiSearchResponse | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: "extract_search_filters" },
      system:
        `You extract structured real-estate search filters from a user's free-text query. Only set fields the query actually implies; leave everything else null, false, or empty. Today's year is ${new Date().getFullYear()}, for resolving relative dates like "new construction" or "built in the last 5 years".`,
      messages: [{ role: "user", content: query }],
    });

    if (response.stop_reason === "refusal") return null;

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    if (!toolUse) return null;

    const input = toolUse.input as Record<string, unknown>;
    const num = (v: unknown): number | null =>
      typeof v === "number" && Number.isFinite(v) ? v : null;

    const filters: ExtractedFilters = {};
    const detectedKeys: AiDetectableFilterKey[] = [];

    let minPrice = num(input.minPrice);
    let maxPrice = num(input.maxPrice);
    if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
      [minPrice, maxPrice] = [maxPrice, minPrice];
    }
    if (minPrice != null) {
      filters.minPrice = minPrice;
      detectedKeys.push("minPrice");
    }
    if (maxPrice != null) {
      filters.maxPrice = maxPrice;
      detectedKeys.push("maxPrice");
    }

    const minBeds = num(input.minBeds);
    if (minBeds != null) {
      filters.minBeds = minBeds;
      detectedKeys.push("minBeds");
    }

    const minBaths = num(input.minBaths);
    if (minBaths != null) {
      filters.minBaths = minBaths;
      detectedKeys.push("minBaths");
    }

    let minSqft = num(input.minSqft);
    let maxSqft = num(input.maxSqft);
    if (minSqft != null && maxSqft != null && minSqft > maxSqft) {
      [minSqft, maxSqft] = [maxSqft, minSqft];
    }
    if (minSqft != null) {
      filters.minSqft = minSqft;
      detectedKeys.push("minSqft");
    }
    if (maxSqft != null) {
      filters.maxSqft = maxSqft;
      detectedKeys.push("maxSqft");
    }

    let minYearBuilt = num(input.minYearBuilt);
    let maxYearBuilt = num(input.maxYearBuilt);
    if (
      minYearBuilt != null &&
      maxYearBuilt != null &&
      minYearBuilt > maxYearBuilt
    ) {
      [minYearBuilt, maxYearBuilt] = [maxYearBuilt, minYearBuilt];
    }
    if (minYearBuilt != null) {
      filters.minYearBuilt = minYearBuilt;
      detectedKeys.push("minYearBuilt");
    }
    if (maxYearBuilt != null) {
      filters.maxYearBuilt = maxYearBuilt;
      detectedKeys.push("maxYearBuilt");
    }

    if (input.excludeBuildingFee === true) {
      filters.hoaAllowed = false;
      detectedKeys.push("hoaAllowed");
    }

    if (input.garageStorage === true) {
      filters.garageStorage = true;
      detectedKeys.push("garageStorage");
    }

    const propertyTypes = Array.isArray(input.propertyTypes)
      ? input.propertyTypes.filter((t): t is PropertyType =>
          (PROPERTY_TYPES as readonly string[]).includes(t as string),
        )
      : [];
    if (propertyTypes.length > 0) {
      filters.propertyTypes = propertyTypes;
      detectedKeys.push("propertyTypes");
    }

    if (typeof input.city === "string" && input.city.trim()) {
      // The model has no ground truth on which place names are cities vs.
      // neighborhoods, and often extracts a neighborhood (e.g. "Bregu i
      // Diellit") into this field. listings.city only ever holds the real
      // city (Prishtina/Prizren/Pejë/...), so filtering by the raw value
      // here would silently zero out every result. A neighborhood name
      // resolves to a keyword search instead — listing titles embed the
      // neighborhood ("... apartment in Bregu i Diellit"), so a title/
      // description match finds the right listings without needing a
      // dedicated neighborhood filter.
      const rawPlace = input.city.trim();
      const neighborhoodMatch = await matchNeighborhoodName(rawPlace);
      if (neighborhoodMatch) {
        filters.keyword = neighborhoodMatch;
        detectedKeys.push("keyword");
      } else {
        filters.city = rawPlace;
        detectedKeys.push("city");
      }
    }

    if (detectedKeys.length === 0) return null;

    return { filters, detectedKeys, usedFallback: false };
  } catch (err) {
    console.error("AI search extraction failed", err);
    return null;
  }
}
