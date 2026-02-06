# Test Suite

This directory contains the test suite for TS-EDASM.

## Structure

### `assembler.test.ts`

Basic smoke tests for the assembler API covering:

- Simple instruction assembly
- Label and symbol handling
- Error detection
- Data directive processing

### `golden.test.ts`

Comprehensive golden tests validating:

- **Instructions**: All 6502 opcodes and addressing modes
- **65C02 Extensions**: BRA, PHX/PHY, PLX/PLY, STZ, TRB/TSB, etc.
- **Directives**: ORG, EQU, DB, DW, ASC, DCI, DS
- **Labels & Symbols**: Forward/backward references, local labels, undefined symbols
- **Expressions**: Arithmetic, operator precedence, < and > byte extraction
- **Linker**: Multi-module linking, external symbols, relocations
- **Error Handling**: Invalid opcodes, addressing modes, branch range, duplicate labels
- **Listing Output**: Address, hex bytes, source text formatting

### `integration.test.ts`

Integration tests using fixture files:

- Real-world assembly programs
- Multi-module linking scenarios
- Round-trip assembly consistency
- Disassembly verification
- ProDOS calling patterns

### `fixtures/`

Test fixture files containing 6502 assembly source:

#### `hello.s`

Simple "Hello World" program demonstrating:

- ProDOS MLI calls
- String output
- Local labels

#### `allmodes.s`

Comprehensive test of all addressing modes:

- Immediate, Zero Page, Absolute
- Indexed modes (X, Y)
- Indirect modes
- Implied, Accumulator, Relative

#### `65c02.s`

65C02 extended instruction set:

- BRA (branch always)
- PHX/PHY, PLX/PLY (push/pull X/Y)
- STZ (store zero)
- TRB/TSB (test and reset/set bits)
- (Indirect) and JMP (Indirect,X)

#### `multimod1.s` & `multimod2.s`

Multi-module linking test:

- External symbol declarations (EXT)
- Entry point exports (ENT)
- Cross-module function calls
- REL relocatable format

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test golden

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Test Categorization

- **Unit Tests**: `assembler.test.ts` - Test individual functions and modules
- **Golden Tests**: `golden.test.ts` - Validate against known-good outputs
- **Integration Tests**: `integration.test.ts` - Test complete workflows
- **Fixtures**: `fixtures/*.s` - Real assembly programs for testing

## Adding New Tests

1. **For new opcodes/features**: Add to `golden.test.ts` with expected bytes
2. **For real programs**: Create fixture in `fixtures/` and add integration test
3. **For edge cases**: Add to appropriate describe() block in `golden.test.ts`
4. **For error handling**: Add to "Error Handling" section

## Test Philosophy

- **Golden tests** use exact byte comparisons to ensure faithful 6502 encoding
- **Integration tests** verify the assembler works with real-world programs
- **Smoke tests** catch basic regressions quickly
- **Fixtures** provide reusable test cases for multiple test suites

## Known Test Limitations

Some features are partially tested or not yet implemented:

- MACRO expansion
- Conditional assembly (DO/ELSE/FIN)
- INCLUDE file handling
- CHN directive
- Complete 65C02 opcode validation
- Linker map file generation
- Library linking

These will be addressed in Phase 4-5 of development.
