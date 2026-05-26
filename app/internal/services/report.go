package services

import (
	"context"
	"sort"
	"time"

	"ledger-api/app/internal/models"
)

func NewReportService(repo TransactionRepository, cats CategoryRepository) *ReportService {
	return &ReportService{repo: repo, categories: cats}
}

func (s *ReportService) Summarize(ctx context.Context, accountIDs []string, from, to time.Time) (*models.ReportSummary, error) {
	txs, err := s.repo.GetByAccountIDsInRange(ctx, accountIDs, from, to)
	if err != nil {
		return nil, err
	}

	allCats, err := s.categories.FindAll(ctx)
	if err != nil {
		return nil, err
	}
	catByID := make(map[string]*models.Category, len(allCats))
	for _, c := range allCats {
		catByID[c.ID] = c
	}

	summary := &models.ReportSummary{
		PeriodStart:    from.Format("2006-01-02"),
		PeriodEnd:      to.Format("2006-01-02"),
		BalanceHistory: []models.DailyBalance{},
		DailyChanges:   []models.DailyChange{},
		ByCategory:     []models.CategorySpend{},
	}

	dailyIncome := map[string]float64{}
	dailyExpenses := map[string]float64{}
	dailyBalance := map[string]float64{}
	categoryTotals := map[string]*models.CategorySpend{}

	var lastBalance float64

	for _, tx := range txs { // sorted date asc by the repo query
		day := tx.Date.Format("2006-01-02")
		amount, _ := tx.Amount.Float64()
		bal, _ := tx.Balance.Float64()

		dailyBalance[day] = bal
		lastBalance = bal

		switch tx.Type {
		case models.TypeIncome, models.TypeInterest:
			summary.TotalIncome += amount
			dailyIncome[day] += amount
		case models.TypeExpense, models.TypeFee:
			summary.TotalExpenses += amount
			dailyExpenses[day] += amount
			if root := resolveRootCategory(tx.Categories, catByID); root != nil {
				if _, ok := categoryTotals[root.ID]; !ok {
					categoryTotals[root.ID] = &models.CategorySpend{
						CategoryID:   root.ID,
						CategoryName: root.Name,
						Color:        root.Color,
					}
				}
				categoryTotals[root.ID].Total += amount
			}
		case models.TypeTransferIn:
			summary.Transfers.IncomingCount++
			summary.Transfers.IncomingTotal += amount
		case models.TypeTransferOut:
			summary.Transfers.OutgoingCount++
			summary.Transfers.OutgoingTotal += amount
		}
	}

	summary.TotalBalance = lastBalance
	summary.PeriodChange = summary.TotalIncome - summary.TotalExpenses

	var prevBalance float64
	for d := from; !d.After(to); d = d.AddDate(0, 0, 1) {
		day := d.Format("2006-01-02")
		summary.DailyChanges = append(summary.DailyChanges, models.DailyChange{
			Date:     day,
			Income:   dailyIncome[day],
			Expenses: dailyExpenses[day],
		})
		if bal, ok := dailyBalance[day]; ok {
			prevBalance = bal
		}
		summary.BalanceHistory = append(summary.BalanceHistory, models.DailyBalance{
			Date:    day,
			Balance: prevBalance,
		})
	}

	for _, cs := range categoryTotals {
		summary.ByCategory = append(summary.ByCategory, *cs)
	}
	sort.Slice(summary.ByCategory, func(i, j int) bool {
		return summary.ByCategory[i].Total > summary.ByCategory[j].Total
	})

	return summary, nil
}

// resolveRootCategory walks up one level to return the parent category.
// Takes the first assigned category; if it has a parent, returns the parent.
func resolveRootCategory(cats []*models.Category, catByID map[string]*models.Category) *models.Category {
	if len(cats) == 0 {
		return nil
	}
	cat := cats[0]
	if cat.ParentID == "" {
		return cat
	}
	if parent, ok := catByID[cat.ParentID]; ok {
		return parent
	}
	return cat
}
