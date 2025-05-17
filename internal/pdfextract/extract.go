package pdfextract

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"bank-transactions-ocr/internal/pdfshellreader"
)

// ProcessPDFs extracts text from all PDF files in the input directory
func ProcessPDFs(inputDir, outputDir string, verbose bool) error {
	if verbose {
		fmt.Printf("[DEBUG] ProcessPDFs called: inputDir=%s, outputDir=%s\n", inputDir, outputDir)
	}

	// Create output directory if it doesn't exist
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %v", err)
	}

	// Get list of files in input directory
	files, err := os.ReadDir(inputDir)
	if err != nil {
		return fmt.Errorf("failed to read input directory: %v", err)
	}

	// Process each PDF file
	for _, file := range files {
		if !file.IsDir() && strings.ToLower(filepath.Ext(file.Name())) == ".pdf" {
			if verbose {
				fmt.Printf("[DEBUG] Checking file: %s\n", file.Name())
			}

			inputPath := filepath.Join(inputDir, file.Name())
			outputPath := filepath.Join(outputDir, file.Name()+".txt")

			if err := ExtractText(inputPath, outputPath, verbose); err != nil {
				return fmt.Errorf("failed to process %s: %v", file.Name(), err)
			}

			if verbose {
				fmt.Printf("Successfully processed %s\n", file.Name())
			}
		}
	}

	if verbose {
		fmt.Println("[DEBUG] ProcessPDFs completed")
	}
	return nil
}

// ExtractText extracts text from a single PDF file
func ExtractText(inputPath, outputPath string, verbose bool) error {
	if verbose {
		fmt.Printf("[DEBUG] ExtractText called: inputPath=%s, outputPath=%s\n", inputPath, outputPath)
	}

	// Create PDF reader
	reader, err := pdfshellreader.NewReader(inputPath)
	if err != nil {
		return fmt.Errorf("failed to create PDF reader: %v", err)
	}
	defer reader.Close()

	// Get number of pages
	numPages, err := reader.GetNumPages()
	if err != nil {
		return fmt.Errorf("failed to get number of pages: %v", err)
	}

	// Create output file
	outFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("failed to create output file: %v", err)
	}
	defer outFile.Close()

	// Extract text from each page
	for i := 1; i <= numPages; i++ {
		text, err := reader.ExtractTextFromPage(i)
		if err != nil {
			return fmt.Errorf("failed to extract text from page %d: %v", i, err)
		}

		if _, err := outFile.WriteString(text + "\n"); err != nil {
			return fmt.Errorf("failed to write text to output file: %v", err)
		}
	}

	if verbose {
		fmt.Printf("[DEBUG] ExtractText completed for %s\n", inputPath)
	}
	return nil
}
