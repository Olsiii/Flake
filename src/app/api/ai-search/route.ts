import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "@/lib/anthropic";
import { isRateLimited } from "@/lib/rate-limit";
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
        description: "Minimum price in USD, or null if not mentioned.",
      },
      maxPrice: {
        type: ["number", "null"],
        description: "Maximum price in USD, or null if not mentioned.",
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
          "Property types implied by the query, mapped onto this enum (e.g. 'house' -> single-family, 'condo' -> condo). Empty array if none mentioned.",
      },
      minSqft: {
        type: ["integer", "null"],
        description: "Minimum square footage, or null if not mentioned.",
      },
      maxSqft: {
        type: ["integer", "null"],
        description: "Maximum square footage, or null if not mentioned.",
      },
      city: {
        type: ["string", "null"],
        description:
          "A specific city named in the query. Null if no specific city is given, e.g. a vague area like 'downtown' with no city attached.",
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
      "city",
    ],
  },
};

export async function POST(request: Request) {
  if (isRateLimited(request, "ai-search", 20, 5 * 60 * 1000)) {
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
        "You extract structured real-estate search filters from a user's free-text query. Only set fields the query actually implies; leave everything else null or empty.",
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
      filters.city = input.city.trim();
      detectedKeys.push("city");
    }

    if (detectedKeys.length === 0) return null;

    return { filters, detectedKeys, usedFallback: false };
  } catch (err) {
    console.error("AI search extraction failed", err);
    return null;
  }
}
