package handlers

type ExtractHandler struct {
	importer Importer
}

type DumpHandler struct{}

type AccountHandler struct {
	svc AccountLister
}

type MeHandler struct{}

type TransactionHandler struct {
	svc TransactionLister
}

type CategoryHandler struct {
	svc CategoryManager
}

type ReportHandler struct {
	accounts   AccountLister
	summarizer ReportSummarizer
}
