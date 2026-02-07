# Test Runners Guide

This directory contains multiple test runner scripts that write output to log files for easier analysis.

## Quick Start

### Run All Tests with Logging

```bash
bash run-all-tests.sh
```

This runs the complete test suite and saves output to `test_logs/` directory.

## Available Scripts

### 1. `run-all-tests.sh` (Recommended)

**Purpose:** Master test runner - runs multiple test suites and collects all output

**Output:** Creates multiple log files in `test_logs/`:

- `test_main_YYYYMMDD_HHMMSS.log` - Full vitest output
- `test_vitest_YYYYMMDD_HHMMSS.log` - Vitest results
- `test_verify_YYYYMMDD_HHMMSS.log` - Verification tests
- `test_runner_YYYYMMDD_HHMMSS.log` - Node runner results

**Usage:**

```bash
bash run-all-tests.sh
```

---

### 2. `run-tests.sh`

**Purpose:** Main test runner with various test categories

**Output:** `test_output_YYYYMMDD_HHMMSS.log`

**Usage:**

```bash
# Run all tests (default)
bash run-tests.sh

# Run specific test category
bash run-tests.sh golden          # Golden tests only
bash run-tests.sh integration     # Integration tests only
bash run-tests.sh watch           # Watch mode
```

---

### 3. `run_test_debug.sh`

**Purpose:** Detailed test runner with system info and environment details

**Output:** `test_logs/test_detailed_YYYYMMDD_HHMMSS.log`

**Usage:**

```bash
bash run_test_debug.sh
```

**Includes:**

- Node.js and npm versions
- Working directory info
- TypeScript compilation check
- Full test suite output

---

### 4. `quick-test.sh`

**Purpose:** Fast test runner for quick validation

**Output:** `test_quick_YYYYMMDD_HHMMSS.log`

**Usage:**

```bash
bash quick-test.sh
```

---

### 5. `test-runner.js`

**Purpose:** Custom Node.js test runner with detailed pass/fail reporting

**Output:** Two files in `test_logs/`:

- `test-runner_TIMESTAMP.log` - Full detailed output
- `test-summary_TIMESTAMP.txt` - Quick summary

**Usage:**

```bash
node test-runner.js
```

**Tests:**

1. Branch instruction detection
2. Symbol value return type
3. Special '\*' symbol for PC
4. EQU directive with expressions
5. All 8 branch instructions

---

### 6. `view-logs.sh`

**Purpose:** View and manage test log files

**Usage:**

```bash
bash view-logs.sh
```

**Shows:**

- List of all available logs
- Log file sizes
- Commands to view logs
- Commands to search for failures

---

## Log File Structure

All test logs are saved in the `test_logs/` directory with timestamp-based naming:

```
test_logs/
├── test_main_20260207_153042.log
├── test_vitest_20260207_153042.log
├── test_verify_20260207_153042.log
├── test_runner_20260207_153042.log
├── test_detailed_20260207_153100.log
└── test_summary_20260207_153100.txt
```

## Viewing Logs

### View latest log

```bash
cat test_logs/$(ls -t test_logs/*.log | head -1)
```

### View last 50 lines

```bash
tail -50 test_logs/test_main_*.log
```

### Search for failures

```bash
grep -i "fail\|error\|✗" test_logs/test_main_*.log
```

### View summary

```bash
cat test_logs/test_summary_*.txt
```

## Using with CI/CD

The log files make it easy to integrate test output into CI/CD systems:

1. **GitLab CI:** Save logs as artifacts
2. **GitHub Actions:** Upload logs to workflow artifacts
3. **Jenkins:** Archive logs in post-build steps

## Troubleshooting

### No logs created?

- Make sure `test_logs/` directory exists or has write permissions
- Check that bash scripts have execute permissions: `chmod +x *.sh`

### Logs too large?

- Use `tail` or `grep` to view specific sections
- Check `test_logs/test_summary_*.txt` for quick summary

### Want to clean up old logs?

```bash
# Remove logs older than 7 days
find test_logs/ -name "*.log" -mtime +7 -delete
```

## Integration with VS Code

Add these tasks to `.vscode/tasks.json`:

```json
{
  "label": "Run All Tests with Logging",
  "type": "shell",
  "command": "bash",
  "args": ["run-all-tests.sh"],
  "problemMatcher": "$tsc",
  "group": { "kind": "test", "isDefault": true }
}
```

Then run with `Ctrl+Shift+B` or Tasks menu.
