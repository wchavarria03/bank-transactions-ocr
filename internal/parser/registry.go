package parser

import "fmt"

var registered []BankParser

// Register adds a parser to the global registry. Called from each parser's init().
func Register(p BankParser) {
	registered = append(registered, p)
}

// Detect tries all registered parsers and returns the first one whose Detect() returns true.
func Detect(text string) (BankParser, error) {
	for _, p := range registered {
		if p.Detect(text) {
			return p, nil
		}
	}
	return nil, fmt.Errorf("unrecognized format — supported parsers: %v", List())
}

// List returns the names of all registered parsers.
func List() []string {
	names := make([]string, len(registered))
	for i, p := range registered {
		names[i] = p.Name()
	}
	return names
}
