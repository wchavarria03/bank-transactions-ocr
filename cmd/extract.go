// Package cmd provides the CLI for the transactions processor.
package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"bank-transactions-ocr/internal/pdfextract"
	"bank-transactions-ocr/internal/transactionsextractor"

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
			fmt.Printf("Extracting transaction data from PDFs in directory: %s\n", inputDir)
		}

		// Create a temporary directory for intermediate files
		tempDir, err := os.MkdirTemp("", "pdf-extract-*")
		if err != nil {
			return fmt.Errorf("failed to create temporary directory: %v", err)
		}
		defer os.RemoveAll(tempDir)

		// First extract text from PDFs to temporary directory
		if err := pdfextract.ProcessPDFs(inputDir, tempDir, verbose); err != nil {
			return fmt.Errorf("failed to process PDFs: %v", err)
		}

		// Create output directory if it doesn't exist
		if err := os.MkdirAll(outputDir, 0755); err != nil {
			return fmt.Errorf("failed to create output directory: %v", err)
		}

		// Process each extracted text file to get transaction information
		files, err := os.ReadDir(tempDir)
		if err != nil {
			return fmt.Errorf("failed to read temporary directory: %v", err)
		}

		for _, file := range files {
			if filepath.Ext(file.Name()) == ".txt" {
				// Get the original PDF filename without the .txt extension
				baseName := file.Name()[:len(file.Name())-4]

				inputPath := filepath.Join(tempDir, file.Name())
				outputPath := filepath.Join(outputDir, baseName+".transactions")

				if verbose {
					fmt.Printf("Extracting transactions from: %s\n", baseName)
				}

				if err := transactionsextractor.ExtractTransactions(inputPath, outputPath); err != nil {
					return fmt.Errorf("failed to extract transactions from %s: %v", baseName, err)
				}

				if verbose {
					fmt.Printf("Successfully extracted transactions from %s\n", baseName)
				}
			}
		}

		fmt.Println("Successfully extracted transaction information from PDFs")
		return nil
	},
}

func init() {
	rootCmd.AddCommand(extractCmd)
}
