BINARY   := bank-transactions-ocr
INPUT    := pdfs
OUTPUT   := output

.DEFAULT_GOAL := help

.PHONY: help build clean run extract lint vuln tidy

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

build: ## Build the binary
	go build -o $(BINARY) .

clean: ## Remove binary and output directory
	rm -f $(BINARY)
	rm -rf $(OUTPUT)

tidy: ## Tidy go modules
	go mod tidy

lint: ## Run golangci-lint
	golangci-lint run ./...

vuln: ## Scan for vulnerabilities
	go run golang.org/x/vuln/cmd/govulncheck@latest ./...

extract: build ## Build and run extract against pdfs/ directory
	./$(BINARY) -v -i $(INPUT) -o $(OUTPUT) extract

extract-dry: build ## Build and run extract in dry-run mode (no DB writes)
	./$(BINARY) -v -i $(INPUT) -o $(OUTPUT) --dry-run extract

verify: ## Run parser against testdata samples (no PDF needed)
	go run cmd/verify.go

dump: build ## Dump raw extracted text from PDFs (for debugging parsers)
	./$(BINARY) -v -i $(INPUT) -o $(OUTPUT) dump
