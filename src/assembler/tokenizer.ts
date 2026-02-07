// Port of EdAsm tokenizer/lexer
// Based on ASM2.S token scanning logic

export enum TokenType {
  LABEL,
  MNEMONIC,
  DIRECTIVE,
  IDENTIFIER,
  NUMBER,
  STRING,
  CHAR,
  OPERATOR,
  COMMA,
  LPAREN,
  RPAREN,
  HASH,
  EOL,
  EOF,
  SPACE
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export interface SourceLine {
  label?: string;
  mnemonic?: string;
  operand?: string;
  comment?: string;
  lineNumber: number;
  raw: string;
}

// Character classification from ASM1.S CharMap2 table
function isAlpha(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A);
}

function isDigit(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 0x30 && code <= 0x39;
}

function isHexDigit(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (code >= 0x30 && code <= 0x39) ||
         (code >= 0x41 && code <= 0x46) ||
         (code >= 0x61 && code <= 0x66);
}

function isIdentifierStart(ch: string): boolean {
  return isAlpha(ch) || ch === '_' || ch === '.';
}

function isIdentifierChar(ch: string): boolean {
  return isAlpha(ch) || isDigit(ch) || ch === '_' || ch === '.';
}

export class Tokenizer {
  private source: string;
  private pos: number;
  private line: number;
  private column: number;
  
  constructor(source: string) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
  }
  
  private peek(offset = 0): string {
    const index = this.pos + offset;
    return index < this.source.length ? this.source[index] : '';
  }
  
  private advance(): string {
    if (this.pos >= this.source.length) return '';
    const ch = this.source[this.pos++];
    if (ch === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }
  
  private skipWhitespace(): void {
    while (this.pos < this.source.length) {
      const ch = this.peek();
      if (ch !== ' ' && ch !== '\t') break;
      this.advance();
    }
  }
  
  private readIdentifier(): string {
    let ident = '';
    while (this.pos < this.source.length && isIdentifierChar(this.peek())) {
      ident += this.advance();
    }
    return ident;
  }
  
  private readNumber(): string {
    const start = this.pos;
    const startCol = this.column;
    let num = '';
    
    // Check for $ prefix (hex) or % prefix (binary)
    if (this.peek() === '$') {
      num += this.advance();
      while (isHexDigit(this.peek())) {
        num += this.advance();
      }
      return num;
    }
    
    if (this.peek() === '%') {
      num += this.advance();
      while (this.peek() === '0' || this.peek() === '1') {
        num += this.advance();
      }
      return num;
    }
    
    // Decimal number
    while (isDigit(this.peek())) {
      num += this.advance();
    }
    
    return num;
  }
  
  private readString(delimiter: string): string {
    this.advance(); // skip opening quote
    let str = '';
    
    while (this.pos < this.source.length) {
      const ch = this.peek();
      if (ch === delimiter) {
        this.advance(); // skip closing quote
        break;
      }
      if (ch === '\n') break;
      str += this.advance();
    }
    
    return str;
  }
  
  nextToken(): Token | null {
    this.skipWhitespace();
    
    if (this.pos >= this.source.length) {
      return { type: TokenType.EOF, value: '', line: this.line, column: this.column };
    }
    
    const startLine = this.line;
    const startCol = this.column;
    const ch = this.peek();
    
    // End of line
    if (ch === '\n' || ch === '\r') {
      this.advance();
      return { type: TokenType.EOL, value: '\n', line: startLine, column: startCol };
    }
    
    // Comment
    if (ch === ';') {
      let comment = '';
      while (this.pos < this.source.length && this.peek() !== '\n') {
        comment += this.advance();
      }
      return { type: TokenType.EOL, value: comment, line: startLine, column: startCol };
    }
    
    // String literals
    if (ch === '"' || ch === "'") {
      const str = this.readString(ch);
      return { type: TokenType.STRING, value: str, line: startLine, column: startCol };
    }
    
    // Numbers
    if (isDigit(ch) || ch === '$' || ch === '%') {
      const num = this.readNumber();
      return { type: TokenType.NUMBER, value: num, line: startLine, column: startCol };
    }
    
    // Identifiers, mnemonics, directives
    if (isIdentifierStart(ch)) {
      const ident = this.readIdentifier();
      return { type: TokenType.IDENTIFIER, value: ident, line: startLine, column: startCol };
    }
    
    // Operators and punctuation
    switch (ch) {
      case '#':
        this.advance();
        return { type: TokenType.HASH, value: '#', line: startLine, column: startCol };
      case ',':
        this.advance();
        return { type: TokenType.COMMA, value: ',', line: startLine, column: startCol };
      case '(':
        this.advance();
        return { type: TokenType.LPAREN, value: '(', line: startLine, column: startCol };
      case ')':
        this.advance();
        return { type: TokenType.RPAREN, value: ')', line: startLine, column: startCol };
      case '+':
      case '-':
      case '*':
      case '/':
      case '&':
      case '|':
      case '^':
      case '<':
      case '>':
      case '=':
        this.advance();
        return { type: TokenType.OPERATOR, value: ch, line: startLine, column: startCol };
    }
    
    // Unknown character, skip it
    this.advance();
    return this.nextToken();
  }
  
  tokenizeLine(line: string): Token[] {
    const saved = { source: this.source, pos: this.pos, line: this.line, column: this.column };
    this.source = line;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    
    const tokens: Token[] = [];
    let token: Token | null;
    
    while ((token = this.nextToken()) && token.type !== TokenType.EOF) {
      if (token.type !== TokenType.SPACE) {
        tokens.push(token);
      }
      if (token.type === TokenType.EOL) break;
    }
    
    this.source = saved.source;
    this.pos = saved.pos;
    this.line = saved.line;
    this.column = saved.column;
    
    return tokens;
  }
}

