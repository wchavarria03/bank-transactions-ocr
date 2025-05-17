# Transactions Processor

A command-line tool for extracting and processing transaction data from various document formats (currently supporting PDF) and converting them to structured CSV format.

## Features

- Extract transaction data from PDF documents
- Process and structure transaction information
- Convert extracted data to CSV format
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
   git clone https://github.com/yourusername/transactions-processor.git
   cd transactions-processor
   ```

2. Build the project:
   ```bash
   go build -o transactions-processor ./cmd
   ```

## Usage

The tool provides several commands for processing transaction documents:

### Extract Transaction Data

Extract transaction data from documents in the input directory:

```bash
./transactions-processor extract
```

### Convert to CSV

Convert extracted transaction data to CSV format:

```bash
./transactions-processor tocsv
```

### Process All

Run the complete workflow (extract and convert):

```bash
./transactions-processor all
```

### Global Flags

- `-v, --verbose`: Enable verbose output
- `-o, --output`: Output directory for processed files (default: "output")
- `-i, --input-dir`: Directory containing input documents (default: "input")

Example with custom directories:
```bash
./transactions-processor -i custom-input -o custom-output extract
```

## Project Structure

```
.
├── cmd/                    # Command-line interface
│   ├── main.go            # Entry point
│   ├── root.go            # Root command
│   ├── extract.go         # Extract command
│   ├── tocsv.go          # ToCSV command
│   └── all.go            # All-in-one command
├── internal/              # Private application code
│   ├── transactionextract/  # Transaction extraction logic
│   └── transactionwriter/   # CSV writing functionality
├── input/                 # Default input directory
├── output/               # Default output directory
├── go.mod
├── go.sum
└── README.md
```

## Development

### Adding New Features

1. Create a new branch for your feature
2. Make your changes
3. Add tests if applicable
4. Submit a pull request

### Running Tests

```bash
go test ./...
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 