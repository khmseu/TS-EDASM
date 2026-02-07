#!/bin/bash
# Detailed test runner with comprehensive logging
cd /bigdata/KAI/projects/TS-EDASM || exit

# Ensure pipeline errors are not masked
set -o pipefail

LOG_DIR="test_logs"
mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/test_detailed_$(date +%Y%m%d_%H%M%S).log"

echo "═══════════════════════════════════════════════"
echo "TS-EDASM Test Suite - Detailed Run"
echo "═══════════════════════════════════════════════"
echo "Log file: ${LOG_FILE}"
echo ""

TMP_LOG=$(mktemp)
# shellcheck disable=SC2312
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
} >"${TMP_LOG}" 2>&1

# Show output and save to final log file
tee "${LOG_FILE}" <"${TMP_LOG}"
rc=$?
rm -f "${TMP_LOG}"
if [[ ${rc} -ne 0 ]]; then
	echo "✗ Test run failed with exit code ${rc}" | tee -a "${LOG_FILE}"
	exit "${rc}"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "✓ Test output saved to: ${LOG_FILE}"
echo "View log: cat ${LOG_FILE}"
echo "Summary: tail -50 ${LOG_FILE}"
echo "═══════════════════════════════════════════════"
