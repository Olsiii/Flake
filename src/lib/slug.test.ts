import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Prishtina Downtown")).toBe("prishtina-downtown");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("Pejë / Peć!!")).toBe("pej-pe");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Prizren--  ")).toBe("prizren");
  });
});
