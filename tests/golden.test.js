/**
 * Golden tests - comprehensive validation of assembler output
 */
import { describe, it, expect } from "vitest";
import { assemble } from "../src/assembler";
import { link } from "../src/linker";
describe("Golden Tests - Instructions", () => {
  it("should assemble all addressing modes correctly", () => {
    const source = `
      ORG $8000
      ; Immediate
      LDA #$42
      LDX #$10
      LDY #$20
      ; Zero Page
      LDA $80
      STA $90
      ; Zero Page,X
      LDA $80,X
      STA $90,X
      ; Zero Page,Y
      LDX $80,Y
      STX $90,Y
      ; Absolute
      LDA $C000
      STA $C001
      JMP $8000
      ; Absolute,X
      LDA $C000,X
      STA $C001,X
      ; Absolute,Y
      LDA $C000,Y
      STA $C001,Y
      ; Indirect
      JMP ($FFFC)
      ; (Indirect,X)
      LDA ($80,X)
      STA ($90,X)
      ; (Indirect),Y
      LDA ($80),Y
      STA ($90),Y
      ; Implied
      CLC
      SEC
      RTS
      NOP
      ; Accumulator
      ASL A
      LSR A
      ROL A
      ROR A
      ; Relative
START BEQ START
      BNE START
      BCC START
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const code = result.artifacts.objectBytes;
    // Verify specific opcodes and operands
    expect(code[0]).toBe(0xa9); // LDA #$42
    expect(code[1]).toBe(0x42);
    expect(code[2]).toBe(0xa2); // LDX #$10
    expect(code[3]).toBe(0x10);
    expect(code[4]).toBe(0xa0); // LDY #$20
    expect(code[5]).toBe(0x20);
    expect(code[6]).toBe(0xa5); // LDA $80
    expect(code[7]).toBe(0x80);
    expect(code[8]).toBe(0x85); // STA $90
    expect(code[9]).toBe(0x90);
  });
  it("should handle all 6502 opcodes", () => {
    const source = `
      ORG $1000
      ; Load/Store
      LDA #$00
      LDX #$00
      LDY #$00
      STA $00
      STX $00
      STY $00
      ; Transfer
      TAX
      TAY
      TSX
      TXA
      TXS
      TYA
      ; Stack
      PHA
      PHP
      PLA
      PLP
      ; Arithmetic
      ADC #$01
      SBC #$01
      ; Logical
      AND #$FF
      EOR #$FF
      ORA #$FF
      ; Increment/Decrement
      INC $00
      INX
      INY
      DEC $00
      DEX
      DEY
      ; Shift/Rotate
      ASL $00
      LSR $00
      ROL $00
      ROR $00
      ; Compare
      CMP #$00
      CPX #$00
      CPY #$00
      ; Bit test
      BIT $00
      ; Branches
      BCC *
      BCS *
      BEQ *
      BMI *
      BNE *
      BPL *
      BVC *
      BVS *
      ; Flags
      CLC
      CLD
      CLI
      CLV
      SEC
      SED
      SEI
      ; Control
      BRK
      JMP $1000
      JSR $1000
      RTI
      RTS
      NOP
    `;
    const result = assemble(source, { origin: 0x1000 });
    if (!result.ok) {
      console.error("Assembly errors:", result.errors);
    }
    expect(result.ok).toBe(true);
    expect(result.artifacts?.objectBytes).toBeDefined();
    expect(result.artifacts.objectBytes.length).toBeGreaterThan(50);
  });
  it("should assemble 65C02 extended opcodes", () => {
    const source = `
      ORG $2000
      ; 65C02 additions
      BRA *        ; Branch always
      PHX          ; Push X
      PHY          ; Push Y
      PLX          ; Pull X
      PLY          ; Pull Y
      STZ $00      ; Store zero
      STZ $00,X
      STZ $1000
      STZ $1000,X
      TRB $00      ; Test and reset bits
      TSB $00      ; Test and set bits
      ; (Indirect) addressing
      LDA ($00)
      STA ($00)
      ; JMP (Indirect,X)
      JMP ($1000,X)
    `;
    const result = assemble(source, { origin: 0x2000, cpu: "65C02" });
    if (!result.ok) {
      console.error("65C02 errors:", result.errors);
    }
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const code = result.artifacts.objectBytes;
    expect(code[0]).toBe(0x80); // BRA
    expect(code[2]).toBe(0xda); // PHX
    expect(code[3]).toBe(0x5a); // PHY
  });
});
describe("Golden Tests - Directives", () => {
  it("should handle ORG directive", () => {
    const source = `
      ORG $8000
      NOP
      ORG $9000
      NOP
    `;
    const result = assemble(source, {});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Should have tracked PC changes
    expect(result.artifacts?.symbols.get("*")).toBe(0x9001);
  });
  it("should handle EQU directive", () => {
    const source = `
      MYCONST EQU $42
      ANOTHER EQU MYCONST + 10
      
      ORG $8000
      LDA #MYCONST
      LDX #ANOTHER
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.artifacts?.symbols.get("MYCONST")).toBe(0x42);
    expect(result.artifacts?.symbols.get("ANOTHER")).toBe(0x4c);
    const code = result.artifacts.objectBytes;
    expect(code[0]).toBe(0xa9); // LDA #
    expect(code[1]).toBe(0x42); // $42
    expect(code[2]).toBe(0xa2); // LDX #
    expect(code[3]).toBe(0x4c); // $4C
  });
  it("should handle data directives", () => {
    const source = `
      ORG $8000
      DB $01,$02,$03
      DW $1234,$5678
      ASC "HELLO"
      DCI "WORLD"
      DS 5
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const code = result.artifacts.objectBytes;
    // DB
    expect(code[0]).toBe(0x01);
    expect(code[1]).toBe(0x02);
    expect(code[2]).toBe(0x03);
    // DW (little-endian)
    expect(code[3]).toBe(0x34);
    expect(code[4]).toBe(0x12);
    expect(code[5]).toBe(0x78);
    expect(code[6]).toBe(0x56);
    // ASC
    expect(code[7]).toBe("H".charCodeAt(0));
    expect(code[8]).toBe("E".charCodeAt(0));
    expect(code[9]).toBe("L".charCodeAt(0));
    expect(code[10]).toBe("L".charCodeAt(0));
    expect(code[11]).toBe("O".charCodeAt(0));
    // DCI (last char has high bit set)
    expect(code[12]).toBe("W".charCodeAt(0));
    expect(code[13]).toBe("O".charCodeAt(0));
    expect(code[14]).toBe("R".charCodeAt(0));
    expect(code[15]).toBe("L".charCodeAt(0));
    expect(code[16]).toBe("D".charCodeAt(0) | 0x80);
    // DS (5 zeros)
    expect(code[17]).toBe(0x00);
    expect(code[21]).toBe(0x00);
  });
});
describe("Golden Tests - Labels and Symbols", () => {
  it("should resolve forward references", () => {
    const source = `
      ORG $8000
START JMP END
      NOP
      NOP
END   RTS
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.artifacts?.symbols.get("START")).toBe(0x8000);
    expect(result.artifacts?.symbols.get("END")).toBe(0x8005);
    const code = result.artifacts.objectBytes;
    expect(code[0]).toBe(0x4c); // JMP absolute
    expect(code[1]).toBe(0x05); // Low byte of $8005
    expect(code[2]).toBe(0x80); // High byte of $8005
  });
  it("should handle backward references", () => {
    const source = `
      ORG $C000
START NOP
      NOP
LOOP  DEX
      BNE LOOP
      JMP START
    `;
    const result = assemble(source, { origin: 0xc000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const code = result.artifacts.objectBytes;
    console.log(
      "Code bytes:",
      Array.from(code)
        .map(
          (b, i) =>
            `$C${(0x000 + i).toString(16).toUpperCase().padStart(3, "0")}: ${b.toString(16).toUpperCase().padStart(2, "0")}`,
        )
        .join(", "),
    );
    // BNE LOOP (should branch back 3 bytes from next instruction)
    // PC after BNE is $C005, target is $C002, so offset is -3
    expect(code[3]).toBe(0xd0); // BNE
    expect(code[4]).toBe(0xfd); // -3 (branch offset)
  });
  it("should handle local labels", () => {
    const source = `
      ORG $5000
MAIN  LDX #10
.LOOP DEX
      BNE .LOOP
      RTS
    `;
    const result = assemble(source, { origin: 0x5000 });
    if (!result.ok) {
      console.error("Local labels errors:", result.errors);
    }
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.artifacts?.symbols.has("MAIN")).toBe(true);
    expect(result.artifacts?.symbols.has("MAIN.LOOP")).toBe(true);
  });
  it("should report undefined symbols", () => {
    const source = `
      ORG $8000
      JMP UNDEFINED
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/undefined/i);
  });
});
describe("Golden Tests - Expressions", () => {
  it("should evaluate arithmetic expressions", () => {
    const source = `
      ORG $8000
      BASE EQU $1000
      LDA #BASE+10
      LDA #BASE-5
      LDA #BASE*2
      LDA #BASE/4
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const code = result.artifacts.objectBytes;
    expect(code[1]).toBe(0x0a); // 10
    expect(code[3]).toBe(0xfb); // -5 (as byte)
    expect(code[5]).toBe(0x00); // $2000 low byte
    expect(code[7]).toBe(0x00); // $0400 low byte
  });
  it("should handle < and > operators", () => {
    const source = `
      ORG $8000
      ADDR EQU $1234
      LDA #<ADDR
      LDA #>ADDR
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const code = result.artifacts.objectBytes;
    expect(code[1]).toBe(0x34); // Low byte
    expect(code[3]).toBe(0x12); // High byte
  });
  it("should handle complex expressions", () => {
    const source = `
      ORG $8000
      A EQU 10
      B EQU 20
      C EQU 5
      LDA #A+B*C
      LDA #(A+B)*C
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const code = result.artifacts.objectBytes;
    expect(code[1]).toBe(110); // 10 + 20*5 = 110
    expect(code[3]).toBe(150); // (10+20)*5 = 150
  });
});
describe("Golden Tests - Linker", () => {
  it("should link multiple modules", () => {
    const mod1 = `
      REL
      EXT SUB2
      ORG $8000
MAIN  JSR SUB2
      RTS
    `;
    const mod2 = `
      REL
      ENT SUB2
      ORG $8000
SUB2  LDA #$42
      RTS
    `;
    const result1 = assemble(mod1, { origin: 0x8000, relocatable: true });
    const result2 = assemble(mod2, { origin: 0x8000, relocatable: true });
    if (!result1.ok) {
      console.error("Module 1 errors:", result1.errors);
    }
    if (!result2.ok) {
      console.error("Module 2 errors:", result2.errors);
    }
    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    if (!result1.ok || !result2.ok) return;
    const linkResult = link(
      [result1.artifacts.objectBytes, result2.artifacts.objectBytes],
      { origin: 0x8000 },
    );
    expect(linkResult.ok).toBe(true);
    expect(linkResult.artifacts?.executable).toBeDefined();
  });
  it("should handle external symbols", () => {
    const source = `
      REL
      EXT PRINT
      ENT MAIN
      ORG $2000
MAIN  JSR PRINT
      RTS
    `;
    const result = assemble(source, { origin: 0x2000, relocatable: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Verify external symbol is marked
    expect(result.artifacts?.symbols.has("PRINT")).toBe(true);
  });
  it("should apply relocations", () => {
    const source = `
      REL
      ORG $8000
START LDA DATA
DATA  DB $42
    `;
    const result = assemble(source, { origin: 0x8000, relocatable: true });
    console.log("Assembly result:", result);
    if (result.artifacts?.bytes) {
      console.log(
        "Assembled bytes:",
        Array.from(result.artifacts.bytes)
          .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
          .join(" "),
      );
    }
    if (result.artifacts?.objectBytes) {
      console.log("Object bytes length:", result.artifacts.objectBytes.length);
    }
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Link at different address
    const linkResult = link([result.artifacts.objectBytes], { origin: 0x9000 });
    console.log("Link result:", linkResult);
    expect(linkResult.ok).toBe(true);
    if (!linkResult.ok) return;
    const code = linkResult.artifacts.executable;
    console.log(
      "Linked code:",
      Array.from(code)
        .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
        .join(" "),
    );
    // LDA absolute should reference relocated DATA
    expect(code[0]).toBe(0xad); // LDA absolute
    expect(code[1]).toBe(0x03); // Low byte of $9003
    expect(code[2]).toBe(0x90); // High byte of $9003
  });
});
describe("Golden Tests - Error Handling", () => {
  it("should detect invalid opcodes", () => {
    const source = `
      ORG $8000
      INVALID #$42
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
  it("should detect invalid addressing modes", () => {
    const source = `
      ORG $8000
      RTS #$42
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(false);
  });
  it("should detect branch out of range", () => {
    const source = `
      ORG $8000
START NOP
      DS 200
      BNE START
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/range|branch/i);
  });
  it("should detect duplicate labels", () => {
    const source = `
      ORG $8000
LABEL NOP
LABEL NOP
    `;
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/duplicate|redefin/i);
  });
});
describe("Golden Tests - Listing Output", () => {
  it("should generate listing with addresses and hex", () => {
    const source = `
      ORG $8000
START LDA #$42
      STA $C000
      RTS
    `;
    const result = assemble(source, { origin: 0x8000, listing: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const listing = result.artifacts?.listing;
    expect(listing).toBeDefined();
    expect(listing).toContain("8000");
    expect(listing).toContain("A9 42");
    expect(listing).toContain("LDA #$42");
  });
});
//# sourceMappingURL=golden.test.js.map
