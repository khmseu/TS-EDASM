#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { assemble, link } from './index';
import { writeProDOSAttributes } from './io/prodosAttributes';

const VERSION = '0.1.0';

interface CliOptions {
  output?: string;
  listing?: boolean;
  origin?: number;
  cpu?: '6502' | '65C02';
  relocatable?: boolean;
  verbose?: boolean;
  help?: boolean;
  version?: boolean;
}

function showVersion(): void {
  console.log(`TS-EDASM v${VERSION}`);
  console.log('TypeScript port of EdAsm 6502 assembler and linker');
  console.log('');
}

function showHelp(): void {
  console.log('TS-EDASM - 6502/65C02 Assembler and Linker');
  console.log('');
  console.log('USAGE:');
  console.log('  edasm <command> [options] <input...>');
  console.log('');
  console.log('COMMANDS:');
  console.log('  asm <file>          Assemble a 6502 source file');
  console.log('  link <file...>      Link one or more object files');
  console.log('  help                Show this help message');
  console.log('  version             Show version information');
  console.log('');
  console.log('ASSEMBLER OPTIONS:');
  console.log('  -o, --output <file> Output file path (default: <input>.obj)');
  console.log('  -l, --listing       Generate listing file (.lst)');
  console.log('  --origin <addr>     Set assembly origin address (hex or decimal)');
  console.log('  --cpu <type>        CPU type: 6502 or 65C02 (default: 6502)');
  console.log('  -r, --relocatable   Generate relocatable object (REL format)');
  console.log('  -v, --verbose       Verbose output');
  console.log('');
  console.log('LINKER OPTIONS:');
  console.log('  -o, --output <file> Output file path (default: a.out)');
  console.log('  --origin <addr>     Link origin address (hex or decimal)');
  console.log('  -v, --verbose       Verbose output');
  console.log('');
  console.log('EXAMPLES:');
  console.log('  edasm asm program.s -o program.obj -l');
  console.log('  edasm asm module.s --origin 0x8000 --cpu 65C02 -r');
  console.log('  edasm link module1.obj module2.obj -o program');
  console.log('  edasm link *.obj --origin 0xC000 -o program.sys');
  console.log('');
  console.log('NOTES:');
  console.log('  - Addresses can be hex (0x8000 or $8000) or decimal (32768)');
  console.log('  - ProDOS file attributes are stored in JSON dotfiles (.filename)');
  console.log('  - Use --relocatable for multi-module programs');
  console.log('');
}

function parseAddress(addr: string): number | null {
  // Handle hex formats: 0x8000, $8000, 8000h
  let value: number;
  if (addr.startsWith('0x') || addr.startsWith('0X')) {
    value = parseInt(addr.slice(2), 16);
  } else if (addr.startsWith('$')) {
    value = parseInt(addr.slice(1), 16);
  } else if (addr.toLowerCase().endsWith('h')) {
    value = parseInt(addr.slice(0, -1), 16);
  } else {
    value = parseInt(addr, 10);
  }
  return isNaN(value) ? null : value;
}

function parseArgs(args: string[]): { inputs: string[]; options: CliOptions } {
  const inputs: string[] = [];
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '-v' || arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--version') {
      options.version = true;
    } else if (arg === '-o' || arg === '--output') {
      if (i + 1 < args.length) {
        options.output = args[++i];
      } else {
        console.error(`Error: ${arg} requires an argument`);
        process.exit(1);
      }
    } else if (arg === '-l' || arg === '--listing') {
      options.listing = true;
    } else if (arg === '--origin') {
      if (i + 1 < args.length) {
        const origin = parseAddress(args[++i]);
        if (origin === null) {
          console.error(`Error: Invalid address format: ${args[i]}`);
          process.exit(1);
        }
        options.origin = origin;
      } else {
        console.error(`Error: ${arg} requires an argument`);
        process.exit(1);
      }
    } else if (arg === '--cpu') {
      if (i + 1 < args.length) {
        const cpu = args[++i];
        if (cpu !== '6502' && cpu !== '65C02') {
          console.error(`Error: Invalid CPU type: ${cpu} (expected 6502 or 65C02)`);
          process.exit(1);
        }
        options.cpu = cpu;
      } else {
        console.error(`Error: ${arg} requires an argument`);
        process.exit(1);
      }
    } else if (arg === '-r' || arg === '--relocatable') {
      options.relocatable = true;
    } else if (arg.startsWith('-')) {
      console.error(`Error: Unknown option: ${arg}`);
      console.error('Use --help to see available options');
      process.exit(1);
    } else {
      inputs.push(arg);
    }
  }

  return { inputs, options };
}

