package pdf

import (
	"fmt"
	"os"

	"github.com/ledongthuc/pdf"
)

type Reader struct {
	pdfPath string
	reader  *pdf.Reader
	file    *os.File
}

func NewReader(pdfPath string) (*Reader, error) {
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("PDF file does not exist: %v", err)
	}

	f, err := os.Open(pdfPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open PDF file: %v", err)
	}

	fileInfo, err := f.Stat()
	if err != nil {
		f.Close()
		return nil, fmt.Errorf("failed to get file info: %v", err)
	}

	reader, err := pdf.NewReader(f, fileInfo.Size())
	if err != nil {
		f.Close()
		return nil, fmt.Errorf("failed to create PDF reader: %v", err)
	}

	return &Reader{
		pdfPath: pdfPath,
		reader:  reader,
		file:    f,
	}, nil
}

func (r *Reader) GetNumPages() int {
	return r.reader.NumPage()
}

func (r *Reader) ExtractTextFromPage(pageNum int) (string, error) {
	if pageNum < 1 || pageNum > r.reader.NumPage() {
		return "", fmt.Errorf("invalid page number: %d", pageNum)
	}

	page := r.reader.Page(pageNum)
	if page.V.IsNull() {
		return "", fmt.Errorf("page %d is null", pageNum)
	}

	text, err := page.GetPlainText(nil)
	if err != nil {
		return "", fmt.Errorf("failed to extract text from page %d: %v", pageNum, err)
	}

	return text, nil
}

func (r *Reader) Close() error {
	if r.file != nil {
		return r.file.Close()
	}
	return nil
}
