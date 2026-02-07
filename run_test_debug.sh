#!/bin/bash
# Detailed test runner with comprehensive logging
cd /bigdata/KAI/projects/TS-EDASM

LOG_DIR="test_logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/test_detailed_$(date +%Y%m%d_%H%M%S).log"

echo "═══════════════════════════════════════════════"
echo "TS-EDASM Test Suite - Detailed Run"
echo "═══════════════════════════════════════════════"
echo "Log file: $LOG_FILE"
echo ""

{
  echo "Starting test run at $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  echo "=== Environment ==="
  echo "Node version: $(node --version)"
  echo "NPM version: $(npm --version)"
  echo "Working directory: $(pwd)"
  echo ""
  
  echo "=== TypeScript Compilation ==="
  npx tsc --noEmit
  echo "✓ TypeScript compilation successful"
  echo ""
  
  echo "=== Running Full Test Suite ==="
  npm test
  
  echo ""
  echo "Test run completed at $(date '+%Y-%m-%d %H:%M:%S')"
} 2>&1 | tee "$LOG_FILE"

echo ""
echo "═══════════════════════════════════════════════"
echo "✓ Test output saved to: $LOG_FILE"
echo "View log: cat $LOG_FILE"
echo "Summary: tail -50 $LOG_FILE"
echo "═══════════════════════════════════════════════"

