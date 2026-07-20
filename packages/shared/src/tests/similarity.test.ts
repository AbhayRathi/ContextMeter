import { describe, it, expect } from "vitest";
import { tokenize, jaccardSimilarity, textSimilarity } from "../similarity.js";

describe("tokenize", () => {
  it("lowercases, strips punctuation, and drops stopwords", () => {
    expect(tokenize("The Quick, Brown Fox!")).toEqual(["quick", "brown", "fox"]);
  });

  it("drops single-character tokens", () => {
    expect(tokenize("a b cd")).toEqual(["cd"]);
  });

  it("returns an empty array for an all-stopword string", () => {
    expect(tokenize("the a an and or")).toEqual([]);
  });
});

describe("jaccardSimilarity", () => {
  it("returns 1 for identical token sets", () => {
    expect(jaccardSimilarity(["a", "b"], ["a", "b"])).toBe(1);
  });

  it("returns 0 for disjoint token sets", () => {
    expect(jaccardSimilarity(["a", "b"], ["c", "d"])).toBe(0);
  });

  it("returns 0 when either input is empty", () => {
    expect(jaccardSimilarity([], ["a"])).toBe(0);
    expect(jaccardSimilarity(["a"], [])).toBe(0);
  });

  it("computes partial overlap correctly", () => {
    // intersection {b,c} = 2, union {a,b,c,d} = 4 -> 0.5
    expect(jaccardSimilarity(["a", "b", "c"], ["b", "c", "d"])).toBe(0.5);
  });
});

describe("textSimilarity", () => {
  it("scores near-duplicate sentences highly", () => {
    const a = "Customers may request a refund within 30 days of purchase.";
    const b = "Customers can request a refund within 30 days of the purchase date.";
    expect(textSimilarity(a, b)).toBeGreaterThan(0.4);
  });

  it("scores unrelated sentences near zero", () => {
    const a = "Customers may request a refund within 30 days of purchase.";
    const b = "Earn 3x points on travel purchases with our rewards card this summer.";
    expect(textSimilarity(a, b)).toBeLessThan(0.15);
  });
});
