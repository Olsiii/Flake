import { readFile } from "node:fs/promises";
import { join } from "node:path";

let logoDataUri: Promise<string> | null = null;

/** Flake's square icon mark (Bone flame/skyline on Deep Ember — the same
 * source as the favicon), as a base64 data URI for use in `next/og`
 * ImageResponse `<img src>` — Satori can't load local files by path, only
 * remote URLs or embedded data. Deliberately not `no-bg-flake.png`: that
 * file bakes in a black "FLAKE" wordmark that's illegible on a dark OG
 * background and isn't square, so it distorts at a fixed size — this
 * icon is a self-contained square badge with its own background, no
 * legibility or aspect-ratio issues. Cached across invocations since the
 * asset never changes (see Next's "Predictable values" caching guidance
 * for `opengraph-image`). */
export function getLogoDataUri(): Promise<string> {
  if (!logoDataUri) {
    logoDataUri = readFile(join(process.cwd(), "src/app/icon.png")).then(
      (buf) => `data:image/png;base64,${buf.toString("base64")}`,
    );
  }
  return logoDataUri;
}
