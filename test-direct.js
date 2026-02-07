#!/usr/bin/env node
// Direct test of assembler functionality
// Usage: node test-direct.js

import { assemble } from "./dist/assembler/index.js";

console.log("=== Test 1: Simple LDA instruction ===");
const test1 = assemble(`
      ORG $8000
      LDA #$42
`);
console.log("Result:", {
  ok: test1.ok,
  errors: test1.errors,
  objectBytes: test1.artifacts?.objectBytes?.slice(0, 5) || "undefined",
});

console.log("\n=== Test 2: Symbol definition with * ===");
const test2 = assemble(`
      ORG $8000
      NOP
      ORG $9000
      NOP
`);
console.log("Result:", {
  ok: test2.ok,
  errors: test2.errors,
  "*": test2.artifacts?.symbols.get("*"),
  expectedPC: 0x9001,
});

console.log("\n=== Test 3: Branch instruction ===");
const test3 = assemble(`
      ORG $8000
START NOP
      DS 200
      BNE START
`);
console.log("Result:", {
  ok: test3.ok,
  errors: test3.errors,
  expectedError: 'should contain "range"',
});

console.log("\n=== Test 4: EQU directive ===");
const test4 = assemble(`
      ORG $8000
VALUE EQU $1234
      LDA VALUE
`);
console.log("Result:", {
  ok: test4.ok,
  errors: test4.errors,
  VALUE: test4.artifacts?.symbols.get("VALUE"),
  expectedValue: 0x1234,
});
