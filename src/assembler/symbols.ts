// Symbol table implementation
// Based on EdAsm symbol table structure (linked list of nodes)

export enum SymbolFlags {
  UNDEFINED = 0x80,   // Symbol not yet defined
  UNREFERENCED = 0x01, // Symbol defined but not referenced
  EXTERNAL = 0x10,     // External symbol (for linker)
  RELOCATABLE = 0x08   // Value is relocatable
}

export interface Symbol {
  name: string;
  value: number;
  flags: number;
  defined: boolean;
}

export class SymbolTable {
  private symbols: Map<string, Symbol>;
  
  constructor() {
    this.symbols = new Map();
  }
  
  define(name: string, value: number, relocatable = false): void {
    const existing = this.symbols.get(name.toUpperCase());
    
    if (existing) {
      if (existing.defined) {
        throw new Error(`Symbol ${name} already defined`);
      }
      existing.value = value;
      existing.defined = true;
      existing.flags &= ~SymbolFlags.UNDEFINED;
      if (relocatable) {
        existing.flags |= SymbolFlags.RELOCATABLE;
      }
    } else {
      let flags = SymbolFlags.UNREFERENCED;
      if (relocatable) {
        flags |= SymbolFlags.RELOCATABLE;
      }
      
      this.symbols.set(name.toUpperCase(), {
        name: name.toUpperCase(),
        value,
        flags,
        defined: true
      });
    }
  }
  
  reference(name: string): Symbol {
    const key = name.toUpperCase();
    let symbol = this.symbols.get(key);
    
    if (!symbol) {
      // Forward reference - create undefined symbol
      symbol = {
        name: key,
        value: 0,
        flags: SymbolFlags.UNDEFINED,
        defined: false
      };
      this.symbols.set(key, symbol);
    } else {
      // Mark as referenced
      symbol.flags &= ~SymbolFlags.UNREFERENCED;
    }
    
    return symbol;
  }
  
  lookup(name: string): Symbol | undefined {
    return this.symbols.get(name.toUpperCase());
  }
  
  has(name: string): boolean {
    return this.symbols.has(name.toUpperCase());
  }
  
  getAll(): Symbol[] {
    return Array.from(this.symbols.values());
  }
  
  clear(): void {
    this.symbols.clear();
  }
  
  // Get sorted symbols for listing
  getSorted(): Symbol[] {
    return Array.from(this.symbols.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }
}
