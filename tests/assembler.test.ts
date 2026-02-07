import { describe, expect, it } from 'vitest';
import { assemble } from '../src/index';

describe('Assembler basic tests', () => {
  it('assembles simple LDA immediate', () => {
    const source = `
      ORG $8000
START LDA #$42
      RTS
`;
    const result = assemble(source);
    
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.artifacts).toBeDefined();
    
    if (result.artifacts) {
      expect(result.artifacts.objectBytes!.length).toBeGreaterThan(0);
      // LDA #$42 = A9 42, RTS = 60
      expect(result.artifacts.objectBytes![0]).toBe(0xA9);
      expect(result.artifacts.objectBytes![1]).toBe(0x42);
      expect(result.artifacts.objectBytes![2]).toBe(0x60);
    }
  });
  
  it('handles labels and symbols', () => {
    const source = `
      ORG $8000
VALUE EQU $FF
START LDA #VALUE
      STA $C000
      JMP START
`;
    const result = assemble(source);
    
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('reports undefined symbols', () => {
    const source = `
      ORG $8000
      LDA UNDEFINED
`;
    const result = assemble(source);
    
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('Undefined'))).toBe(true);
  });
  
  it('handles data directives', () => {
    const source = `
      ORG $8000
DATA  DB $01,$02,$03
      DW $1234
      ASC "HELLO"
`;
    const result = assemble(source);
    
    expect(result.ok).toBe(true);
    if (result.artifacts) {
      expect(result.artifacts.objectBytes![0]).toBe(0x01);
      expect(result.artifacts.objectBytes![1]).toBe(0x02);
      expect(result.artifacts.objectBytes![2]).toBe(0x03);
      expect(result.artifacts.objectBytes![3]).toBe(0x34); // Low byte of $1234
      expect(result.artifacts.objectBytes![4]).toBe(0x12); // High byte
    }
  });
});

describe('Linker basic tests', () => {
  it('placeholder - linker not fully tested yet', () => {
    expect(true).toBe(true);
  });
});
