import { describe, expect, it } from "vitest";
import { ValidationError, validatePropertyPayload } from "./properties";

const validBase = {
  title: "Modern apartment",
  listingType: "for-sale" as const,
  price: 150000,
  address: "Rr. Nena Tereze 12",
  city: "Prishtina",
  state: "Prishtina",
  media: [{ url: "https://example.com/a.jpg", isVideo: false }],
};

describe("validatePropertyPayload", () => {
  it("accepts a minimal valid payload", () => {
    expect(() => validatePropertyPayload(validBase)).not.toThrow();
  });

  it("rejects a non-object body", () => {
    expect(() => validatePropertyPayload(null)).toThrow(ValidationError);
    expect(() => validatePropertyPayload("nope")).toThrow(ValidationError);
    expect(() => validatePropertyPayload(undefined)).toThrow(ValidationError);
  });

  it("requires a non-blank title", () => {
    expect(() =>
      validatePropertyPayload({ ...validBase, title: "" }),
    ).toThrow(/title/i);
    expect(() =>
      validatePropertyPayload({ ...validBase, title: "   " }),
    ).toThrow(/title/i);
  });

  it("requires listingType to be for-sale or for-rent", () => {
    expect(() =>
      validatePropertyPayload({ ...validBase, listingType: "auction" }),
    ).toThrow(/listing type/i);
  });

  it("requires a positive numeric price", () => {
    expect(() =>
      validatePropertyPayload({ ...validBase, price: 0 }),
    ).toThrow(/price/i);
    expect(() =>
      validatePropertyPayload({ ...validBase, price: -100 }),
    ).toThrow(/price/i);
    expect(() =>
      validatePropertyPayload({ ...validBase, price: "150000" }),
    ).toThrow(/price/i);
  });

  it("requires address, city, and state", () => {
    expect(() =>
      validatePropertyPayload({ ...validBase, address: "" }),
    ).toThrow(/address/i);
    expect(() =>
      validatePropertyPayload({ ...validBase, city: "" }),
    ).toThrow(/city/i);
    expect(() =>
      validatePropertyPayload({ ...validBase, state: "" }),
    ).toThrow(/state/i);
  });

  it("requires at least one media item", () => {
    expect(() =>
      validatePropertyPayload({ ...validBase, media: [] }),
    ).toThrow(/photo or video/i);
    expect(() =>
      validatePropertyPayload({ ...validBase, media: undefined }),
    ).toThrow(/photo or video/i);
  });

  it("rejects an invalid propertyType but allows an omitted one", () => {
    expect(() =>
      validatePropertyPayload({ ...validBase, propertyType: "spaceship" }),
    ).toThrow(/property type/i);
    expect(() =>
      validatePropertyPayload({ ...validBase, propertyType: "house" }),
    ).not.toThrow();
    expect(() =>
      validatePropertyPayload({ ...validBase, propertyType: undefined }),
    ).not.toThrow();
  });
});
