#!/usr/bin/env bash
# Test runner helper script

set -e

# Create log file with timestamp
LOG_FILE="test_output_$(date +%Y%m%d_%H%M%S).log"

echo "TS-EDASM Test Suite"
echo "==================="
echo "Output will be saved to: $LOG_FILE"
echo ""

{
  case "${1:-all}" in
    all)
      echo "Running all tests..."
      npm test
      ;;
    golden)
      echo "Running golden tests..."
      npm run test:golden
      ;;
    integration)
      echo "Running integration tests..."
    npm run test:integration
    ;;
  smoke)
    echo "Running smoke tests..."
    npm run test:smoke
    ;;
  coverage)
    echo "Running tests with coverage..."
    npm run test:coverage
    ;;
  watch)
    echo "Running tests in watch mode..."
    npm run test:watch
    ;;
  *)
    echo "Usage: $0 [all|golden|integration|smoke|coverage|watch]"
    echo ""
    echo "Test categories:"
    echo "  all          - Run all tests (default)"
    echo "  golden       - Run golden tests (exact byte verification)"
    echo "  integration  - Run integration tests (fixture files)"
    echo "  smoke        - Run smoke tests (basic sanity checks)"
    echo "  coverage     - Run all tests with coverage report"
    echo "  watch        - Run tests in watch mode"
    exit 1
    ;;
esac
} 2>&1 | tee "$LOG_FILE"

echo ""
echo "✓ Test output saved to: $LOG_FILE"
echo "View with: cat $LOG_FILE"
echo "Done!"
