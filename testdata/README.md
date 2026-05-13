# Test Data

This directory contains sample extracted text files that mirror what the PDF reader produces.
Use these to verify parsers work correctly before running against real statements.

**Do not commit real bank statements here.** Use anonymized or fictional data only.

## Structure

```
testdata/
    bac/
        statement.txt    ← sample BAC statement text (anonymized)
```

## How to use

The sample `.txt` files represent the raw text extracted from a PDF page by page.
To test a parser manually, run:

```bash
make extract
```

Place the corresponding `.pdf` files in `pdfs/` (gitignored) and check that
`output/*.transactions` contains the expected results.

## Adding a new bank format

1. Extract text from a real statement using `make extract` with verbose mode
2. Copy the raw `.txt` from the temp directory before it is deleted, or add debug logging
3. Anonymize all personal data (names, account numbers, amounts)
4. Save the anonymized file here under `testdata/<bank>/<format>.txt`
5. Create a new parser at `internal/parser/parsers/<bank>/<format>.go`
