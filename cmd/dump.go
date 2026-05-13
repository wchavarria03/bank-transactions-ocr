package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"bank-transactions-ocr/internal/pdfextract"

	"github.com/spf13/cobra"
)

var dumpCmd = &cobra.Command{
	Use:   "dump",
	Short: "Dump raw extracted text from PDFs (for debugging parsers)",
	Long:  `Extract raw text from PDFs and save to the output directory as .txt files, without any parsing.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		inputDir := config.InputDir
		outputDir := config.OutputDir

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

			if err := pdfextract.ExtractText(inputPath, outputPath, config.Verbose); err != nil {
				return fmt.Errorf("failed to extract %s: %v", file.Name(), err)
			}

			fmt.Printf("Dumped: %s → %s\n", file.Name(), outputPath)
		}

		return nil
	},
}

func init() {
	rootCmd.AddCommand(dumpCmd)
}
