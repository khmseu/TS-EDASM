#!/bin/bash
cd /bigdata/KAI/projects/TS-EDASM || exit
echo "Running tests..."
npm test 2>&1 | tail -100
