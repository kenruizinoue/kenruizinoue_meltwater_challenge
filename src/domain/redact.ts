import { parseTerms } from "./parser.js";

export const PLACEHOLDER = "XXXX";

export interface Redaction {
  offset: number;
  original: string;
}

export interface RedactionResult {
  redactedText: string;
  map: Redaction[];
}

/**
 * Replaces every matched keyword or phrase in the document with XXXX.
 *
 * Matching is case insensitive, respects word boundaries (so "beer" does not
 * match inside "beersheba"), and prefers the longest term on overlap. The
 * returned map records each removal so the document can later be restored.
 */
export function redact(termsString: string, document: string): RedactionResult {
  const terms = [
    ...new Set(parseTerms(termsString).map((term) => term.toLowerCase())),
  ].sort((a, b) => b.length - a.length);

  const lowerDoc = document.toLowerCase();
  const map: Redaction[] = [];
  let redactedText = "";
  let i = 0;

  while (i < document.length) {
    const length = matchTermAt(lowerDoc, i, terms);
    if (length === 0) {
      redactedText += document[i++];
      continue;
    }
    map.push({ offset: redactedText.length, original: document.slice(i, i + length) });
    redactedText += PLACEHOLDER;
    i += length;
  }

  return { redactedText, map };
}

/** Length of the longest whole-word term matching at `index`, or 0 if none. */
function matchTermAt(lowerDoc: string, index: number, terms: string[]): number {
  for (const term of terms) {
    const end = index + term.length;
    if (lowerDoc.startsWith(term, index) && isWholeWord(lowerDoc, index, end)) {
      return term.length;
    }
  }
  return 0;
}

/** A match is a whole word when its bordering characters are not word characters. */
function isWholeWord(text: string, start: number, end: number): boolean {
  return !isWordChar(text[start - 1] ?? "") && !isWordChar(text[end] ?? "");
}

function isWordChar(char: string): boolean {
  return /\w/.test(char);
}
