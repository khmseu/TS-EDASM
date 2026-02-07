## Plan: Port Assembler Core from EdAsm ASM Module

Port the 3-pass 6502 assembler core from vendor/EdAsm/EDASM.SRC/ASM/ to TypeScript, preserving the original table structures, lookup semantics, and control flow while adapting to modern TypeScript idioms and Node.js APIs.

**Phases: 8**

1. **Phase 1: Port Constants and Flags**
   - **Objective:** Extract and port all assembler constants, flags, and enumerations from EQUATES.S and COMMONEQUS.S to TypeScript
   - **Files/Functions to Modify/Create:**
     - src/assembler/constants.ts
     - src/common/constants.ts (if needed)
   - **Tests to Write:**
     - test_symbol_flags_defined
     - test_file_type_constants_defined
     - test_zero_page_locations_defined
     - test_assembled_flags_bitwise_operations
   - **Steps:**
     1. Read vendor/EdAsm/EDASM.SRC/ASM/EQUATES.S extracting all EQU declarations
     2. Read vendor/EdAsm/EDASM.SRC/COMMONEQUS.S for shared constants
     3. Create TypeScript enums for symbol flags (undefined, unrefd, relative, external, entry, macro, etc.)
     4. Create constants for file types (TXT, BIN, REL, SYS), addressing modes, and zero-page usage
     5. Add inline comments referencing original source locations (e.g., "// EQUATES.S line 32")
     6. Write tests validating constant values and bitwise flag operations

2. **Phase 2: Port Mnemonic and Opcode Tables**
   - **Objective:** Extract opcode table, mnemonic table, addressing mode table, and instruction length table from ASM3.S and port to TypeScript with proper typing
   - **Files/Functions to Modify/Create:**
     - src/assembler/opcodes.ts (OpcodeTable, MnemonicTable, AddressingModeTable)
     - src/assembler/types.ts (AddressingMode enum, Opcode interface, Mnemonic interface)
   - **Tests to Write:**
     - test_opcode_lookup_brk
     - test_opcode_lookup_adc_immediate
     - test_opcode_lookup_lda_absolute
     - test_mnemonic_hash_lookup
     - test_addressing_mode_resolution
     - test_instruction_length_calculation
   - **Steps:**
     1. Search ASM3.S for opcode table definitions (likely structured as data tables near end of file)
     2. Identify mnemonic lookup mechanism (hash-based or sequential?)
     3. Create TypeScript interfaces: Opcode { mnemonic: string, addressingMode: AddressingMode, byte: number, length: number, cycles?: number }
     4. Port addressing mode enumeration (implied, immediate, zeroPage, zeroPageX, zeroPageY, absolute, absoluteX, absoluteY, indirect, indexedIndirect, indirectIndexed)
     5. Create opcode lookup function preserving original table order and lookup semantics
     6. Write tests for common opcodes (BRK, ADC, SBC, LDA, STA, JMP, JSR, etc.)

3. **Phase 3: Port Symbol Table Structure**
   - **Objective:** Implement symbol table data structure from ASM2.S, supporting linked list of symbol entries with flags, values, and forward reference tracking
   - **Files/Functions to Modify/Create:**
     - src/assembler/symbolTable.ts (SymbolTable class, SymbolEntry interface)
     - src/assembler/types.ts (update with SymbolEntry, SymbolFlags)
   - **Tests to Write:**
     - test_symbol_table_create_empty
     - test_add_symbol_new_entry
     - test_add_symbol_duplicate_error
     - test_lookup_symbol_found
     - test_lookup_symbol_not_found
     - test_symbol_flags_undefined_unrefd
     - test_forward_reference_tracking
   - **Steps:**
     1. Read ASM2.S sections dealing with symbol table creation (around DoPass1)
     2. Design SymbolEntry interface: { name: string, flags: number, value: number, next?: SymbolEntry }
     3. Implement SymbolTable class with methods: add(), lookup(), markDefined(), markReferenced()
     4. Preserve flag byte semantics (undefined=$80, unrefd=$40, relative=$20, external=$10, entry=$08, etc.)
     5. Implement forward reference tracking for two-pass resolution
     6. Write tests for symbol operations and flag manipulation

4. **Phase 4: Port Pass 1 - Symbol Discovery and Tokenization**
   - **Objective:** Port Pass 1 logic from ASM2.S (DoPass1/Pass1Lup) to scan source lines, extract labels, build symbol table, and track forward references
   - **Files/Functions to Modify/Create:**
     - src/assembler/pass1.ts (Pass1 class with run() method)
     - src/assembler/scanner.ts (tokenize source lines)
   - **Tests to Write:**
     - test_pass1_empty_source
     - test_pass1_single_label_definition
     - test_pass1_opcode_without_label
     - test_pass1_forward_reference
     - test_pass1_org_directive
     - test_pass1_equ_directive
     - test_pass1_comment_line_ignored
     - test_pass1_symbol_table_populated
   - **Steps:**
     1. Read ASM2.S DoPass1 section (around line 1020) and Pass1Lup (around line 1031)
     2. Implement source line scanner to identify label field, mnemonic field, operand field
     3. Implement label processing: if label exists, add to symbol table with current PC value
     4. Implement PC advancement based on instruction length estimation
     5. Handle ORG and EQU directives during pass 1
     6. Track forward references (symbols referenced before defined)
     7. Write tests with minimal 6502 assembly snippets

