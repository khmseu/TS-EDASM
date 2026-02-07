#!/bin/bash
cd /bigdata/KAI/projects/TS-EDASM || exit
# Ensure pipeline errors are not masked
set -o pipefail
echo "Running tests..."
npm test 2>&1 | tail -100
