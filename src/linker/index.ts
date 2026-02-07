import {
  parseREL,
  buildREL,
  type RELObject,
  type RelocationEntry,
} from "./relformat.js";

export interface LinkOptions {
  outputName?: string;
  origin?: number;
}

export interface LinkArtifacts {
  executable?: Uint8Array;
  map?: string;
  attributes?: Record<string, unknown>;
}

export interface LinkResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  artifacts?: LinkArtifacts;
}

interface LinkState {
  modules: RELObject[];
  globalSymbols: Map<string, number>;
  unresolvedExternals: Set<string>;
  origin: number;
  currentPC: number;
}

export function link(
  objects: Uint8Array[],
  options: LinkOptions = {},
): LinkResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Parse all REL objects
  const modules: RELObject[] = [];
  for (let i = 0; i < objects.length; i++) {
    try {
      const module = parseREL(objects[i]);
      modules.push(module);
    } catch (err) {
      errors.push(
        `Failed to parse object file ${i}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings };
  }

  // Initialize link state
  const state: LinkState = {
    modules,
    globalSymbols: new Map(),
    unresolvedExternals: new Set(),
    origin: options.origin ?? 0x0800,
    currentPC: options.origin ?? 0x0800,
  };

  // Phase 1: Build global symbol table
  for (const module of modules) {
    for (const [name, value] of module.symbols.entries()) {
      if (state.globalSymbols.has(name)) {
        errors.push(`Duplicate symbol: ${name}`);
      } else {
        // Relocate symbol value
        state.globalSymbols.set(name, value + state.currentPC);
      }
    }
    state.currentPC += module.code.length;
  }

  // Phase 2: Check for unresolved externals
  for (const module of modules) {
    for (const extRef of module.header.externalRefs) {
      if (!state.globalSymbols.has(extRef)) {
        state.unresolvedExternals.add(extRef);
      }
    }
  }

  if (state.unresolvedExternals.size > 0) {
    for (const symbol of state.unresolvedExternals) {
      errors.push(`Unresolved external: ${symbol}`);
    }
    return { ok: false, errors, warnings };
  }

  // Phase 3: Combine code and apply relocations
  const combinedCode: number[] = [];
  let currentBase = state.origin;

  for (const module of modules) {
    const codeArray = Array.from(module.code);

    // Apply relocations
    for (const reloc of module.relocations) {
      let value = 0;

      if (reloc.symbol) {
        // External reference
        value = state.globalSymbols.get(reloc.symbol) ?? 0;
      } else {
        // Internal relocation - adjust by module base
        if (reloc.type === "word") {
          value = codeArray[reloc.offset] | (codeArray[reloc.offset + 1] << 8);
        } else {
          value = codeArray[reloc.offset];
        }
        value += currentBase;
      }

      if (reloc.relative) {
        // PC-relative: value - PC
        value = value - (currentBase + reloc.offset);
      }

      // Write relocated value
      if (reloc.type === "word") {
        codeArray[reloc.offset] = value & 0xff;
        codeArray[reloc.offset + 1] = (value >> 8) & 0xff;
      } else {
        codeArray[reloc.offset] = value & 0xff;
      }
    }

    combinedCode.push(...codeArray);
    currentBase += module.code.length;
  }

  // Filter out any undefined values and create a clean executable
  const cleanCode = combinedCode.filter((b) => b !== undefined);
  const executable = new Uint8Array(cleanCode);
  return {
    ok: true,
    errors,
    warnings,
    artifacts: {
      executable,
      attributes: {
        fileType: 0xff, // SYS type
        auxType: state.origin,
      },
    },
  };
}
