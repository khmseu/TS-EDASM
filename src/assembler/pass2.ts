// Pass 2: Code generation
// Port of EdAsm pass 2 logic from ASM2.S

import { SymbolTable } from './symbols';
import { type SourceLine } from './tokenizer';
import { ExpressionEvaluator } from './expressions';
import { lookupOpcode, getInstructionSize, AddressingMode } from './opcodes';

export interface Pass2Options {
  listing?: boolean;
  relocatable?: boolean;
  cpu?: '6502' | '65C02';
}

export interface Pass2Result {
  objectCode: Uint8Array;
  errors: string[];
  warnings: string[];
  listing?: string;
}

interface CodeBuffer {
  data: number[];
  pc: number;
  origin: number;
}

export function pass2(
  lines: SourceLine[],
  symbols: SymbolTable,
  options: Pass2Options = {}
): Pass2Result {
  const buffer: CodeBuffer = {
    data: [],
    pc: 0,
    origin: 0
  };
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const listingLines: string[] = [];
  const evaluator = new ExpressionEvaluator(symbols);
  
  for (const line of lines) {
    let listingLine = '';
    
    // Set current PC for evaluator (used for * in expressions)
    evaluator.setCurrentPC(buffer.pc);
    
    // Format: ADDR  CODE       LABEL  MNEMONIC OPERAND
    const addrStr = buffer.pc.toString(16).toUpperCase().padStart(4, '0');
    
    if (!line.mnemonic) {
      if (options.listing) {
        listingLines.push(`                ${line.raw}`);
      }
      continue;
    }
    
    const mnem = line.mnemonic.toUpperCase();
    
    // Handle directives
    if (isDirective(mnem)) {
      const bytesGenerated = processDirective(buffer, line, mnem, evaluator, errors);
      
      if (options.listing) {
        let codeStr = '';
        if (bytesGenerated.length > 0) {
          codeStr = bytesGenerated.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
        }
        listingLines.push(`${addrStr}  ${codeStr.padEnd(12)}  ${line.raw}`);
      }
      continue;
    }
    
    // Handle instructions
    const result = generateInstruction(buffer, line, mnem, evaluator);
    
    if (result.error) {
      errors.push(`Line ${line.lineNumber}: ${result.error}`);
    }
    
    if (result.bytes) {
      buffer.data.push(...result.bytes);
      buffer.pc += result.bytes.length;
    }
    
    if (options.listing && result.bytes) {
      const codeStr = result.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
      listingLines.push(`${addrStr}  ${codeStr.padEnd(12)}  ${line.raw}`);
    }
  }
  
  const objectCode = new Uint8Array(buffer.data);
  const listing = options.listing ? listingLines.join('\n') : undefined;
  
  // Define the special '*' symbol to be the current PC
  symbols.define('*', buffer.pc, true);
  
  return {
    objectCode,
    errors,
    warnings,
    listing
  };
}

function isDirective(mnem: string): boolean {
  const directives = ['ORG', 'EQU', 'DB', 'DFB', 'DW', 'DA', 'ASC', 'DCI', 'DS', 'END'];
  return directives.includes(mnem);
}

