package bac

import (
	"fmt"
	"strings"
	"time"

	"bank-transactions-ocr/internal/parser"
)

func init() {
	parser.Register(&statementParser{})
}

type statementParser struct{}

func (p *statementParser) Name() string { return "bac/statement" }

// Detect identifies BAC statements by the presence of "Balance" as a standalone
// line combined with "Resumen de", which are markers unique to this format.
func (p *statementParser) Detect(text string) bool {
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

func (p *statementParser) Parse(text string) ([]parser.Transaction, error) {
	lines := strings.Split(text, "\n")

	inTable := false
	fields := make([]string, 0, 7)
	var transactions []parser.Transaction

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

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
			tx, err := parseFields(fields)
			if err == nil {
				transactions = append(transactions, tx)
			}
			fields = fields[:0]
		}
	}

	if len(transactions) == 0 {
		return nil, fmt.Errorf("bac/statement: no transactions found — verify the PDF matches this format")
	}

	return transactions, nil
}

// parseFields converts the 7 raw text fields into a Transaction.
// BAC statement column order: Fecha | Referencia | Código | Descripción | Débito | Crédito | Balance
func parseFields(fields []string) (parser.Transaction, error) {
	date, err := parseDate(fields[0])
	if err != nil {
		return parser.Transaction{}, fmt.Errorf("invalid date %q: %w", fields[0], err)
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
		Currency:    "CRC",
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
