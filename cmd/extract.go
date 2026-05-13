package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"bank-transactions-ocr/internal/parser"
	_ "bank-transactions-ocr/internal/parser/parsers/bac"
	"bank-transactions-ocr/internal/pdfextract"

	"github.com/spf13/cobra"
)

var extractCmd = &cobra.Command{
	Use:   "extract",
	Short: "Extract transactions from PDF files",
	Long:  `Extract transaction information from PDF files in the input directory and save to the output directory.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		inputDir := config.InputDir
		outputDir := config.OutputDir
		verbose := config.Verbose

		if verbose {
			fmt.Printf("Extracting transactions from PDFs in: %s\n", inputDir)
			fmt.Printf("Registered parsers: %v\n", parser.List())
		}

		tempDir, err := os.MkdirTemp("", "pdf-extract-*")
		if err != nil {
			return fmt.Errorf("failed to create temporary directory: %v", err)
		}
		defer os.RemoveAll(tempDir)

		if err := pdfextract.ProcessPDFs(inputDir, tempDir, verbose); err != nil {
			return fmt.Errorf("failed to process PDFs: %v", err)
		}

		if err := os.MkdirAll(outputDir, 0755); err != nil {
			return fmt.Errorf("failed to create output directory: %v", err)
		}

		files, err := os.ReadDir(tempDir)
		if err != nil {
			return fmt.Errorf("failed to read temporary directory: %v", err)
		}

		for _, file := range files {
			if filepath.Ext(file.Name()) != ".txt" {
				continue
			}

			baseName := strings.TrimSuffix(file.Name(), ".txt")
			inputPath := filepath.Join(tempDir, file.Name())

			text, err := os.ReadFile(inputPath)
			if err != nil {
				return fmt.Errorf("failed to read %s: %v", file.Name(), err)
			}

			p, err := parser.Detect(string(text))
			if err != nil {
				return fmt.Errorf("%s: %v", baseName, err)
			}

			if verbose {
				fmt.Printf("Detected parser %q for %s\n", p.Name(), baseName)
			}

			transactions, err := p.Parse(string(text))
			if err != nil {
				return fmt.Errorf("failed to parse %s: %v", baseName, err)
			}

			outputPath := filepath.Join(outputDir, baseName+".transactions")
			if err := parser.WriteTransactions(outputPath, transactions); err != nil {
				return fmt.Errorf("failed to write output for %s: %v", baseName, err)
			}

			fmt.Printf("%s: %d transactions extracted\n", baseName, len(transactions))
		}

		return nil
	},
}

func init() {
	rootCmd.AddCommand(extractCmd)
}
