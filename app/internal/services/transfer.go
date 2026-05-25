package services

import (
	"strings"

	"ledger-api/app/internal/models"
)

func NewTransferService() *TransferService { return &TransferService{} }

// Match identifies transfer pairs across statements using a 3-tier priority:
//  1. Same Reference across accounts (strongest)
//  2. Description contains counterpart's ShortNumber (TEF A/DE patterns)
//  3. Same date + same absolute amount (weakest, needs user confirmation)
//
// Returns pairs of (outIndex, inIndex) into the flattened transaction list.
func (s *TransferService) Match(statements []*models.Statement) [][2]int {
	type indexed struct {
		stmtIdx int
		txIdx   int
		tx      models.Transaction
	}

	var all []indexed
	for si, stmt := range statements {
		for ti, tx := range stmt.Transactions {
			all = append(all, indexed{si, ti, tx})
		}
	}

	shortNumbers := make(map[int]string, len(statements))
	for i, stmt := range statements {
		shortNumbers[i] = stmt.ShortNumber
	}

	matched := make(map[int]bool)
	var pairs [][2]int

	for i, a := range all {
		if matched[i] {
			continue
		}
		for j, b := range all {
			if j <= i || matched[j] || a.stmtIdx == b.stmtIdx {
				continue
			}
			if isTransferPair(a.tx, b.tx, shortNumbers[a.stmtIdx], shortNumbers[b.stmtIdx]) {
				matched[i] = true
				matched[j] = true
				pairs = append(pairs, [2]int{i, j})
				break
			}
		}
	}

	return pairs
}

func isTransferPair(a, b models.Transaction, shortA, shortB string) bool {
	// Tier 1: same non-empty reference
	if a.Reference != "" && a.Reference == b.Reference {
		return true
	}

	// Tier 2: TEF description contains counterpart's short number
	if shortB != "" && strings.Contains(a.Description, shortB) {
		return true
	}
	if shortA != "" && strings.Contains(b.Description, shortA) {
		return true
	}

	// Tier 3: same date + same absolute amount (opposite signs)
	if a.Date.Equal(b.Date) && a.Amount.Add(b.Amount).IsZero() {
		return true
	}

	return false
}
