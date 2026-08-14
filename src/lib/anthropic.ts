import Anthropic from "@anthropic-ai/sdk";

/**
 * Null when ANTHROPIC_API_KEY isn't set, so callers can fall back to plain
 * keyword search — the AI search box should degrade gracefully, not 500,
 * when the key is missing.
 */
export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return apiKey ? new Anthropic({ apiKey }) : null;
}
