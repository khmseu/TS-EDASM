# Contributing to TS-EDASM

Thank you for your interest in contributing to TS-EDASM! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js >= 20 LTS
- npm (included with Node.js)
- Git
- TypeScript knowledge
- 6502 assembly knowledge (helpful but not required)

### Getting Started

```bash
# Clone repository
git clone <repository-url>
cd TS-EDASM

# Install dependencies
npm install

# Type check
npm run typecheck

# Run tests
npm test

# Build
npm run build
```

## Project Structure

```text
TS-EDASM/
├── src/
│   ├── assembler/          # Assembler implementation
│   │   ├── index.ts        # Main assembler API
│   │   ├── opcodes.ts      # 6502/65C02 opcode tables
│   │   ├── tokenizer.ts    # Lexical analysis
│   │   ├── symbols.ts      # Symbol table
│   │   ├── expressions.ts  # Expression evaluator
│   │   ├── pass1.ts        # Symbol discovery pass
│   │   ├── pass2.ts        # Code generation pass
│   │   └── types.ts        # Type definitions
│   ├── linker/             # Linker implementation
│   │   ├── index.ts        # Main linker API
│   │   ├── relformat.ts    # REL object format
│   │   └── types.ts        # Type definitions
│   ├── io/                 # File I/O utilities
│   │   └── prodosAttributes.ts
│   ├── cli.ts              # Command-line interface
│   └── index.ts            # Library exports
├── tests/                  # Test suite
│   ├── fixtures/           # Test assembly programs
│   ├── golden.test.ts      # Golden tests
│   ├── integration.test.ts # Integration tests
│   └── assembler.test.ts   # Smoke tests
├── vendor/EdAsm/           # Original EdAsm source
└── docs/                   # Documentation
```

## Coding Standards

### TypeScript Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Always use
- **Line length**: Max 100 characters (flexible)
- **Naming**:
  - `camelCase` for variables and functions
  - `PascalCase` for types and interfaces
  - `UPPER_CASE` for constants

### Example

```typescript
export interface AssemblyOptions {
  sourceName?: string;
  listing?: boolean;
  origin?: number;
}

export function assemble(
  source: string,
  options: AssemblyOptions = {},
): AssemblyResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Implementation...

  return {
    ok: true,
    errors,
    warnings,
    artifacts: {
      objectBytes,
      listing,
      symbols,
    },
  };
}
```

### Comments

- Use `//` for single-line comments
- Use `/** ... */` for documentation comments
- Document public APIs with JSDoc
- Explain complex algorithms inline

```typescript
/**
 * Assemble 6502 source code into object code.
 *
 * @param source - Assembly source code
 * @param options - Assembly options
 * @returns Assembly result with object code and diagnostics
 */
export function assemble(
  source: string,
  options: AssemblyOptions = {},
): AssemblyResult {
  // Implementation...
}
```

## Testing

### Test Categories

1. **Smoke Tests** (`assembler.test.ts`)
   - Quick sanity checks
   - Basic functionality

2. **Golden Tests** (`golden.test.ts`)
   - Exact byte verification
   - All opcodes and modes
   - Edge cases

3. **Integration Tests** (`integration.test.ts`)
   - Real programs
   - End-to-end workflows

### Writing Tests

```typescript
import { describe, it, expect } from "vitest";
import { assemble } from "../src/assembler";

describe("Feature Name", () => {
  it("should do something specific", () => {
    const source = `
      ORG $8000
      LDA #$42
      RTS
    `;

    const result = assemble(source, { origin: 0x8000 });

    expect(result.ok).toBe(true);
    expect(result.artifacts?.objectBytes).toBeDefined();

    const code = result.artifacts!.objectBytes!;
    expect(code[0]).toBe(0xa9); // LDA immediate
    expect(code[1]).toBe(0x42); // operand
    expect(code[2]).toBe(0x60); // RTS
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Specific category
npm run test:golden
npm run test:integration
npm run test:smoke

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Making Changes

### Workflow

1. **Create Branch**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

3. **Verify**

   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

4. **Commit**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and PR**

   ```bash
   git push origin feature/my-feature
   # Create pull request
   ```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `test:` - Test changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `chore:` - Maintenance tasks

Examples:

```text
feat: add support for MACRO directive
fix: correct JMP indirect addressing mode
docs: update CLI usage examples
test: add 65C02 opcode coverage
refactor: simplify expression evaluator
```

## Areas for Contribution

### High Priority

1. **Directive Implementation**
   - MACRO expansion
   - INCLUDE file handling
   - CHN chain file support
   - Conditional assembly (DO/ELSE/FIN)

2. **Testing**
   - Byte-for-byte EdAsm comparison
   - Fuzzing tests
   - Performance benchmarks
   - More edge cases

3. **Linker Enhancements**
   - Map file generation
   - Library support
   - Cross-reference output
   - Complete RLD parsing

4. **Error Messages**
   - More helpful diagnostics
   - Suggestions for fixes
   - Better formatting

### Medium Priority

1. **CLI Features**
   - Interactive mode
   - Color output
   - Progress indicators
   - Watch mode

2. **Optimization**
   - Faster assembly
   - Memory efficiency
   - Parallel linking

3. **Documentation**
   - Tutorial series
   - Video guides
   - Migration from EdAsm guide

### Low Priority

1. **Output Formats**
   - Intel HEX format
   - S-record format
   - Other assembler formats

2. **Tooling**
   - VS Code extension
   - Syntax highlighting
   - Language server

3. **SWEET16**
   - SWEET16 pseudo-instructions
   - SWEET16 interpreter

## Code Review Process

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Type check passes (`npm run typecheck`)
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No debug code or console.logs
- [ ] Branch is up to date with main

### Review Criteria

1. **Correctness**: Does it work as intended?
2. **Tests**: Are there adequate tests?
3. **Documentation**: Is it documented?
4. **Style**: Does it follow conventions?
5. **Performance**: Are there performance concerns?
6. **Breaking Changes**: Are they necessary and documented?

## Debugging Tips

### Enable Verbose Logging

```typescript
// In assembler code
if (options.verbose) {
  console.log(`Pass 1: line ${lineNumber}`, line);
}
```

### Use Listing Output

```bash
# Generate listing to see what's happening
edasm asm program.s -l
cat program.s.obj.lst
```

### Test Incrementally

```bash
# Test small changes quickly
npm test -- golden.test.ts
```

### Use TypeScript Type Checking

```bash
# Catch type errors before running
npm run typecheck
```

## Common Issues

### Type Errors

**Problem**: TypeScript errors about undefined properties

**Solution**: Check that interfaces are updated and all code paths are handled

```typescript
// Bad - might be undefined
const bytes = result.artifacts.objectBytes;

// Good - check first
if (result.artifacts?.objectBytes) {
  const bytes = result.artifacts.objectBytes;
}
```

### Test Failures

**Problem**: Tests fail after changes

**Solution**:

1. Check if expected behavior changed
2. Update test expectations if correct
3. Fix implementation if incorrect

### Build Errors

**Problem**: `npm run build` fails

**Solution**:

1. Run `npm run typecheck` to see specific errors
2. Fix type issues
3. Ensure all imports are correct

## Getting Help

- **Documentation**: See README.md, QUICKREF.md, EXAMPLES.md
- **Issues**: Check existing issues on GitHub
- **Discussions**: Start a discussion for questions
- **Code**: Read the source - it's well-commented!

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Acknowledgments

- Original EdAsm by Shepardson Microsystems
- EdAsm disassembly by Mark Lim
- All contributors to TS-EDASM

---

**Thank you for contributing!** Your efforts help preserve and modernize 6502 development tools.
