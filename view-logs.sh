#!/bin/bash
# View test logs - shows available logs and lets you view them

LOGS_DIR="test_logs"

# Ensure pipeline failures are detected
set -o pipefail

if [[ ! -d ${LOGS_DIR} ]]; then
	echo "No test_logs directory found. Run tests first with:"
	echo "  bash run-all-tests.sh"
	exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "TS-EDASM Test Logs Viewer"
echo "═══════════════════════════════════════════════════════"
echo ""

# List all log files
echo "Available test logs:"
echo ""
find "${LOGS_DIR}" -maxdepth 1 -type f -name "*.log" -printf '%f (%s bytes)\n' | nl

echo ""
echo "View specific log:"
echo "  cat test_logs/test_main_YYYYMMDD_HHMMSS.log"
echo "  tail -50 test_logs/test_main_YYYYMMDD_HHMMSS.log"
echo ""
echo "Search for failures:"
echo "  grep -i 'fail\|✗\|error' test_logs/test_*.log"
echo ""
echo "Show only the summary:"
echo "  tail -30 test_logs/test_main_YYYYMMDD_HHMMSS.log"
echo ""
