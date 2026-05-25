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

type AccountService struct {
	accounts AccountRepository
}
