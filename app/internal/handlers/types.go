package handlers

type ExtractHandler struct {
	importer Importer
}

type DumpHandler struct{}

type AccountHandler struct {
	svc AccountLister
}