// Parse a source line into structured fields following EdAsm conventions
// Format: [label] [mnemonic/directive] [operand] [;comment]
export function parseLine(line: string, lineNumber: number): SourceLine {
  const result: SourceLine = { lineNumber, raw: line };
  
  // Remove CR if present
  let cleanLine = line.replace(/\r$/, '');
  
  // Extract comment
  const commentIdx = cleanLine.indexOf(';');
  if (commentIdx >= 0) {
    result.comment = cleanLine.substring(commentIdx);
    cleanLine = cleanLine.substring(0, commentIdx);
  }
  
  // Trim trailing whitespace
  cleanLine = cleanLine.trimEnd();
  
  if (cleanLine.length === 0) {
    return result;
  }
  
  // Label starts in column 0 (no leading whitespace)
  if (cleanLine[0] !== ' ' && cleanLine[0] !== '\t') {
    const match = cleanLine.match(/^([A-Za-z_\.][A-Za-z0-9_\.]*)/);
    if (match) {
      result.label = match[1];
      cleanLine = cleanLine.substring(match[1].length).trimStart();
    }
  } else {
    cleanLine = cleanLine.trimStart();
    // Special case: if line has form "LABEL EQU value" with leading space,
    // treat first word as label, EQU as mnemonic
    const equMatch = cleanLine.match(/^([A-Za-z_\.][A-Za-z0-9_\.]*)\s+EQU\s+(.+)$/i);
    if (equMatch) {
      result.label = equMatch[1];
      result.mnemonic = 'EQU';
      result.operand = equMatch[2];
      return result;
    }
  }
  
  // Mnemonic/directive
  const mnemonicMatch = cleanLine.match(/^([A-Za-z_\.][A-Za-z0-9_\.]*)/);
  if (mnemonicMatch) {
    result.mnemonic = mnemonicMatch[1];
    cleanLine = cleanLine.substring(mnemonicMatch[1].length).trimStart();
  }
  
  // Rest is operand
  if (cleanLine.length > 0) {
    result.operand = cleanLine;
  }
  
  return result;
}
