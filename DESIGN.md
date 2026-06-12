# Design Doc, Document Redaction Service

A service that redacts keywords and phrases from text (Part 1) and unredacts using a key (Part 2).

## Goals

1. Redact: remove given keywords and phrases from a document and replace each with `XXXX`.
2. Unredact: restore the original document from the redacted text plus a key.

## Architecture

Clean separation between core logic and delivery:

```
src/
  domain/      pure logic, no I/O (parser, redact, unredact, keyCodec)
  api/         Express layer only (routes, validation, error handling)
  config/      limits and constants
tests/
  unit/        domain tests
  integration/ API tests (supertest)
```

The domain is framework agnostic, so it is fully unit testable and could later become a CLI, library, or serverless function. Express is a thin edge that validates input and calls the domain.

Planned stack: TypeScript (strict), Node.js, Express. Testing with Vitest, developed test first (TDD).

## Part 1, Redaction

### Inputs

1. Terms string: keywords and phrases separated by spaces or commas. Phrases are wrapped in single or double quotes. Spaces and commas are equivalent separators; only quotes group words.
2. Document text.

### Output

Redacted document with each matched term replaced by `XXXX`.

### Steps

1. Parse the terms string into a list of literal terms.
   - Runs of spaces and commas are one separator.
   - Quoted text stays as a single phrase (spaces preserved).
2. Match terms in the document and replace with `XXXX`.

### Assumptions (documented decisions)

- Matching is case insensitive (catches `Beer` and `BEER`).
- Matching respects word boundaries, so `beer` does not hit `beersheba` (avoids over redaction).
- Longest term wins on overlap, so phrases are not partially redacted.

## Part 2, Unredaction

### Key design decision

`XXXX` is fixed width, so the original length and content are lost from the document. Therefore the
**key must carry the recovery data**. Redaction produces two outputs:

- redacted text (with `XXXX`)
- a key that encodes, for each redaction, its position in the redacted text and the original text.

Unredact takes (key, redacted text), decodes the key, and reinserts the originals at their offsets.
The key is self contained, so unredaction needs no server side state (storage is out of scope here).

### Key format

The redaction map is encrypted with AES-256-GCM behind a small `KeyCodec` interface.

- Confidentiality: the redacted document is unreadable without the key.
- Integrity: GCM detects a tampered key or tampered redacted text.
- The interface allows swapping to a simpler base64 encoding if true crypto is not wanted (the spec states the key does not need to be cryptographic).

### Inputs and output

- Inputs: key string, redacted document text.
- Output: original document text. Invalid or mismatched keys are rejected with a clear error.
