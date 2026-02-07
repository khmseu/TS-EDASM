import { assemble } from "./src/assembler";

// Test 1: Simple LDA instruction
const test1 = assemble(`
      ORG $8000
      LDA #$42
`);
console.log("Test 1 (LDA #$42):", {
  ok: test1.ok,
  errors: test1.errors,
  objectBytes: test1.artifacts?.objectBytes
    ?.slice(0, 5)
    .map((b) => "0x" + b.toString(16).toUpperCase().padStart(2, "0"))
    .join(", "),
});

// Test 2: Branch instruction test
const test2 = assemble(`
      ORG $8000
START NOP
      DS 200
      BNE START
`);
console.log("\nTest 2 (BNE START):", {
  ok: test2.ok,
  errors: test2.errors,
  objectBytes: test2.artifacts?.objectBytes
    ?.slice(0, 5)
    .map((b) => "0x" + b.toString(16).toUpperCase().padStart(2, "0"))
    .join(", "),
});

// Test 3: EQU directive
const test3 = assemble(`
      ORG $8000
VALUE EQU $1234
      LDA VALUE
`);
console.log("\nTest 3 (EQU directive):", {
  ok: test3.ok,
  errors: test3.errors,
  symbolValue: test3.artifacts?.symbols.get("VALUE"),
});
