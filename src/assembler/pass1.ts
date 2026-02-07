// Pass 1: Symbol discovery and PC tracking
// Port of EdAsm pass 1 logic from ASM2.S

import { SymbolTable } from './symbols';
import { parseLine, type SourceLine } from './tokenizer';
import { ExpressionEvaluator } from './expressions';
import { getSupportedModes, getInstructionSize, AddressingMode } from './opcodes';

export interface Pass1Options {
  origin?: number;
  cpu?: '6502' | '65C02';
}

export interface Pass1Result {
  symbols: SymbolTable;
  lines: SourceLine[];
  errors: string[];
  warnings: string[];
}

interface AssemblerState {
  pc: number;              // Program counter
  origin: number;          // ORG value
  symbols: SymbolTable;
  errors: string[];
  warnings: string[];
  lineNumber: number;
  cpu: '6502' | '65C02';
}

const DIRECTIVES = new Set([
  'ORG', 'EQU', 'DB', 'DFB', 'DW', 'DA', 'ASC', 'DCI', 'DS',
  'CHN', 'REL', 'EXT', 'ENT', 'END'
]);

export function pass1(source: string, options: Pass1Options = {}): Pass1Result {
  const lines = source.split(/\r?\n/);
  const state: AssemblerState = {
    pc: options.origin || 0,
    origin: options.origin || 0,
    symbols: new SymbolTable(),
    errors: [],
    warnings: [],
    lineNumber: 0,
    cpu: options.cpu || '6502'
  };
  
  const parsedLines: SourceLine[] = [];
  let hasOrg = false;
  
  for (let i = 0; i < lines.length; i++) {
    state.lineNumber = i + 1;
    const line = lines[i];
    const parsed = parseLine(line, state.lineNumber);
    parsedLines.push(parsed);
    
    // Skip blank lines and comments
    if (!parsed.label && !parsed.mnemonic) {
      continue;
    }
    
    // Define label if present (unless it's an EQU - which will define it with the operand value)
    if (parsed.label && parsed.mnemonic?.toUpperCase() !== 'EQU') {
      try {
        state.symbols.define(parsed.label, state.pc, true);
      } catch (err) {
        state.errors.push(`Line ${state.lineNumber}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    // Process mnemonic/directive
    if (!parsed.mnemonic) {
      continue;
    }
    
    const mnem = parsed.mnemonic.toUpperCase();
    
    // Handle directives
    if (DIRECTIVES.has(mnem)) {
      processDirective(state, parsed, mnem);
      if (mnem === 'ORG') {
        hasOrg = true;
      }
      continue;
    }
    
    // Handle instructions
    const size = estimateInstructionSize(mnem, parsed.operand || '');
    if (size > 0) {
      state.pc += size;
    } else {
      state.errors.push(`Line ${state.lineNumber}: Unknown mnemonic: ${mnem}`);
    }
  }
  
  if (!hasOrg) {
    state.warnings.push('No ORG directive found; code will not be generated');
  }
  
  return {
    symbols: state.symbols,
    lines: parsedLines,
    errors: state.errors,
    warnings: state.warnings
  };
}

function processDirective(state: AssemblerState, line: SourceLine, directive: string): void {
  const evaluator = new ExpressionEvaluator(state.symbols);
  
  switch (directive) {
    case 'ORG': {
      if (!line.operand) {
        state.errors.push(`Line ${state.lineNumber}: ORG requires an operand`);
        return;
      }
      const result = evaluator.evaluate(line.operand);
      if (result.undefined) {
        state.errors.push(`Line ${state.lineNumber}: ORG operand undefined`);
        return;
      }
      state.origin = result.value;
      state.pc = result.value;
      break;
    }
    
    case 'EQU': {
      if (!line.label) {
        state.errors.push(`Line ${state.lineNumber}: EQU requires a label`);
        return;
      }
      if (!line.operand) {
        state.errors.push(`Line ${state.lineNumber}: EQU requires an operand`);
        return;
      }
      const result = evaluator.evaluate(line.operand);
      if (result.undefined) {
        state.errors.push(`Line ${state.lineNumber}: EQU operand undefined`);
        return;
      }
      // Define label with operand value
      try {
        state.symbols.define(line.label, result.value, result.relocatable);
      } catch (err) {
        state.errors.push(`Line ${state.lineNumber}: ${err instanceof Error ? err.message : String(err)}`);
      }
      break;
    }
    
    case 'DB':
    case 'DFB': {
      // Define byte(s)
      const operand = line.operand || '';
      const bytes = operand.split(',').length;
      state.pc += bytes;
      break;
    }
    
    case 'DW':
    case 'DA': {
      // Define word(s)
      const operand = line.operand || '';
      const words = operand.split(',').length;
      state.pc += words * 2;
      break;
    }
    
    case 'ASC':
    case 'DCI': {
      // ASCII string
      if (!line.operand) {
        state.errors.push(`Line ${state.lineNumber}: ${directive} requires string operand`);
        return;
      }
      // Count characters in string
      const match = line.operand.match(/["'](.*)["']/);
      if (match) {
        state.pc += match[1].length;
      }
      break;
    }
    
    case 'DS': {
      // Define storage
      if (!line.operand) {
        state.errors.push(`Line ${state.lineNumber}: DS requires operand`);
        return;
      }
      const result = evaluator.evaluate(line.operand);
      if (!result.undefined) {
        state.pc += result.value;
      }
      break;
    }
    
    case 'EXT':
    case 'ENT':
    case 'REL':
    case 'CHN':
    case 'END':
      // These don't affect PC
      break;
  }
}

function estimateInstructionSize(mnemonic: string, operand: string): number {
  const modes = getSupportedModes(mnemonic);
  if (modes.length === 0) return 0;
  
  // Parse operand to determine addressing mode
  const mode = parseAddressingMode(operand);
  
  if (modes.includes(mode)) {
    return getInstructionSize(mode);
  }
  
  // Default to first supported mode
  return getInstructionSize(modes[0]);
}

function parseAddressingMode(operand: string): AddressingMode {
  const op = operand.trim();
  
  if (op.length === 0) return AddressingMode.IMPLIED;
  if (op === 'A') return AddressingMode.ACCUMULATOR;
  if (op.startsWith('#')) return AddressingMode.IMMEDIATE;
  
  // Indexed indirect: (expr,X)
  if (op.match(/^\([^)]+,X\)$/i)) return AddressingMode.INDIRECT_X;
  
  // Indirect indexed: (expr),Y
  if (op.match(/^\([^)]+\),Y$/i)) return AddressingMode.INDIRECT_Y;
  
  // Indirect: (expr)
  if (op.match(/^\([^)]+\)$/)) return AddressingMode.INDIRECT;
  
  // Absolute/ZP indexed: expr,X or expr,Y
  if (op.match(/,X$/i)) {
    return AddressingMode.ABSOLUTE_X; // Could be zero page, determined later
  }
  if (op.match(/,Y$/i)) {
    return AddressingMode.ABSOLUTE_Y;
  }
  
  // Absolute or zero page (determined by value)
  return AddressingMode.ABSOLUTE;
}
