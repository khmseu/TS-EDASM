import { pass1 } from "./pass1.js";
import { pass2 } from "./pass2.js";
import type { SymbolTable } from "./symbols.js";

// Re-export SymbolTable for tests
export type { SymbolTable } from "./symbols";

export interface AssemblyOptions {
  sourceName?: string;
  listing?: boolean;
  origin?: number;
  relocatable?: boolean;
  cpu?: "6502" | "65C02";
}

export interface AssemblyArtifacts {
  objectBytes?: Uint8Array;
  listing?: string;
  symbols: SymbolTable;
  attributes?: Record<string, unknown>;
}

export interface AssemblyResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  artifacts?: AssemblyArtifacts;
}

export function assemble(
  source: string,
  options: AssemblyOptions = {},
): AssemblyResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Pass 1: Symbol discovery
  const pass1Result = pass1(source, {
    origin: options.origin,
    cpu: options.cpu,
  });
  errors.push(...pass1Result.errors);
  warnings.push(...pass1Result.warnings);

  if (pass1Result.errors.length > 0) {
    return {
      ok: false,
      errors,
      warnings,
      artifacts: {
        symbols: pass1Result.symbols,
        objectBytes: undefined,
        listing: undefined,
      },
    };
  }

  // Pass 2: Code generation
  const pass2Result = pass2(pass1Result.lines, pass1Result.symbols, {
    listing: options.listing,
    relocatable: options.relocatable,
    cpu: options.cpu,
  });
  errors.push(...pass2Result.errors);
  warnings.push(...pass2Result.warnings);

  if (pass2Result.errors.length > 0) {
    return {
      ok: false,
      errors,
      warnings,
      artifacts: {
        symbols: pass1Result.symbols,
        objectBytes: pass2Result.objectCode,
        listing: pass2Result.listing,
      },
    };
  }

  // Build artifacts
  const artifacts: AssemblyArtifacts = {
    objectBytes: pass2Result.objectCode,
    listing: pass2Result.listing,
    symbols: pass1Result.symbols,
    attributes: {
      fileType: options.relocatable ? 0xfe : 0x06,
      auxType: options.origin || 0x0000,
    },
  };

  return {
    ok: true,
    errors,
    warnings,
    artifacts,
  };
}
