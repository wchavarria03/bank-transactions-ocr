package services

type ImportService struct {
	accounts     AccountRepository
	transactions TransactionRepository
	classifier   *ClassificationService
	userID       string
}

type ClassificationService struct {
	rules ClassificationRuleRepository
}

type TransferService struct{}

type CategoryService struct {
	categories CategoryRepository
	rules      CategoryRuleRepository
	txCats     TransactionCategoryRepository
}

type AccountService struct {
	accounts AccountRepository
}

type ReportService struct {
	repo       TransactionRepository
	categories CategoryRepository
}
