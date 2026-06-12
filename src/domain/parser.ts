/**
 * Parses a censor string into a list of literal terms.
 *
 * Rules:
 * - Separators: spaces and commas are equal; only quotes group words.
 * - Quotes: single or double, straight or curly; inner commas kept, outer spaces trimmed.
 * - Cleanup: empty terms dropped, exact duplicates removed (first kept).
 *
 * Why a char scan, not regex: one linear O(n) pass, so ReDoS impossible by
 * construction (no backtracking). Also lets us keep an unterminated quote as
 * one phrase, which a regex tokenizer would wrongly split.
 */
export function parseTerms(input: string): string[] {
  // Normalize curly quotes (common in pasted text) to straight ones first.
  const text = input.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  const terms: string[] = [];
  let i = 0;

  while (i < text.length) {
    if (isSeparator(text[i])) {
      i++;
      continue;
    }

    // A quoted phrase runs to its matching quote; a bare word runs to the next
    // separator or quote. Collect the slice, then advance past it.
    const quote = isQuote(text[i]) ? text[i] : null;
    const start = quote ? i + 1 : i;
    let end = start;
    while (end < text.length && !endsToken(text[end], quote)) {
      end++;
    }

    const term = text.slice(start, end).trim();
    if (term) {
      terms.push(term);
    }

    // Skip the closing quote when the phrase was actually terminated.
    i = quote && end < text.length ? end + 1 : end;
  }

  return [...new Set(terms)];
}

function endsToken(char: string, quote: string | null): boolean {
  return quote ? char === quote : isSeparator(char) || isQuote(char);
}

function isSeparator(char: string): boolean {
  return char === "," || /\s/.test(char);
}

function isQuote(char: string): boolean {
  return char === '"' || char === "'";
}
