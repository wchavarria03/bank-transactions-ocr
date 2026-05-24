# BAC Parser Test Data

Sample extracted text files that mirror what the PDF reader produces.
All data is anonymized — do not commit real bank statements.

## Files

- `total_account.txt` — sample BAC total-account statement (CRC and USD variants share the same format)

## Adding a new sample

1. Run `make dump` against a real PDF to get the raw extracted text.
2. Anonymize: replace real names, account numbers, and amounts with fictional data.
3. Save here and verify the parser handles it correctly via `make extract --dry-run`.
