import { describe, it, expect } from "vitest";
import { redact } from "../../src/domain/redact.js";

describe("redact", () => {
  describe("basic redaction", () => {
    it("replaces a single keyword with XXXX", () => {
      expect(redact("beer", "I like beer.").redactedText).toBe("I like XXXX.");
    });

    it("replaces a quoted phrase as one placeholder", () => {
      expect(
        redact('"Boston Red Sox"', "Go Boston Red Sox tonight").redactedText,
      ).toBe("Go XXXX tonight");
    });

    it("replaces multiple distinct terms", () => {
      expect(
        redact('beer, "Cheese Pizza"', "beer and Cheese Pizza").redactedText,
      ).toBe("XXXX and XXXX");
    });

    it("replaces every occurrence of a term", () => {
      expect(redact("beer", "beer beer beer").redactedText).toBe(
        "XXXX XXXX XXXX",
      );
    });

    it("places adjacent placeholders for adjacent matches", () => {
      expect(redact("beer wine", "beer wine").redactedText).toBe("XXXX XXXX");
    });

    it("redacts a term followed by punctuation", () => {
      expect(redact("beer", "a beer, please").redactedText).toBe(
        "a XXXX, please",
      );
    });
  });

  describe("matching rules", () => {
    it("matches case insensitively", () => {
      expect(redact("beer", "I drank BEER").redactedText).toBe("I drank XXXX");
    });

    it("respects word boundaries (does not redact substrings)", () => {
      expect(redact("beer", "welcome to beersheba").redactedText).toBe(
        "welcome to beersheba",
      );
    });

    it("prefers the longest match on overlap", () => {
      expect(
        redact('Cheese, "Cheese Pizza"', "I ate Cheese Pizza").redactedText,
      ).toBe("I ate XXXX");
    });

    it("collapses terms that differ only by case", () => {
      const { redactedText, map } = redact("beer, Beer", "I drank BEER");
      expect(redactedText).toBe("I drank XXXX");
      expect(map).toEqual([{ offset: 8, original: "BEER" }]);
    });
  });

  describe("no-op cases", () => {
    it("leaves the document unchanged when no term matches", () => {
      expect(redact("wine", "I like beer").redactedText).toBe("I like beer");
    });

    it("leaves the document unchanged for an empty terms string", () => {
      expect(redact("", "I like beer").redactedText).toBe("I like beer");
    });

    it("returns an empty string for an empty document", () => {
      expect(redact("beer", "").redactedText).toBe("");
    });
  });

  describe("redaction map", () => {
    it("records the offset and original text of each redaction", () => {
      const { map } = redact("beer", "I like beer.");
      expect(map).toEqual([{ offset: 7, original: "beer" }]);
    });

    it("preserves the original casing in the map", () => {
      const { map } = redact("beer", "I drank BEER");
      expect(map).toEqual([{ offset: 8, original: "BEER" }]);
    });

    it("records offsets relative to the redacted text", () => {
      const { map } = redact("beer wine", "beer and wine");
      expect(map).toEqual([
        { offset: 0, original: "beer" },
        { offset: 9, original: "wine" },
      ]);
    });

    it("returns an empty map when nothing is redacted", () => {
      expect(redact("wine", "I like beer").map).toEqual([]);
    });
  });

  describe("spec example", () => {
    it("redacts the assignment example end to end", () => {
      const terms = '"Boston Red Sox", beer';
      const doc = "I love the Boston Red Sox and a cold beer.";
      expect(redact(terms, doc).redactedText).toBe(
        "I love the XXXX and a cold XXXX.",
      );
    });
  });
});
