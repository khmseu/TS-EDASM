#!/bin/bash
# Quick test runner with logging
cd /bigdata/KAI/projects/TS-EDASM || exit 1

# Ensure pipeline failures are reported
set -o pipefail

LOG_FILE="test_quick_$(date +%Y%m%d_%H%M%S).log"
echo "Running quick tests with output to: ${LOG_FILE}"
echo ""

{
	echo "=== TypeScript Compilation Check ==="
	if npx tsc --noEmit; then
		echo "✓ Compilation successful"
	else
		echo "✗ Compilation failed"
		exit 1
	fi

	echo ""
	echo "=== Running Tests ==="
	npm test -- --reporter=verbose 2>&1 | tail -200
} 2>&1 | tee "${LOG_FILE}"

echo ""
echo "✓ Output saved to: ${LOG_FILE}"
