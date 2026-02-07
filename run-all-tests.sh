#!/bin/bash
# Master test runner - runs tests and collects output to logs directory

set -e

cd /bigdata/KAI/projects/TS-EDASM

# Create logs directory
LOGS_DIR="test_logs"
mkdir -p "${LOGS_DIR}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MAIN_LOG="${LOGS_DIR}/test_main_${TIMESTAMP}.log"
VITEST_LOG="${LOGS_DIR}/test_vitest_${TIMESTAMP}.log"
VERIFY_LOG="${LOGS_DIR}/test_verify_${TIMESTAMP}.log"
RUNNER_LOG="${LOGS_DIR}/test_runner_${TIMESTAMP}.log"

echo "═══════════════════════════════════════════════════════"
echo "TS-EDASM Test Suite - Master Test Runner"
echo "═══════════════════════════════════════════════════════"
echo "Timestamp: ${TIMESTAMP}"
echo "Logs directory: ${LOGS_DIR}/"
echo ""
echo "Log files:"
echo "  Main test output:    ${MAIN_LOG}"
echo "  Vitest output:       ${VITEST_LOG}"
echo "  Verification output: ${VERIFY_LOG}"
echo "  Node runner output:  ${RUNNER_LOG}"
echo ""

# Function to run a command and log it
run_test() {
	local name="${1}"
	local cmd="${2}"
	local log_file="${3}"

	echo "───────────────────────────────────────────────────────"
	echo "Running: ${name}"
	echo "Log file: ${log_file}"
	echo "───────────────────────────────────────────────────────"

	{
		echo "═══════════════════════════════════════════════════════"
		echo "TEST: ${name}"
		echo "Started: $(date '+%Y-%m-%d %H:%M:%S')"
		echo "═══════════════════════════════════════════════════════"
		echo ""
		echo "Command: ${cmd}"
		echo ""

		eval "${cmd}"

		echo ""
		echo "Completed: $(date '+%Y-%m-%d %H:%M:%S')"
	} 2>&1 | tee "${log_file}"

	echo "✓ Output saved to: ${log_file}"
	echo ""
}

# Main test - full vitest run
run_test "Full Vitest Suite" \
	"npm test" \
	"${VITEST_LOG}"

# Node runner test - custom test runner (only if dist/ exists)
if [[ -d "dist" ]] && [[ -f "dist/assembler/index.js" ]]; then
	run_test "Custom Node Test Runner" \
		"node test-runner.js" \
		"${RUNNER_LOG}"
else
	echo "Skipping Custom Node Test Runner (dist/ not built)"
	echo "To build: npm run build"
	echo "" >"${RUNNER_LOG}"
fi

# Summary report
echo "═══════════════════════════════════════════════════════"
echo "TEST RUN SUMMARY"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "All test logs saved to: ${LOGS_DIR}/"
echo ""
echo "Review logs:"
echo "  cat ${MAIN_LOG}       # Main test results"
echo "  cat ${VERIFY_LOG}     # Verification results"
echo "  cat ${RUNNER_LOG}     # Custom runner results"
echo ""
echo "Quick summary:"
FAIL_COUNT=$(grep -c "× " "${VITEST_LOG}" || echo "unknown")
PASS_COUNT=$(grep -c "✓ " "${VITEST_LOG}" || echo "unknown")
echo "  Tests passed: ${PASS_COUNT}"
echo "  Tests failed: ${FAIL_COUNT}"
echo ""
echo "═══════════════════════════════════════════════════════"
