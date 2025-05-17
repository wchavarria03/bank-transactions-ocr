package transactionsextractor

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

// ExtractTransactions extracts transaction information from a text file
func ExtractTransactions(inputPath string, outputPath string) error {
	// Open the input file
	file, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("failed to open input file: %v", err)
	}
	defer file.Close()

	// Create output file
	outFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("failed to create output file: %v", err)
	}
	defer outFile.Close()

	scanner := bufio.NewScanner(file)
	foundBalance := false
	foundAnyBalanceInfo := false
	fields := make([]string, 0)
	allTransactions := make([]string, 0)

	// Read the file line by line
	for scanner.Scan() {
		line := scanner.Text()

		if strings.TrimSpace(line) == "Balance" {
			foundBalance = true
			foundAnyBalanceInfo = true
			continue
		}

		// Collect up to 7 non-empty lines, but stop if line is empty or starts with '*'
		if foundBalance && len(fields) < 7 {
			trimmed := strings.TrimSpace(line)

			shouldStop := trimmed == "" || strings.HasPrefix(trimmed, "*") ||
				strings.HasPrefix(trimmed, "Resumen de")
			if shouldStop {
				fields = make([]string, 0)
				foundBalance = false
				continue
			}
			fields = append(fields, line)
		}

		// Save the transaction if valid
		if foundBalance && len(fields) == 7 {
			allTransactions = append(allTransactions, strings.Join(fields, "--"))
			fields = make([]string, 0)
		}
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("error reading file: %v", err)
	}

	// At the end of the loop, check if any "Balance" was found
	if !foundAnyBalanceInfo {
		return fmt.Errorf("no balance information found in file")
	}

	// Write all transactions to the output file
	writer := bufio.NewWriter(outFile)
	for _, transaction := range allTransactions {
		if _, err := writer.WriteString(transaction + "\n"); err != nil {
			return fmt.Errorf("error writing to output file: %v", err)
		}
	}

	if err := writer.Flush(); err != nil {
		return fmt.Errorf("error flushing output file: %v", err)
	}

	return nil
}
