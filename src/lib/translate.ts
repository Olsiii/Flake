import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "@/lib/anthropic";

const MODEL = "claude-sonnet-5";

const TRANSLATE_TEXT_TOOL: Anthropic.Tool = {
  name: "provide_translation",
  description: "Provide the Albanian translation of the given text.",
  input_schema: {
    type: "object",
    properties: {
      translation: { type: "string", description: "The Albanian translation." },
    },
    required: ["translation"],
  },
};

/** Translates English real-estate copy to Albanian via Claude. Returns null
 * (never throws) on any failure — a listing/neighborhood write must not
 * fail just because translation is unavailable; callers store null and
 * components fall back to the English original (see src/lib/localize.ts). */
export async function translateToAlbanian(text: string): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      tools: [TRANSLATE_TEXT_TOOL],
      tool_choice: { type: "tool", name: "provide_translation" },
      system:
        "Translate the given English real-estate listing copy into natural, fluent Albanian (standard Albanian as used in Kosovo). Preserve line breaks, numbers, and proper nouns (place names, street names).",
      messages: [{ role: "user", content: trimmed }],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    const translation = (
      toolUse?.input as { translation?: string } | undefined
    )?.translation;
    if (!translation?.trim()) {
      console.error(
        "Albanian translation returned no text",
        JSON.stringify(response),
      );
    }
    return translation?.trim() || null;
  } catch (err) {
    console.error("Albanian translation failed", err);
    return null;
  }
}

const TRANSLATE_LIST_TOOL: Anthropic.Tool = {
  name: "provide_translations",
  description:
    "Provide the Albanian translation for each item, in the same order.",
  input_schema: {
    type: "object",
    properties: {
      translations: {
        type: "array",
        items: { type: "string" },
        description:
          "Translated items — exactly one per input item, same order.",
      },
    },
    required: ["translations"],
  },
};

/** Same contract as translateToAlbanian, for a list of short items (e.g.
 * neighborhood highlights). Returns null on failure or on a
 * malformed/mismatched response rather than risking a silently-wrong
 * item-to-translation mapping. */
export async function translateListToAlbanian(
  items: string[],
): Promise<string[] | null> {
  const trimmedItems = items.map((item) => item.trim()).filter(Boolean);
  if (trimmedItems.length === 0) return null;
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      tools: [TRANSLATE_LIST_TOOL],
      tool_choice: { type: "tool", name: "provide_translations" },
      system:
        "Translate each English real-estate insight/highlight into natural, fluent Albanian (standard Albanian as used in Kosovo). Return exactly one translation per input item, in the same order.",
      messages: [{ role: "user", content: JSON.stringify(trimmedItems) }],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    const translations = (
      toolUse?.input as { translations?: unknown } | undefined
    )?.translations;
    if (
      !Array.isArray(translations) ||
      translations.length !== trimmedItems.length
    ) {
      return null;
    }
    return translations.map((t) => String(t));
  } catch (err) {
    console.error("Albanian list translation failed", err);
    return null;
  }
}
