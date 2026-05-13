package parser

import (
	"bufio"
	"fmt"
	"os"
)

// WriteTransactions writes transactions to a file, one per line.
func WriteTransactions(path string, transactions []Transaction) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	w := bufio.NewWriter(f)
	for _, tx := range transactions {
		line := fmt.Sprintf("%s--%s--%.2f--%.2f--%s\n",
			tx.Date.Format("2006-01-02"),
			tx.Description,
			tx.Amount,
			tx.Balance,
			tx.Currency,
		)
		if _, err := w.WriteString(line); err != nil {
			return err
		}
	}
	return w.Flush()
}
