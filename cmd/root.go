package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

// Config holds the global configuration for the application
type Config struct {
	Verbose   bool
	OutputDir string
	InputDir  string
}

var (
	// config holds the global configuration
	config = &Config{}
)

// validateDirectories checks if the input and output directories are valid
func validateDirectories() error {
	// Check if input directory exists
	if _, err := os.Stat(config.InputDir); os.IsNotExist(err) {
		return fmt.Errorf("input directory does not exist: %s", config.InputDir)
	}

	// Check if input directory is readable
	if err := checkDirPermissions(config.InputDir, os.O_RDONLY); err != nil {
		return fmt.Errorf("input directory is not readable: %w", err)
	}

	// Create output directory if it doesn't exist
	if err := os.MkdirAll(config.OutputDir, 0750); err != nil {
		return fmt.Errorf("failed to create output directory: %w", err)
	}

	// Check if output directory is writable
	if err := checkDirPermissions(config.OutputDir, os.O_WRONLY); err != nil {
		return fmt.Errorf("output directory is not writable: %w", err)
	}

	return nil
}

// checkDirPermissions checks if the directory has the required permissions
func checkDirPermissions(dir string, flag int) error {
	// Try to create a temporary file in the directory to check permissions
	tmpFile := filepath.Join(dir, ".tmp_permission_check")
	file, err := os.OpenFile(tmpFile, flag|os.O_CREATE, 0644)
	if err != nil {
		return err
	}
	file.Close()
	os.Remove(tmpFile)
	return nil
}

var rootCmd = &cobra.Command{
	Use:   "transactions-processor",
	Short: "A CLI tool to process transaction documents and convert them to structured formats",
	Long: `Transactions Processor is a command-line tool that helps you extract and process
transaction data from various document formats (like PDFs) and convert them to structured
formats like CSV. It provides various commands to handle different aspects of the processing workflow.`,
	Example: `  # Extract transaction data from documents
  transactions-processor extract

  # Convert extracted data to CSV
  transactions-processor tocsv

  # Run the complete workflow
  transactions-processor all

  # Use custom directories
  transactions-processor -i custom-input -o custom-output extract`,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		// Validate directories
		if err := validateDirectories(); err != nil {
			return err
		}
		return nil
	},
}

// Execute adds all child commands to the root command and sets flags appropriately.
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func init() {
	// Global flags
	rootCmd.PersistentFlags().BoolVarP(&config.Verbose, "verbose", "v", false, "Enable verbose output")
	rootCmd.PersistentFlags().StringVarP(&config.OutputDir, "output", "o", "output", "Output directory for processed files")
	rootCmd.PersistentFlags().StringVarP(&config.InputDir, "input-dir", "i", "input", "Directory containing input documents")

	// Set default values
	rootCmd.PersistentFlags().Lookup("output").DefValue = "output"
	rootCmd.PersistentFlags().Lookup("input-dir").DefValue = "input"

	// Mark flags as required
	rootCmd.MarkPersistentFlagRequired("input-dir")
	rootCmd.MarkPersistentFlagRequired("output")
}