async function runAsm(args: string[]): Promise<number> {
  const { inputs, options } = parseArgs(args);

  if (options.help) {
    showHelp();
    return 0;
  }

  if (inputs.length === 0) {
    console.error('Error: No input file specified');
    console.error('Usage: edasm asm <file> [options]');
    return 1;
  }

  if (inputs.length > 1) {
    console.error('Error: Multiple input files not supported (use linker for multi-file projects)');
    return 1;
  }

  const input = inputs[0];
  
  if (options.verbose) {
    console.log(`Assembling: ${input}`);
    if (options.origin !== undefined) {
      console.log(`  Origin: $${options.origin.toString(16).toUpperCase()}`);
    }
    if (options.cpu) {
      console.log(`  CPU: ${options.cpu}`);
    }
    if (options.relocatable) {
      console.log(`  Mode: Relocatable`);
    }
  }

  let source: string;
  try {
    source = await readFile(input, 'utf8');
  } catch (err) {
    console.error(`Error: Cannot read file: ${input}`);
    if (err instanceof Error) {
      console.error(`  ${err.message}`);
    }
    return 1;
  }

  const result = assemble(source, {
    sourceName: path.basename(input),
    listing: options.listing,
    origin: options.origin,
    cpu: options.cpu,
    relocatable: options.relocatable
  });

  if (!result.ok || !result.artifacts) {
    console.error('Assembly failed:');
    for (const error of result.errors) {
      console.error(`  ${error}`);
    }
    return 1;
  }

  // Show warnings
  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.warn(`Warning: ${warning}`);
    }
  }

  // Write object file
  const outPath = options.output ?? `${input}.obj`;
  try {
    if (result.artifacts.objectBytes) {
      await writeFile(outPath, result.artifacts.objectBytes);
      
      if (options.verbose) {
        console.log(`Object file written: ${outPath} (${result.artifacts.objectBytes.length} bytes)`);
      }
    }

    // Write listing file
    if (options.listing && result.artifacts.listing) {
      const listPath = `${outPath}.lst`;
      await writeFile(listPath, result.artifacts.listing, 'utf8');
      
      if (options.verbose) {
        console.log(`Listing written: ${listPath}`);
      }
    }

    // Write ProDOS attributes
    if (result.artifacts.attributes) {
      await writeProDOSAttributes(outPath, result.artifacts.attributes);
    }
  } catch (err) {
    console.error(`Error: Cannot write output file: ${outPath}`);
    if (err instanceof Error) {
      console.error(`  ${err.message}`);
    }
    return 1;
  }

  if (!options.verbose) {
    console.log(`Assembly successful: ${outPath}`);
  }

  return 0;
}

async function runLink(args: string[]): Promise<number> {
  const { inputs, options } = parseArgs(args);

  if (options.help) {
    showHelp();
    return 0;
  }

  if (inputs.length === 0) {
    console.error('Error: No input files specified');
    console.error('Usage: edasm link <file...> [options]');
    return 1;
  }

  if (options.verbose) {
    console.log(`Linking ${inputs.length} object file(s):`);
    for (const file of inputs) {
      console.log(`  - ${file}`);
    }
    if (options.origin !== undefined) {
      console.log(`  Origin: $${options.origin.toString(16).toUpperCase()}`);
    }
  }

  // Read all input files
  const objects: Uint8Array[] = [];
  for (const file of inputs) {
    try {
      const data = await readFile(file);
      objects.push(data);
    } catch (err) {
      console.error(`Error: Cannot read file: ${file}`);
      if (err instanceof Error) {
        console.error(`  ${err.message}`);
      }
      return 1;
    }
  }

  const result = link(objects, {
    outputName: options.output ?? 'a.out',
    origin: options.origin
  });

  if (!result.ok || !result.artifacts) {
    console.error('Link failed:');
    for (const error of result.errors) {
      console.error(`  ${error}`);
    }
    return 1;
  }

  // Show warnings
  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.warn(`Warning: ${warning}`);
    }
  }

  const outPath = options.output ?? 'a.out';
  try {
    if (result.artifacts.executable) {
      await writeFile(outPath, result.artifacts.executable);
      
      if (options.verbose) {
        console.log(`Executable written: ${outPath} (${result.artifacts.executable.length} bytes)`);
      }
    }

    if (result.artifacts.attributes) {
      await writeProDOSAttributes(outPath, result.artifacts.attributes);
    }
  } catch (err) {
    console.error(`Error: Cannot write output file: ${outPath}`);
    if (err instanceof Error) {
      console.error(`  ${err.message}`);
    }
    return 1;
  }

  if (!options.verbose) {
    console.log(`Link successful: ${outPath}`);
  }

  return 0;
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === '-h' || command === '--help' || command === 'help') {
    showHelp();
    process.exit(command ? 0 : 1);
  }

  if (command === '-v' || command === '--version' || command === 'version') {
    showVersion();
    process.exit(0);
  }

  let exitCode = 0;
  try {
    switch (command) {
      case 'asm':
        exitCode = await runAsm(args);
        break;
      case 'link':
        exitCode = await runLink(args);
        break;
      default:
        console.error(`Error: Unknown command: ${command}`);
        console.error('Use "edasm help" to see available commands');
        exitCode = 1;
    }
  } catch (error) {
    console.error('Fatal error:');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    exitCode = 1;
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error('Unhandled error:');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
