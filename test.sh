#!/bin/bash
# Simple test - runs npm test and saves output

LOG_DIR="test_logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/test_$TIMESTAMP.log"

echo "TS-EDASM Test Runner"
echo "===================="
echo "Log file: $LOG_FILE"
echo ""

npm test 2>&1 | tee "$LOG_FILE"

echo ""
echo "✓ Test output saved to: $LOG_FILE"
echo "View with: cat $LOG_FILE"
echo "Summary:   tail -50 $LOG_FILE"