5. **Phase 5: Port Expression Evaluator**
   - **Objective:** Port expression evaluation logic from ASM3.S (EvalOprnd and related functions) to parse and evaluate operands, supporting numeric literals, symbols, and operators
   - **Files/Functions to Modify/Create:**
     - src/assembler/expression.ts (evaluateExpression function)
   - **Tests to Write:**
     - test_eval_decimal_literal
     - test_eval_hex_literal
     - test_eval_binary_literal
     - test_eval_symbol_reference
     - test_eval_addition_expression
     - test_eval_subtraction_expression
     - test_eval_forward_reference_pass1
     - test_eval_forward_reference_resolved_pass2
   - **Steps:**
     1. Read ASM3.S EvalOprnd function (around line 20 in the file) to understand operand parsing
     2. Implement literal parsing (decimal, $hex, %binary)
     3. Implement symbol reference with symbol table lookup
     4. Support arithmetic operators (+, -, \*, /)
     5. Handle forward references gracefully (mark as undefined in pass 1)
     6. Return expression result with flags (relative, external, undefined)
     7. Write tests for various expression formats

6. **Phase 6: Port Pass 2 - Code Generation**
   - **Objective:** Port Pass 2 logic from ASM2.S (DoPass2/Pass2Lup) to generate machine code bytes, resolve addressing modes, and emit object code
   - **Files/Functions to Modify/Create:**
     - src/assembler/pass2.ts (Pass2 class with run() method)
     - src/assembler/codeGenerator.ts (emit functions)
   - **Tests to Write:**
     - test_pass2_simple_implied_mode
     - test_pass2_immediate_mode
     - test_pass2_zero_page_mode
     - test_pass2_absolute_mode
     - test_pass2_indexed_modes
     - test_pass2_branch_instructions
     - test_pass2_jmp_jsr_instructions
     - test_pass2_forward_reference_resolution
     - test_pass2_generated_code_matches_expected
   - **Steps:**
     1. Read ASM2.S DoPass2 section (around line 1169) and Pass2Lup (around line 1188)
     2. Implement code generation for each addressing mode
     3. Resolve symbols to values using symbol table
     4. Emit opcode byte followed by operand bytes (1 or 2 bytes depending on addressing mode)
     5. Handle branch instruction relative offset calculation
     6. Generate error if forward reference still undefined after pass 2
     7. Write tests comparing generated bytes against expected opcodes

7. **Phase 7: Port Error Handling**
   - **Objective:** Port error handling mechanism from ASM3.S (RegAsmEW and error message table) to collect and report assembler errors with line numbers
   - **Files/Functions to Modify/Create:**
     - src/assembler/errors.ts (AsmError class, ErrorCollector class)
   - **Tests to Write:**
     - test_error_undefined_opcode
     - test_error_invalid_operand
     - test_error_undefined_symbol
     - test_error_duplicate_label
     - test_error_line_number_tracking
     - test_multiple_errors_collected
   - **Steps:**
     1. Read ASM3.S error handling sections (RegAsmEW function)
     2. Create AsmError class with properties: code, message, lineNumber, severity
     3. Create ErrorCollector to accumulate errors during assembly
     4. Define error codes matching original (0x04=undefined opcode, 0x0C=equate error, 0x0E=invalid identifier, etc.)
     5. Associate errors with source line numbers
     6. Write tests for common error conditions

8. **Phase 8: Wire Passes Together in assembler/index.ts**
   - **Objective:** Create main assembler entry point that orchestrates Pass 1, Pass 2, and error reporting
   - **Files/Functions to Modify/Create:**
     - src/assembler/index.ts (assemble function)
   - **Tests to Write:**
     - test_assemble_empty_source
     - test_assemble_simple_program
     - test_assemble_with_labels_and_branches
     - test_assemble_with_org_directive
     - test_assemble_with_errors_returns_error_list
     - test_assemble_output_format
   - **Steps:**
     1. Create assemble() function taking source string and options
     2. Initialize symbol table
     3. Run Pass 1 (symbol discovery)
     4. Run Pass 2 (code generation)
     5. Return result object with generated code, symbol table, and errors
     6. Add integration tests assembling complete (small) programs
     7. Compare output against known-good reference assembled with original EdAsm

**Open Questions:**

1. Object file format: Should we output raw binary, or ProDOS REL format with relocation records? Start with raw binary?
2. SWEET16 ops: Should we support SWEET16 pseudo-instructions, or skip for initial port?
3. Listing output: Should Pass 3 (symbol table printing) be ported now, or deferred? Defer for now?
4. ProDOS attributes: Use sidecar JSON files as specified in AUDIT.md?
5. CLI integration: Should phases 1-7 wire into src/cli.ts, or focus on library API first? Focus on library API first, CLI in separate phase?
