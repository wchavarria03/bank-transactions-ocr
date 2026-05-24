package pdf

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func ProcessPDFs(inputDir, outputDir string, verbose bool) error {
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %v", err)
	}

	files, err := os.ReadDir(inputDir)
	if err != nil {
		return fmt.Errorf("failed to read input directory: %v", err)
	}

	for _, file := range files {
		if file.IsDir() || strings.ToLower(filepath.Ext(file.Name())) != ".pdf" {
			continue
		}

		inputPath := filepath.Join(inputDir, file.Name())
		outputPath := filepath.Join(outputDir, file.Name()+".txt")

		if err := ExtractText(inputPath, outputPath, verbose); err != nil {
			return fmt.Errorf("failed to process %s: %v", file.Name(), err)
		}

		if verbose {
			fmt.Printf("Extracted: %s\n", file.Name())
		}
	}

	return nil
}

func ExtractText(inputPath, outputPath string, verbose bool) error {
	reader, err := NewReader(inputPath)
	if err != nil {
		return fmt.Errorf("failed to create PDF reader: %v", err)
	}
	defer reader.Close()

	outFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("failed to create output file: %v", err)
	}
	defer outFile.Close()

	for i := 1; i <= reader.GetNumPages(); i++ {
		text, err := reader.ExtractTextFromPage(i)
		if err != nil {
			return fmt.Errorf("failed to extract text from page %d: %v", i, err)
		}
		if _, err := outFile.WriteString(text + "\n"); err != nil {
			return fmt.Errorf("failed to write text: %v", err)
		}
	}

	return nil
}
