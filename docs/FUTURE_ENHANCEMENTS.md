# Future Enhancements

## Project Rename

The current name `bank-transactions-ocr` is misleading. OCR (Optical Character Recognition) converts images of text into machine-readable text, which is not what this tool does. This project performs **native text extraction from digital PDFs** — a fundamentally different operation that reads text directly from the PDF's internal structure.

A more accurate name would be something like `bank-statement-parser` or `pdf-transaction-extractor`.

### Scope of the rename

The following would need to be updated:

- Repository/folder name
- `go.mod` — module declaration (`module bank-transactions-ocr`)
- All internal import paths (`import "bank-transactions-ocr/internal/..."`)
- Binary output name in `Dockerfile` and `docker-compose.yml`
- `README.md` title and references