function processDirective(
  buffer: CodeBuffer,
  line: SourceLine,
  directive: string,
  evaluator: ExpressionEvaluator,
  errors: string[]
): number[] {
  const generated: number[] = [];
  
  switch (directive) {
    case 'ORG': {
      if (!line.operand) return generated;
      const result = evaluator.evaluate(line.operand);
      if (!result.undefined) {
        buffer.origin = result.value;
        buffer.pc = result.value;
      }
      break;
    }
    
    case 'DB':
    case 'DFB': {
      if (!line.operand) return generated;
      const values = line.operand.split(',').map(v => v.trim());
      for (const val of values) {
        const result = evaluator.evaluate(val);
        if (result.undefined) {
          errors.push(`Line ${line.lineNumber}: Undefined value in ${directive}`);
          generated.push(0);
        } else {
          generated.push(result.value & 0xFF);
        }
        buffer.data.push(generated[generated.length - 1]);
        buffer.pc++;
      }
      break;
    }
    
    case 'DW':
    case 'DA': {
      if (!line.operand) return generated;
      const values = line.operand.split(',').map(v => v.trim());
      for (const val of values) {
        const result = evaluator.evaluate(val);
        if (result.undefined) {
          errors.push(`Line ${line.lineNumber}: Undefined value in ${directive}`);
          generated.push(0, 0);
        } else {
          const lo = result.value & 0xFF;
          const hi = (result.value >> 8) & 0xFF;
          generated.push(lo, hi);
        }
        buffer.data.push(generated[generated.length - 2]);
        buffer.data.push(generated[generated.length - 1]);
        buffer.pc += 2;
      }
      break;
    }
    
    case 'ASC': {
      if (!line.operand) return generated;
      const match = line.operand.match(/["'](.*)["']/);
      if (match) {
        const str = match[1];
        for (let i = 0; i < str.length; i++) {
          const byte = str.charCodeAt(i) & 0x7F;
          generated.push(byte);
          buffer.data.push(byte);
          buffer.pc++;
        }
      }
      break;
    }
    
    case 'DCI': {
      // Inverted last character
      if (!line.operand) return generated;
      const match = line.operand.match(/["'](.*)["']/);
      if (match) {
        const str = match[1];
        for (let i = 0; i < str.length; i++) {
          let byte = str.charCodeAt(i) & 0x7F;
          if (i === str.length - 1) {
            byte |= 0x80; // Set high bit on last char
          }
          generated.push(byte);
          buffer.data.push(byte);
          buffer.pc++;
        }
      }
      break;
    }
    
    case 'DS': {
      if (!line.operand) return generated;
      const result = evaluator.evaluate(line.operand);
      if (!result.undefined) {
        for (let i = 0; i < result.value; i++) {
          generated.push(0);
          buffer.data.push(0);
          buffer.pc++;
        }
      }
      break;
    }
  }
  
  return generated;
}

interface InstructionResult {
  bytes?: number[];
  error?: string;
}

function generateInstruction(
  buffer: CodeBuffer,
  line: SourceLine,
  mnemonic: string,
  evaluator: ExpressionEvaluator
): InstructionResult {
  const operand = line.operand || '';
  
  // Check if this is a branch instruction - these ALWAYS use relative addressing
  const branchMnemonics = /^(BEQ|BNE|BCC|BCS|BMI|BPL|BVC|BVS)$/i;
  let mode: AddressingMode | null;
  
  if (branchMnemonics.test(mnemonic)) {
    mode = AddressingMode.RELATIVE;
  } else {
    mode = determineAddressingMode(operand, evaluator, mnemonic);
  }
  
  if (!mode) {
    return { error: `Cannot determine addressing mode for: ${operand}` };
  }
  
  const opcode = lookupOpcode(mnemonic, mode);
  if (opcode === null) {
    return { error: `Invalid addressing mode ${mode} for mnemonic ${mnemonic}` };
  }
  
  const bytes: number[] = [opcode];
  const size = getInstructionSize(mode);
  
  // Generate operand bytes
  if (size > 1) {
    const operandValue = extractOperandValue(operand, mode, evaluator);
    
    if (operandValue.error) {
      return { error: operandValue.error };
    }
    
    const value = operandValue.value!;
    
    if (mode === AddressingMode.RELATIVE) {
      // Branch offset: target - (PC + 2)
      // 6502 branches are relative to PC after fetching both opcode and offset bytes
      const offset = value - (buffer.pc + 2);
      if (offset < -128 || offset > 127) {
        return { error: `Branch out of range: ${offset}` };
      }
      bytes.push(offset & 0xFF);
    } else if (size === 2) {
      bytes.push(value & 0xFF);
    } else if (size === 3) {
      bytes.push(value & 0xFF);
      bytes.push((value >> 8) & 0xFF);
    }
  }
  
  return { bytes };
}

function determineAddressingMode(operand: string, evaluator: ExpressionEvaluator, mnemonic: string = ''): AddressingMode | null {
  const op = operand.trim();
  
  if (op.length === 0) return AddressingMode.IMPLIED;
  if (op === 'A') return AddressingMode.ACCUMULATOR;
  if (op.startsWith('#')) return AddressingMode.IMMEDIATE;
  
  if (op.match(/^\([^)]+,X\)$/i)) return AddressingMode.INDIRECT_X;
  if (op.match(/^\([^)]+\),Y$/i)) return AddressingMode.INDIRECT_Y;
  if (op.match(/^\([^)]+\)$/)) {
    // Could be INDIRECT or INDIRECT_ZP
    return AddressingMode.INDIRECT;
  }
  
  if (op.match(/,X$/i)) {
    // Determine if zero page or absolute
    const expr = op.replace(/,X$/i, '').trim();
    const result = evaluator.evaluate(expr);
    if (!result.undefined && result.value < 0x100) {
      return AddressingMode.ZERO_PAGE_X;
    }
    return AddressingMode.ABSOLUTE_X;
  }
  
  if (op.match(/,Y$/i)) {
    const expr = op.replace(/,Y$/i, '').trim();
    const result = evaluator.evaluate(expr);
    if (!result.undefined && result.value < 0x100) {
      return AddressingMode.ZERO_PAGE_Y;
    }
    return AddressingMode.ABSOLUTE_Y;
  }
  
  // Absolute or zero page
  const result = evaluator.evaluate(op);
  if (!result.undefined && result.value < 0x100) {
    return AddressingMode.ZERO_PAGE;
  }
  
  return AddressingMode.ABSOLUTE;
}

// List of branch mnemonics that use relative addressing
const BRANCH_MNEMONICS = ['BEQ', 'BNE', 'BCC', 'BCS', 'BMI', 'BPL', 'BVC', 'BVS'];

function isBranchInstruction(mnemonic: string): boolean {
  return BRANCH_MNEMONICS.includes(mnemonic.toUpperCase());
}

function extractOperandValue(
  operand: string,
  mode: AddressingMode,
  evaluator: ExpressionEvaluator
): { value?: number; error?: string } {
  let expr = operand.trim();
  
  // Strip addressing mode syntax
  if (mode === AddressingMode.IMMEDIATE) {
    expr = expr.substring(1); // Remove #
  } else if (mode === AddressingMode.INDIRECT_X) {
    expr = expr.replace(/^\(|\,X\)$/gi, '');
  } else if (mode === AddressingMode.INDIRECT_Y) {
    expr = expr.replace(/^\(|\),Y$/gi, '');
  } else if (mode === AddressingMode.INDIRECT || mode === AddressingMode.INDIRECT_ZP) {
    expr = expr.replace(/^\(|\)$/g, '');
  } else if (mode === AddressingMode.ZERO_PAGE_X || mode === AddressingMode.ABSOLUTE_X) {
    expr = expr.replace(/,X$/i, '');
  } else if (mode === AddressingMode.ZERO_PAGE_Y || mode === AddressingMode.ABSOLUTE_Y) {
    expr = expr.replace(/,Y$/i, '');
  }
  
  const result = evaluator.evaluate(expr);
  
  if (result.undefined) {
    return { error: `Undefined symbol in expression: ${expr}` };
  }
  
  return { value: result.value };
}
