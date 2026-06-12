import { describe, it, expect } from "vitest";
import { parseTerms } from "../../src/domain/parser.js";

describe("parseTerms", () => {
  describe("separators", () => {
    it("splits bare words on spaces", () => {
      expect(parseTerms("Hello world")).toEqual(["Hello", "world"]);
    });

    it("splits bare words on commas", () => {
      expect(parseTerms("Hello,world")).toEqual(["Hello", "world"]);
    });

    it("treats spaces and commas as equivalent separators", () => {
      expect(parseTerms("a b,c")).toEqual(["a", "b", "c"]);
    });

    it("collapses runs of mixed separators", () => {
      expect(parseTerms("Hello,,  world ,beer")).toEqual([
        "Hello",
        "world",
        "beer",
      ]);
    });

    it("ignores leading and trailing separators", () => {
      expect(parseTerms("  , beer , ")).toEqual(["beer"]);
    });
  });

  describe("quoted phrases", () => {
    it("keeps a double quoted phrase as one term", () => {
      expect(parseTerms('"Boston Red Sox"')).toEqual(["Boston Red Sox"]);
    });

    it("keeps a single quoted phrase as one term", () => {
      expect(parseTerms("'Pepperoni Pizza'")).toEqual(["Pepperoni Pizza"]);
    });

    it("preserves a comma inside a quoted phrase", () => {
      expect(parseTerms('"Boston, Red Sox"')).toEqual(["Boston, Red Sox"]);
    });

    it("parses the spec example into six terms", () => {
      const input =
        "Hello world \"Boston Red Sox\", 'Pepperoni Pizza', 'Cheese Pizza', beer";
      expect(parseTerms(input)).toEqual([
        "Hello",
        "world",
        "Boston Red Sox",
        "Pepperoni Pizza",
        "Cheese Pizza",
        "beer",
      ]);
    });

    it("trims whitespace surrounding a quoted phrase", () => {
      expect(parseTerms('"  Boston Red Sox  "')).toEqual(["Boston Red Sox"]);
    });

    it("handles an unterminated quote gracefully", () => {
      expect(parseTerms('"Boston Red Sox')).toEqual(["Boston Red Sox"]);
    });

    it("drops empty quoted strings", () => {
      expect(parseTerms('"" beer')).toEqual(["beer"]);
    });

    it("keeps an apostrophe inside a double quoted phrase", () => {
      expect(parseTerms("\"it's classified\"")).toEqual(["it's classified"]);
    });

    it("keeps a double quote inside a single quoted phrase", () => {
      expect(parseTerms("'the \"red\" file'")).toEqual(['the "red" file']);
    });

    it("normalizes curly quotes to straight and groups phrases", () => {
      const input = "“Boston Red Sox”, ‘Pepperoni Pizza’, beer";
      expect(parseTerms(input)).toEqual([
        "Boston Red Sox",
        "Pepperoni Pizza",
        "beer",
      ]);
    });
  });

  describe("combined messy input", () => {
    it("parses a mix of double commas, extra spaces, and quotes", () => {
      const input =
        `Hello  world ,, "Boston Red Sox" ,'Pepperoni Pizza',,  'Cheese Pizza' , beer`;
      expect(parseTerms(input)).toEqual([
        "Hello",
        "world",
        "Boston Red Sox",
        "Pepperoni Pizza",
        "Cheese Pizza",
        "beer",
      ]);
    });

    it("keeps separator commas out while keeping a quoted comma in", () => {
      expect(parseTerms('beer, "Boston, Red Sox", wine')).toEqual([
        "beer",
        "Boston, Red Sox",
        "wine",
      ]);
    });

    it("treats newlines and tabs as separators like spaces", () => {
      expect(parseTerms("beer\n'Cheese Pizza'\twine")).toEqual([
        "beer",
        "Cheese Pizza",
        "wine",
      ]);
    });
  });

  describe("empty and whitespace input", () => {
    it("returns an empty array for an empty string", () => {
      expect(parseTerms("")).toEqual([]);
    });

    it("returns an empty array for separators only", () => {
      expect(parseTerms("  , ,, ")).toEqual([]);
    });
  });

  describe("duplicates", () => {
    it("removes exact duplicate terms, keeping first order", () => {
      expect(parseTerms("beer, beer")).toEqual(["beer"]);
    });

    it("does not treat different case as duplicates", () => {
      expect(parseTerms("Beer beer")).toEqual(["Beer", "beer"]);
    });

    it("deduplicates quoted phrases too", () => {
      expect(parseTerms('"Cheese Pizza" "Cheese Pizza"')).toEqual([
        "Cheese Pizza",
      ]);
    });
  });
});
