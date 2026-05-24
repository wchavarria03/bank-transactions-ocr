package services

type ImportService struct {
	accounts     AccountRepository
	transactions TransactionRepository
	classifier   *ClassificationService
}

type ClassificationService struct {
	rules ClassificationRuleRepository
}

type TransferService struct{}
