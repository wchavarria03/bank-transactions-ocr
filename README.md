# Bank Transactions OCR

A command-line tool for extracting and processing transaction data from bank statements in PDF format.

## Features

- Extract transaction data from PDF bank statements
- Process and structure transaction information into a structured format
- Support for batch processing multiple documents
- Configurable input and output directories
- Verbose mode for detailed operation logging

## Installation

### Prerequisites

- Go 1.24 or later
- Git

### Building from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ledger-api.git
   cd ledger-api
   ```

2. Build the project:
   ```bash
   go build -o ledger-api
   ```

## Usage

The tool provides several commands for processing bank statement documents:

### Extract Transaction Data

Extract transaction data from PDF bank statements in the input directory:

```bash
# Basic usage with default directories
./ledger-api extract

# With verbose output
./ledger-api -v extract

# With custom input and output directories
./ledger-api -i /path/to/pdfs -o /path/to/output extract

# Full example with all options
./ledger-api -v -i /path/to/pdfs -o /path/to/output extract
```

### Process All

Run the complete workflow (extract transactions):

```bash
./ledger-api all
```

### Global Flags

- `-v, --verbose`: Enable verbose output
- `-o, --output`: Output directory for processed files (default: "output")
- `-i, --input-dir`: Directory containing input PDF documents (default: "pdfs")

Example with custom directories:
```bash
./ledger-api -i custom-input -o custom-output extract
```

## Project Structure

```
.
├── .devcontainer/
├── cmd/
│   ├── root.go
│   ├── extract.go
│   └── all.go
├── internal/
│   ├── pdfextract/
│   ├── transactionsextractor/
│   └── pdfshellreader/
├── pdfs/
├── output/
├── .dockerignore
├── .gitignore
├── .golangci.yml
├── Dockerfile
├── docker-compose.yml
├── go.mod
├── go.sum
├── main.go
└── README.md
```

## Development

### Running Tests

```bash
go test ./...
```

### Docker Support

The project includes Docker support for containerized execution:

```bash
# Build and run using Docker Compose
docker-compose up --build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 