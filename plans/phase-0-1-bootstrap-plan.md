## Plan: Bootstrap TypeScript Project with EdAsm Audit

This plan covers Phase 0 (Source Audit) and Phase 1 (TypeScript Skeleton) to establish the foundation for TS-EDASM. We'll clone the original EdAsm source for reference, audit it to identify assembler/linker code paths, scaffold a TypeScript project with proper tooling, and create initial placeholder modules.

**Phases: 5**

1. **Phase 1: Clone and Verify EdAsm Reference**
   - **Objective:** Clone the EdAsm repository into vendor/EdAsm as a local reference for the implementation team
   - **Files/Functions to Modify/Create:** vendor/EdAsm/ (directory)
   - **Tests to Write:** None (verification only)
   - **Steps:**
      1. Create vendor/ directory if it doesn't exist
      2. Clone <https://github.com/markpmlim/EdAsm> into vendor/EdAsm
      3. Verify the repository structure matches expected layout (EDASM.SRC with ASM, LINKER, EDITOR, BUGBYTER, EI folders)

2. **Phase 2: Audit Source and Document Findings**
   - **Objective:** Analyze EdAsm source files to identify assembler/linker code paths and create AUDIT.md documenting the mapping to future TypeScript modules
   - **Files/Functions to Modify/Create:** AUDIT.md
   - **Tests to Write:** None (documentation only)
   - **Steps:**
      1. Examine ASM/ directory files (ASM1.S, ASM2.S, ASM3.S, EQUATES.S, EXTERNALS.S) to identify assembler passes and data structures
      2. Examine LINKER/ directory files (LINK.S, EQUATES.S, EXTERNALS.S) to identify linker logic and relocation handling
      3. Note EDITOR/, BUGBYTER/, and EI/ directories as explicitly excluded components
      4. Review COMMONEQUS.S for shared constants and data structures
      5. Identify ProDOS-specific file attribute usage locations
      6. Create AUDIT.md with findings: module structure, key data structures (symbol tables, opcode tables, relocation records), entry points, and mapping to planned TypeScript modules

3. **Phase 3: Scaffold TypeScript Project Structure**
   - **Objective:** Initialize npm project with TypeScript, vitest testing framework, and proper configuration for Node LTS
   - **Files/Functions to Modify/Create:** package.json, tsconfig.json, vitest.config.ts, .gitignore
   - **Tests to Write:** None (infrastructure only)
   - **Steps:**
      1. Run `npm init -y` to initialize package.json
      2. Install TypeScript as dev dependency: `typescript`, `@types/node`
      3. Install vitest and related tools: `vitest`, `@vitest/ui`
      4. Create tsconfig.json targeting Node LTS (ES2022, CommonJS or ESM)
      5. Create vitest.config.ts with test file patterns
      6. Create .gitignore excluding node_modules, dist, coverage, vendor
      7. Add npm scripts: `build`, `test`, `test:watch`

4. **Phase 4: Create CLI and Library Entry Points**
   - **Objective:** Establish CLI bin entry point and library API structure with subcommands `edasm asm` and `edasm link`
   - **Files/Functions to Modify/Create:** src/cli.ts, src/index.ts, src/assembler/index.ts, src/linker/index.ts
   - **Tests to Write:**
      - test_cli_help_displays
      - test_asm_subcommand_exists
      - test_link_subcommand_exists
      - test_library_api_exports_assemble
      - test_library_api_exports_link
   - **Steps:**
      1. Create src/cli.ts as CLI entry point with argument parsing (use commander or yargs)
      2. Define subcommands: `edasm asm <file>` and `edasm link <files...>`
      3. Create src/index.ts as library API entry point exporting `assemble()` and `link()` functions
      4. Add bin field to package.json pointing to built CLI
      5. Create placeholder src/assembler/index.ts with `assemble()` stub
      6. Create placeholder src/linker/index.ts with `link()` stub
      7. Write tests verifying CLI help output and library API exports
      8. Run tests to see them pass

5. **Phase 5: Create Placeholder Modules with Data Structures**
   - **Objective:** Add initial placeholder modules for assembler and linker with faithful data-structure placeholders based on audit findings
   - **Files/Functions to Modify/Create:**
      - src/assembler/types.ts
      - src/assembler/symbol-table.ts
      - src/assembler/opcode-table.ts
      - src/assembler/tokenizer.ts
      - src/assembler/passes.ts
      - src/linker/types.ts
      - src/linker/object-reader.ts
      - src/linker/relocator.ts
      - src/common/prodos-attributes.ts
   - **Tests to Write:**
      - test_symbol_table_create
      - test_opcode_table_lookup
      - test_tokenizer_placeholder
      - test_object_reader_placeholder
      - test_prodos_attributes_dotfile_format
   - **Steps:**
      1. Create src/assembler/types.ts defining Symbol, OpcodeEntry, Token, AssemblerContext interfaces
      2. Create src/assembler/symbol-table.ts with SymbolTable class (add, lookup, resolve methods)
      3. Create src/assembler/opcode-table.ts with OpcodeTable data structure and lookup logic
      4. Create src/assembler/tokenizer.ts with tokenize() placeholder
      5. Create src/assembler/passes.ts with pass1() and pass2() placeholders
      6. Create src/linker/types.ts defining ObjectRecord, RelocationEntry, LinkerContext interfaces
      7. Create src/linker/object-reader.ts with readObject() placeholder
      8. Create src/linker/relocator.ts with applyRelocations() placeholder
      9. Create src/common/prodos-attributes.ts with functions to read/write ProDOS attributes as JSON dotfiles (`.` + filename)
      10. Write tests for basic structure instantiation and method signatures
      11. Run tests to see them pass

**Open Questions:**

1. CLI argument parser preference: commander, yargs, or minimal custom parser?
2. TypeScript module format: CommonJS or ESM (prefer ESM for modern Node)?
3. Should we include TypeScript source maps in build output?
4. File extension for TypeScript output: .js or .mjs?
5. Initial test fixture strategy: inline test data or external fixture files?
