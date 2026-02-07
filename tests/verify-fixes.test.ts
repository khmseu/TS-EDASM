// Minimal test to verify assembler fixes
// This file can be run with: npx vitest run tests/verify-fixes.test.ts

import { describe, it, expect } from "vitest";
import { assemble } from "../src/assembler";

describe("Verify Fixes", () => {
  it("Fix 1: Branch instruction detection (BNE should use RELATIVE addressing)", () => {
    const source = `
      ORG $8000
START NOP
      DS 200
      BNE START
    `;
    const result = assemble(source, { origin: 0x8000 });
    // Should detect branch out of range error (not "invalid addressing mode")
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/range|branch/i);
  });

  it("Fix 2: SymbolTable.get() returns number value", () => {
    const source = `
      VALUE EQU $42
      ORG $8000
      LDA #VALUE
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(true);
    expect(typeof result.artifacts?.symbols.get("VALUE")).toBe("number");
    expect(result.artifacts?.symbols.get("VALUE")).toBe(0x42);
  });

  it("Fix 3: * symbol tracks final PC", () => {
    const source = `
      ORG $8000
      NOP
      ORG $9000
      NOP
    `;
    const result = assemble(source, {});
    expect(result.ok).toBe(true);
    expect(result.artifacts?.symbols.get("*")).toBe(0x9001);
  });

  it("Fix 4: EQU with expressions", () => {
    const source = `
      MYCONST EQU $42
      ANOTHER EQU MYCONST + 10
      ORG $8000
      LDA #MYCONST
      LDX #ANOTHER
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(true);
    expect(result.artifacts?.symbols.get("MYCONST")).toBe(0x42);
    expect(result.artifacts?.symbols.get("ANOTHER")).toBe(0x4c);

    const code = result.artifacts!.objectBytes!;
    expect(code[0]).toBe(0xa9); // LDA #
    expect(code[1]).toBe(0x42);
    expect(code[2]).toBe(0xa2); // LDX #
    expect(code[3]).toBe(0x4c);
  });

  it("Fix 5: All 8 branch instructions detected as RELATIVE", () => {
    const mnemonics = ["BEQ", "BNE", "BCC", "BCS", "BMI", "BPL", "BVC", "BVS"];

    for (const mnem of mnemonics) {
      const source = `
        ORG $8000
START NOP
        DS 200
        ${mnem} START
      `;
      const result = assemble(source);
      // All should detect branch out of range, not invalid addressing mode
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatch(/range|branch/i);
    }
  });
});
