package bac

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"bank-transactions-ocr/internal/parser"
)

func init() {
	parser.Register(&totalAccountParser{})
}

type totalAccountParser struct{}

func (p *totalAccountParser) Name() string { return "bac/total-account" }

// Detect identifies BAC statements by the presence of "Balance" as a standalone
// line combined with "Resumen de", which are markers unique to this format.
func (p *totalAccountParser) Detect(text string) bool {
	hasBalance := false
	hasResumen := false
	for _, line := range strings.Split(text, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "Balance" {
			hasBalance = true
		}
		if strings.HasPrefix(trimmed, "Resumen de") {
			hasResumen = true
		}
		if hasBalance && hasResumen {
			return true
		}
	}
	return false
}

func (p *totalAccountParser) Parse(text string) ([]parser.Transaction, error) {
	lines := strings.Split(text, "\n")

	currency := "CRC" // overridden by "Moneda" table header
	nextIsCurrency := false
	inTable := false
	fields := make([]string, 0, 7)
	var transactions []parser.Transaction

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// "Moneda" column header is immediately followed by the currency value (CRC/USD)
		if trimmed == "Moneda" {
			nextIsCurrency = true
			continue
		}
		if nextIsCurrency {
			currency = trimmed
			nextIsCurrency = false
			continue
		}

		if trimmed == "" {
			continue
		}

		// "Resumen de" marks the end of all transaction data
		if strings.HasPrefix(trimmed, "Resumen de") {
			break
		}

		// Standalone "Balance" is the column header — enter (or re-enter) table mode.
		// On page 2 this also discards any partial fields accumulated from page headers.
		if trimmed == "Balance" {
			inTable = true
			fields = fields[:0]
			continue
		}

		if !inTable {
			continue
		}

		fields = append(fields, trimmed)

		if len(fields) == 7 {
			tx, err := parseFields(fields, currency)
			if err == nil {
				transactions = append(transactions, tx)
			}
			fields = fields[:0]
		}
	}

	if len(transactions) == 0 {
		return nil, fmt.Errorf("bac/total-account: no transactions found — verify the PDF matches this format")
	}

	return transactions, nil
}

// parseFields converts the 7 raw text fields into a Transaction.
// BAC statement column order: Fecha | Referencia | Código | Descripción | Débito | Crédito | Balance
func parseFields(fields []string, currency string) (parser.Transaction, error) {
	date, err := parseDate(fields[0])
	if err != nil {
		return parser.Transaction{}, fmt.Errorf("invalid date %q: %w", fields[0], err)
	}

	if !isNumeric(fields[4]) || !isNumeric(fields[5]) {
		return parser.Transaction{}, fmt.Errorf("non-numeric amounts: debit=%q credit=%q", fields[4], fields[5])
	}

	debit := parseAmount(fields[4])
	credit := parseAmount(fields[5])

	// Represent debits as negative, credits as positive
	amount := credit
	if debit > 0 {
		amount = -debit
	}

	return parser.Transaction{
		Date:        date,
		Description: fields[3],
		Amount:      amount,
		Balance:     parseAmount(fields[6]),
		Currency:    currency,
	}, nil
}

func parseDate(s string) (time.Time, error) {
	formats := []string{"02/01/2006", "01/02/2006", "2006-01-02", "02-01-2006"}
	for _, f := range formats {
		if t, err := time.Parse(f, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("unrecognized date format")
}

func parseAmount(s string) float64 {
	s = strings.ReplaceAll(s, ",", "")
	s = strings.ReplaceAll(s, " ", "")
	var f float64
	fmt.Sscanf(s, "%f", &f)
	return f
}

func isNumeric(s string) bool {
	cleaned := strings.ReplaceAll(s, ",", "")
	_, err := strconv.ParseFloat(cleaned, 64)
	return err == nil
}
