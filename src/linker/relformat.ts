// REL object file format handler
// Based on EdAsm REL format specification

export interface RELHeader {
  codeLength: number;      // Length of code segment
  entryPoints: string[];   // ENT symbols
  externalRefs: string[];  // EXT symbols
}

export interface RelocationEntry  {
  offset: number;          // Offset in code where relocation applies
  type: 'byte' | 'word';   // Size of relocation
  symbol?: string;         // Symbol name if external reference
  relative: boolean;       // True if PC-relative
}

export interface RELObject {
  header: RELHeader;
  code: Uint8Array;
  relocations: RelocationEntry[];
  symbols: Map<string, number>; // Symbol name -> value
}

export function parseREL(data: Uint8Array): RELObject {
  let pos = 0;
  
  // Read header (2-byte placeholder at start)
  const codeLength = data[pos] | (data[pos + 1] << 8);
  pos += 2;
  
  const code = data.slice(pos, pos + codeLength);
  pos += codeLength;
  
  // Parse relocation dictionary and symbol table
  // (Simplified for now - full implementation requires parsing RLD format)
  const relocations: RelocationEntry[] = [];
  const symbols = new Map<string, number>();
  const entryPoints: string[] = [];
  const externalRefs: string[] = [];
  
  return {
    header: { codeLength, entryPoints, externalRefs },
    code,
    relocations,
    symbols
  };
}

export function buildREL(obj: RELObject): Uint8Array {
  const parts: number[] = [];
  
  // Header: 2-byte code length placeholder
  const codeLen = obj.code.length;
  parts.push(codeLen & 0xFF);
  parts.push((codeLen >> 8) & 0xFF);
  
  // Code segment
  for (let i = 0; i < obj.code.length; i++) {
    parts.push(obj.code[i]);
  }
  
  // Relocation dictionary (RLD)
  // Format: type byte, offset word, [symbol name for EXT refs]
  for (const reloc of obj.relocations) {
    // Type byte: bit 7 = word/byte, bit 6 = relative, bits 0-5 = flags
    let typeByte = reloc.type === 'word' ? 0x80 : 0x00;
    if (reloc.relative) typeByte |= 0x40;
    if (reloc.symbol) typeByte |= 0x01; // External reference
    
    parts.push(typeByte);
    parts.push(reloc.offset & 0xFF);
    parts.push((reloc.offset >> 8) & 0xFF);
    
    if (reloc.symbol) {
      // Write symbol name (length-prefixed)
      const nameBytes = Array.from(reloc.symbol).map(c => c.charCodeAt(0));
      parts.push(nameBytes.length);
      parts.push(...nameBytes);
    }
  }
  
  // Symbol table
  // Format: name (DCI), flags, value (word)
  for (const [name, value] of obj.symbols.entries()) {
    const nameBytes = Array.from(name).map((c, i) => {
      const code = c.charCodeAt(0);
      // DCI format: high bit set on last character
      return i === name.length - 1 ? code | 0x80 : code;
    });
    parts.push(...nameBytes);
    parts.push(0x00); // Flags
    parts.push(value & 0xFF);
    parts.push((value >> 8) & 0xFF);
  }
  
  return new Uint8Array(parts);
}
