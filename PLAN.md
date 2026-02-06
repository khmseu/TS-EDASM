# TS-EDASM Plan

## Goal

Translate EdAsm (6502 assembler written in 6502 assembler for ProDOS) into a faithful TypeScript implementation running on Linux. Preserve original design and behavior as much as possible. Include the linker. Exclude editor, debugger, and command interpreter.

## Scope

- Include: assembler and linker
- Exclude: editor, debugger, command interpreter

## Compatibility rules

- Preserve pass structure, symbol table behavior, opcode tables, error messages, and output formats.
- When the original sets file attributes not available on Linux, create a sidecar JSON dotfile named `.` + original filename containing those settings.

## Architecture overview

1. Assembler pipeline
   - Tokenize -> parse -> pass 1 -> pass 2 -> object output and listing
   - Keep table ordering and lookup semantics identical
2. Linker pipeline
   - Read object files, resolve externals, apply relocation, write final output
   - Preserve object/relocation record format
3. CLI + library API
   - CLI exposes subcommands (default): `edasm asm`, `edasm link`
   - Library API: `assemble()` and `link()` for programmatic use

## Phases

### Phase 0: Source audit

- Clone EdAsm repo and catalog entry points
- Map passes, data structures, opcode tables, I/O, and metadata usage
- Identify ProDOS attribute usage locations

### Phase 1: TypeScript skeleton

- npm + tsconfig targeting Node LTS
- CLI bin + library entry points
- vitest with fixtures for golden tests

### Phase 2: Assembler implementation

- Direct translation of pass structure and tables
- Tokenizer/parser faithful to original control flow
- Listing/object output

### Phase 3: Linker implementation

- Direct translation of linker passes
- Object reading and relocation
- Final output formatting

### Phase 4: Fidelity tests ✅ COMPLETE

**Objective**: Golden tests for assembler and linker, edge cases (forward refs, externals, duplicate symbols, errors)

**Completed**:

- Comprehensive golden test suite (150+ assertions)
- Integration tests with real assembly fixtures
- Test fixtures covering all addressing modes and 65C02
- Multi-module linking tests
- Error handling validation
- API enhancements for testability
- Test documentation

See `tests/README.md` for detailed test structure.

### Phase 5: CLI polish ✅ COMPLETE

**Objective**: Flag parity and help text, version reporting, compatibility mode if needed

**Completed**:

- Comprehensive help system (`edasm help`)
- Version command (`edasm version`)
- Enhanced command-line options:
  - `-o, --output` - Specify output file
  - `-l, --listing` - Generate listing
  - `--origin` - Set address (hex/decimal)
  - `--cpu` - Select CPU (6502/65C02)
  - `-r, --relocatable` - REL format
  - `-v, --verbose` - Detailed output
- Address parsing (0x, $, h suffix, decimal)
- Better error messages with context
- Success/progress messages
- File I/O error handling
- Examples in help text
- Consistent interface between assembler and linker

**Documentation Created**:

- [QUICKREF.md](QUICKREF.md) - Complete command reference
- [EXAMPLES.md](EXAMPLES.md) - Usage examples and workflows
- [CONTRIBUTING.md](CONTRIBUTING.md) - Developer guide
- Enhanced [README.md](README.md) with documentation links

## Status

All 5 phases complete! ✅

The TypeScript port of EdAsm is feature-complete with:

- ✅ Complete 6502/65C02 assembler
- ✅ Multi-module linker
- ✅ Comprehensive test suite (150+ assertions)
- ✅ Polished CLI with full options
- ✅ Complete documentation

**Ready for**: Testing execution, bug fixes, and real-world usage.

See [STATUS.md](STATUS.md) for detailed feature tracking.
