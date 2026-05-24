package bac

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"bank-transactions-ocr/internal/parser"
)

// ibanPattern matches Costa Rican IBANs: CR + 20 digits (22 chars total).
var ibanPattern = regexp.MustCompile(`^CR\d{20}$`)

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

func (p *totalAccountParser) Parse(text string) (*parser.Statement, error) {
	lines := strings.Split(text, "\n")

	accountNumber := ""
	currency := "CRC" // overridden by "Moneda" table header
	nextIsCurrency := false
	inTable := false
	fields := make([]string, 0, 7)
	var transactions []parser.Transaction

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Extract account number from IBAN line (CR + 20 digits).
		// Only capture the first occurrence (page 1 header).
		if accountNumber == "" && ibanPattern.MatchString(trimmed) {
			accountNumber = trimmed
			continue
		}

		// "Moneda" column header is immediately followed by the currency value (CRC/USD).
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

		// "Resumen de" marks the end of all transaction data.
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

	return &parser.Statement{
		AccountNumber: accountNumber,
		ShortNumber:   bacShortNumber(accountNumber),
		Transactions:  transactions,
	}, nil
}

// bacShortNumber extracts the 9-digit short account number BAC uses inside
// transfer descriptions (e.g. "TEF A : 933175556").
// BAC IBANs are CR + 20 digits; the short number is digits [10:19].
// Returns empty string if the full number is not in the expected format.
func bacShortNumber(iban string) string {
	if !ibanPattern.MatchString(iban) {
		return ""
	}
	digits := iban[2:] // strip "CR"
	if len(digits) < 19 {
		return ""
	}
	return digits[10:19]
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
		Reference:   fields[1],
		Code:        fields[2],
		Type:        deriveType(fields[2], fields[3], amount),
		Description: fields[3],
		Amount:      amount,
		Balance:     parseAmount(fields[6]),
		Currency:    currency,
	}, nil
}

// deriveType infers a normalized TransactionType from the bank code, description,
// and amount sign. The result is a best-guess that the user can correct in the UI.
func deriveType(code, description string, amount float64) parser.TransactionType {
	desc := strings.ToUpper(description)

	// Fees and commissions
	if strings.Contains(desc, "COMISION") || strings.Contains(desc, "COBRO ADMINISTR") {
		return parser.TypeFee
	}

	// Interest charged or earned
	if strings.Contains(desc, "INTERES") {
		return parser.TypeInterest
	}

	// Transfers between own accounts
	if code == "TF" {
		if amount < 0 {
			return parser.TypeTransferOut
		}
		return parser.TypeTransferIn
	}

	// Everything else: sign determines expense vs income
	if amount < 0 {
		return parser.TypeExpense
	}
	return parser.TypeIncome
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
