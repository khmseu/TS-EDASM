/**
 * Integration tests using fixture files
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { assemble } from '../src/assembler';
import { link } from '../src/linker';

const FIXTURES_DIR = join(__dirname, 'fixtures');

function loadFixture(filename: string): string {
  return readFileSync(join(FIXTURES_DIR, filename), 'utf-8');
}

describe('Integration Tests - Fixture Files', () => {
  it('should assemble hello.s', () => {
    const source = loadFixture('hello.s');
    const result = assemble(source, { origin: 0x2000 });
    
    expect(result.ok).toBe(true);
    if (!result.ok) {
      console.error('Errors:', result.errors);
      return;
    }

    expect(result.artifacts?.objectBytes).toBeDefined();
    expect(result.artifacts!.objectBytes!.length).toBeGreaterThan(0);
    
    // Verify symbols
    expect(result.artifacts?.symbols.get('MAIN')).toBe(0x2000);
    expect(result.artifacts?.symbols.get('MESSAGE')).toBeDefined();
    expect(result.artifacts?.symbols.get('PRODOS')).toBe(0xBF00);
    expect(result.artifacts?.symbols.get('COUT')).toBe(0xFDED);
  });

  it('should assemble allmodes.s with all addressing modes', () => {
    const source = loadFixture('allmodes.s');
    const result = assemble(source, { origin: 0x6000 });
    
    expect(result.ok).toBe(true);
    if (!result.ok) {
      console.error('Errors:', result.errors);
      return;
    }

    const code = result.artifacts!.objectBytes!;
    expect(code.length).toBeGreaterThan(100);
    
    // Verify some key opcodes
    expect(code[0]).toBe(0xA9); // LDA #$12 (immediate)
    expect(code[1]).toBe(0x12);
  });

  it('should assemble 65c02.s with extended opcodes', () => {
    const source = loadFixture('65c02.s');
    const result = assemble(source, { origin: 0x7000, cpu: '65C02' });
    
    expect(result.ok).toBe(true);
    if (!result.ok) {
      console.error('Errors:', result.errors);
      return;
    }

    const code = result.artifacts!.objectBytes!;
    
    // Verify 65C02 specific opcodes
    expect(code[0]).toBe(0x80); // BRA (65C02)
    expect(code[2]).toBe(0xDA); // PHX (65C02)
    expect(code[3]).toBe(0x5A); // PHY (65C02)
    expect(code[4]).toBe(0xFA); // PLX (65C02)
    expect(code[5]).toBe(0x7A); // PLY (65C02)
  });

  it('should link multi-module programs', () => {
    const mod1Source = loadFixture('multimod1.s');
    const mod2Source = loadFixture('multimod2.s');
    
    const result1 = assemble(mod1Source, { origin: 0x8000, relocatable: true });
    const result2 = assemble(mod2Source, { origin: 0x8000, relocatable: true });
    
    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    
    if (!result1.ok || !result2.ok) {
      console.error('Assembly errors:', result1.errors, result2.errors);
      return;
    }

    // Verify external/entry symbols
    expect(result1.artifacts?.symbols.has('MAIN')).toBe(true);
    expect(result2.artifacts?.symbols.has('MULTIPLY')).toBe(true);

    // Link the modules
    const linkResult = link(
      [result1.artifacts!.objectBytes!, result2.artifacts!.objectBytes!],
      { origin: 0x8000 }
    );

    expect(linkResult.ok).toBe(true);
    if (!linkResult.ok) {
      console.error('Link errors:', linkResult.errors);
      return;
    }

    expect(linkResult.artifacts?.executable).toBeDefined();
    expect(linkResult.artifacts!.executable!.length).toBeGreaterThan(0);
  });
});

describe('Integration Tests - Listing Output', () => {
  it('should generate listing for hello.s', () => {
    const source = loadFixture('hello.s');
    const result = assemble(source, { origin: 0x2000, listing: true });
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const listing = result.artifacts?.listing;
    expect(listing).toBeDefined();
    expect(listing).toContain('2000');
    expect(listing).toContain('MAIN');
    
    // Should show hex bytes
    expect(listing).toMatch(/[0-9A-F]{2}/);
  });
});

describe('Integration Tests - Error Detection', () => {
  it('should detect syntax errors in modified fixture', () => {
    const source = `
      ORG $8000
      LDA #$42
      INVALID_OPCODE
      RTS
    `;
    
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should detect undefined symbols', () => {
    const source = `
      ORG $8000
      JMP UNDEFINED_LABEL
    `;
    
    const result = assemble(source, { origin: 0x8000 });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/undefined|not found/i);
  });
});

describe('Integration Tests - Round-trip', () => {
  it('should produce consistent output on re-assembly', () => {
    const source = loadFixture('hello.s');
    
    const result1 = assemble(source, { origin: 0x2000 });
    const result2 = assemble(source, { origin: 0x2000 });
    
    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    
    if (!result1.ok || !result2.ok) return;

    // Binary output should be identical
    const bytes1 = result1.artifacts!.objectBytes!;
    const bytes2 = result2.artifacts!.objectBytes!;
    
    expect(bytes1.length).toBe(bytes2.length);
    expect(bytes1).toEqual(bytes2);
  });
});

describe('Integration Tests - Disassembly Verification', () => {
  it('should correctly encode common instruction patterns', () => {
    const source = `
      ORG $C000
      ; Common Apple II pattern
      LDA #$00
      STA $C000
      LDA $C030    ; Click speaker
      JSR $FDED    ; COUT
      RTS
    `;
    
    const result = assemble(source, { origin: 0xC000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const code = result.artifacts!.objectBytes!;
    
    // Verify instruction encoding
    const expected = [
      0xA9, 0x00,       // LDA #$00
      0x8D, 0x00, 0xC0, // STA $C000
      0xAD, 0x30, 0xC0, // LDA $C030
      0x20, 0xED, 0xFD, // JSR $FDED
      0x60              // RTS
    ];
    
    expect(code).toEqual(new Uint8Array(expected));
  });

  it('should correctly handle ProDOS MLI call pattern', () => {
    const source = `
      ORG $2000
      JSR $BF00      ; ProDOS MLI
      DB  $C8        ; OPEN command
      DW  PARMS      ; Parameter block
      RTS
PARMS DW $0000
    `;
    
    const result = assemble(source, { origin: 0x2000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const code = result.artifacts!.objectBytes!;
    expect(code[0]).toBe(0x20); // JSR
    expect(code[1]).toBe(0x00);
    expect(code[2]).toBe(0xBF);
    expect(code[3]).toBe(0xC8); // Command byte
  });
});
