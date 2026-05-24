package parser

import "fmt"

var registered []BankParser

func Register(p BankParser) {
	registered = append(registered, p)
}

func Detect(text string) (BankParser, error) {
	for _, p := range registered {
		if p.Detect(text) {
			return p, nil
		}
	}
	return nil, fmt.Errorf("unrecognized format — supported parsers: %v", List())
}

func List() []string {
	names := make([]string, len(registered))
	for i, p := range registered {
		names[i] = p.Name()
	}
	return names
}
