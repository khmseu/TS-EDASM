# EdAsm Source Audit

## Executive Summary

EdAsm is a 3-pass assembler plus linker system written in 6502 assembly for ProDOS. The system includes an editor, debugger, and command interpreter which we will exclude from this port.

## Source Structure

### Include (port to TypeScript)

- **ASM/** - 3-pass 6502 assembler
  - ASM1.S - Pass 3 (symbol table printing/sorting, 2176 lines)
  - ASM2.S - Pass 1 & 2 (tokenization, parsing, code generation)
  - ASM3.S - Support routines, opcode tables, error handling
  - EQUATES.S - Assembler-specific constants
  - EXTERNALS.S - External symbol declarations

- **LINKER/** - Multi-module linker
  - LINK.S - Main linker (4543 lines)
  - EQUATES.S - Linker-specific constants
  - EXTERNALS.S - External declarations
  - equates.aii, linker.aii - Additional interface files

- **COMMONEQUS.S** (247 lines)
  - Shared constants across all modules
  - ASCII codes, file types, zero-page locations
  - ProDOS and Apple II ROM addresses
  - SWEET16 register definitions

### Exclude (not ported)

- **EDITOR/** - Text editor
- **BUGBYTER/** - Debugger
- **EI/** - Command interpreter/shell

## Architecture Analysis

### Assembler Structure (3-pass)

1. **Pass 1**: Symbol discovery, forward reference tracking
2. **Pass 2**: Code generation, object file output
3. **Pass 3**: Symbol table printing/sorting (listing mode)

### Linker Structure

- Reads REL (relocatable) object files
- Resolves external symbols across modules
- Applies relocations
- Outputs BIN, REL, or SYS files
- Optional map file and cross-reference generation

### Key ProDOS Dependencies

- **File types**: TXT ($04), BIN ($06), REL ($FE), SYS ($FF)
- **Attributes**: auxType, file type, timestamps
- **Memory layout**: Specific load addresses ($D000, $6800-$9EFF)
- **I/O buffers**: 1KB buffers at fixed addresses ($A900, $AD00)

### SWEET16 Usage

EdAsm uses SWEET16 pseudo-instructions for 16-bit operations. We'll translate these to native TypeScript operations.

## Translation Strategy

### Module Mapping

```
vendor/EdAsm/EDASM.SRC/
├── COMMONEQUS.S       → src/common/constants.ts
├── ASM/
│   ├── ASM1.S         → src/assembler/pass3.ts (symbol printing)
│   ├── ASM2.S         → src/assembler/pass1.ts, pass2.ts
│   ├── ASM3.S         → src/assembler/opcodes.ts, errors.ts
│   ├── EQUATES.S      → src/assembler/constants.ts
│   └── EXTERNALS.S    → (merged into modules)
└── LINKER/
    ├── LINK.S         → src/linker/linker.ts
    ├── EQUATES.S      → src/linker/constants.ts
    └── EXTERNALS.S    → (merged into modules)
```

### ProDOS Attribute Emulation

Per project requirements, file attributes are stored in sidecar JSON files:

- Format: `.<originalfilename>` (hidden dotfile)
- Content: JSON object with fileType, auxType, timestamps
- Example: `program.obj` → `.program.obj` containing `{"fileType": 254, "auxType": 8192}`

### Data Structure Preservation

- Symbol table: Linked list of nodes (symbol name, flags, value)
- Opcode table: Fixed lookup table indexed by mnemonic hash
- Object format: Header + segments + relocation records + symbol table
- Error messages: Numeric codes with text descriptions

### Key Challenges

1. **Memory model**: 6502 uses fixed memory addresses; TS uses heap objects
2. **Zero-page**: Fast 8-bit addressing; translate to local variables
3. **SWEET16**: Pseudo-16-bit ops; use native TypeScript numbers
4. **I/O**: ProDOS file protocol; use Node.js fs APIs
5. **Control flow**: 6502 branch/jump; use structured TS control flow

## Next Steps

1. Port opcode tables and constants (ASM3.S → opcodes.ts)
2. Implement tokenizer/parser (ASM2.S → pass1.ts)
3. Implement code generator (ASM2.S → pass2.ts)
4. Implement symbol table printer (ASM1.S → pass3.ts)
5. Port linker core (LINK.S → linker.ts)
6. Add golden tests with sample .S files
