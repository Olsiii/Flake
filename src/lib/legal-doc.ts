import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

const LEGAL_DIR = path.join(process.cwd(), "legal");

/** Renders a markdown file from the project-root /legal folder to HTML.
 * Null if the file hasn't been added yet — pages show a placeholder
 * instead of a broken/404 page in that case. */
export async function renderLegalDoc(filename: string): Promise<string | null> {
  try {
    const raw = await readFile(path.join(LEGAL_DIR, filename), "utf8");
    return await marked.parse(raw);
  } catch {
    return null;
  }
}
