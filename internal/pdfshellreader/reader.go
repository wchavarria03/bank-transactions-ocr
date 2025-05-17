package pdfshellreader

import (
	"fmt"
	"os"

	"github.com/ledongthuc/pdf"
)

// Reader handles PDF file operations
type Reader struct {
	pdfPath string
	reader  *pdf.Reader
	file    *os.File
}

// NewReader creates a new PDF reader instance
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

// GetNumPages returns the number of pages in the PDF
func (r *Reader) GetNumPages() (int, error) {
	return r.reader.NumPage(), nil
}

// ExtractTextFromPage extracts text from a specific page
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

// Close closes the PDF reader
func (r *Reader) Close() error {
	if r.file != nil {
		return r.file.Close()
	}
	return nil
}
