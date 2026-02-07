// Expression evaluator for operands
// Supports numeric expressions with operators: + - * / & | ^

import { SymbolTable, type Symbol } from './symbols.js';

export interface ExpressionResult {
  value: number;
  relocatable: boolean;
  external: boolean;
  undefined: boolean;
}

export class ExpressionEvaluator {
  private symbols: SymbolTable;
  private currentPC?: number;
  private lastGlobalLabel?: string;
  
  constructor(symbols: SymbolTable, currentPC?: number, lastGlobalLabel?: string) {
    this.symbols = symbols;
    this.currentPC = currentPC;
    this.lastGlobalLabel = lastGlobalLabel;
  }
  
  setCurrentPC(pc: number): void {
    this.currentPC = pc;
  }
  
  setLastGlobalLabel(label: string): void {
    this.lastGlobalLabel = label;
  }
  
  evaluate(expr: string): ExpressionResult {
    // Remove whitespace
    const clean = expr.trim();
    
    if (clean.length === 0) {
      return { value: 0, relocatable: false, external: false, undefined: true };
    }

    // Handle current PC (*) 
    if (clean === '*') {
      return { 
        value: this.currentPC ?? 0, 
        relocatable: true, 
        external: false, 
        undefined: this.currentPC === undefined 
      };
    }
    
    // Try to parse as simple number first
    const num = this.parseNumber(clean);
    if (num !== null) {
      return { value: num, relocatable: false, external: false, undefined: false };
    }
    
    // Try as symbol
    if (this.isSimpleSymbol(clean)) {
      return this.evaluateSymbol(clean);
    }
    
    // Parse expression with operators
    return this.evaluateExpression(clean);
  }
  
  private parseNumber(str: string): number | null {
    // Hex: $XXXX
    if (str.startsWith('$')) {
      const hex = str.substring(1);
      if (/^[0-9A-Fa-f]+$/.test(hex)) {
        return parseInt(hex, 16);
      }
      return null;
    }
    
    // Binary: %XXXXXXXX
    if (str.startsWith('%')) {
      const bin = str.substring(1);
      if (/^[01]+$/.test(bin)) {
        return parseInt(bin, 2);
      }
      return null;
    }
    
    // Decimal
    if (/^\d+$/.test(str)) {
      return parseInt(str, 10);
    }
    
    return null;
  }
  
  private isSimpleSymbol(str: string): boolean {
    return /^[A-Za-z_\.][A-Za-z0-9_\.]*$/.test(str);
  }
  
  private evaluateSymbol(name: string): ExpressionResult {
    let symbolName = name;
    // Handle local labels (starting with '.')
    if (symbolName.startsWith('.') && this.lastGlobalLabel) {
      symbolName = this.lastGlobalLabel + symbolName;
    }
    const symbol = this.symbols.reference(symbolName);
    
    return {
      value: symbol.value,
      relocatable: (symbol.flags & 0x08) !== 0,
      external: (symbol.flags & 0x10) !== 0,
      undefined: !symbol.defined
    };
  }
  
  private evaluateExpression(expr: string): ExpressionResult {
    // Simple recursive descent parser for expressions
    // Handles: term ((+|-) term)*
    
    let pos = 0;
    
    const parseChar = (ch: string): boolean => {
      if (pos < expr.length && expr[pos] === ch) {
        pos++;
        return true;
      }
      return false;
    };
    
    const skipWhitespace = (): void => {
      while (pos < expr.length && (expr[pos] === ' ' || expr[pos] === '\t')) {
        pos++;
      }
    };
    
    const parsePrimary = (): ExpressionResult => {
      skipWhitespace();
      
      // Number
      let numEnd = pos;
      if (expr[pos] === '$') {
        numEnd++;
        while (numEnd < expr.length && /[0-9A-Fa-f]/.test(expr[numEnd])) {
          numEnd++;
        }
      } else if (expr[pos] === '%') {
        numEnd++;
        while (numEnd < expr.length && /[01]/.test(expr[numEnd])) {
          numEnd++;
        }
      } else if (/\d/.test(expr[pos])) {
        while (numEnd < expr.length && /\d/.test(expr[numEnd])) {
          numEnd++;
        }
      }
      
      if (numEnd > pos) {
        const numStr = expr.substring(pos, numEnd);
        pos = numEnd;
        const value = this.parseNumber(numStr);
        return { value: value ?? 0, relocatable: false, external: false, undefined: value === null };
      }
      
      // Symbol
      if (/[A-Za-z_\.]/.test(expr[pos])) {
        let symEnd = pos;
        while (symEnd < expr.length && /[A-Za-z0-9_\.]/.test(expr[symEnd])) {
          symEnd++;
        }
        const symName = expr.substring(pos, symEnd);
        pos = symEnd;
        return this.evaluateSymbol(symName);
      }
      
      // Current PC (*)
      if (parseChar('*')) {
        return { 
          value: this.currentPC ?? 0, 
          relocatable: true, 
          external: false, 
          undefined: this.currentPC === undefined 
        };
      }
      
      // Parenthesized expression
      if (parseChar('(')) {
        const result = parseAddSub();
        parseChar(')');
        return result;
      }
      
      return { value: 0, relocatable: false, external: false, undefined: true };
    };
    
    const parseUnary = (): ExpressionResult => {
      skipWhitespace();
      
      if (parseChar('+')) {
        return parseUnary();
      }
      
      if (parseChar('-')) {
        const result = parseUnary();
        return { ...result, value: -result.value };
      }
      
      if (parseChar('<')) {
        // Low byte
        const result = parseUnary();
        return { ...result, value: result.value & 0xFF };
      }
      
      if (parseChar('>')) {
        // High byte
        const result = parseUnary();
        return { ...result, value: (result.value >> 8) & 0xFF };
      }
      
      return parsePrimary();
    };
    
    const parseMulDiv = (): ExpressionResult => {
      let left = parseUnary();
      
      while (true) {
        skipWhitespace();
        if (parseChar('*')) {
          const right = parseUnary();
          left = {
            value: left.value * right.value,
            relocatable: left.relocatable || right.relocatable,
            external: left.external || right.external,
            undefined: left.undefined || right.undefined
          };
        } else if (parseChar('/')) {
          const right = parseUnary();
          if (right.value === 0) {
            left = { value: 0, relocatable: false, external: false, undefined: true };
          } else {
            left = {
              value: Math.floor(left.value / right.value),
              relocatable: left.relocatable || right.relocatable,
              external: left.external || right.external,
              undefined: left.undefined || right.undefined
            };
          }
        } else {
          break;
        }
      }
      
      return left;
    };
    
    const parseAddSub = (): ExpressionResult => {
      let left = parseMulDiv();
      
      while (true) {
        skipWhitespace();
        if (parseChar('+')) {
          const right = parseMulDiv();
          left = {
            value: left.value + right.value,
            relocatable: left.relocatable || right.relocatable,
            external: left.external || right.external,
            undefined: left.undefined || right.undefined
          };
        } else if (parseChar('-')) {
          const right = parseMulDiv();
          left = {
            value: left.value - right.value,
            relocatable: left.relocatable !== right.relocatable,
            external: left.external || right.external,
            undefined: left.undefined || right.undefined
          };
        } else {
          break;
        }
      }
      
      return left;
    };
    
    return parseAddSub();
  }
}
