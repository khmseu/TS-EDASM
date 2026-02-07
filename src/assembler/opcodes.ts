// Port of EdAsm opcode tables from ASM1.S lines 1015-1250
// Preserves original table structure and lookup semantics

export enum AddressingMode {
  IMPLIED = 'implied',
  ACCUMULATOR = 'accumulator',
  IMMEDIATE = 'immediate',
  ZERO_PAGE = 'zeroPage',
  ZERO_PAGE_X = 'zeroPageX',
  ZERO_PAGE_Y = 'zeroPageY',
  ABSOLUTE = 'absolute',
  ABSOLUTE_X = 'absoluteX',
  ABSOLUTE_Y = 'absoluteY',
  INDIRECT = 'indirect',
  INDIRECT_X = 'indirectX',
  INDIRECT_Y = 'indirectY',
  INDIRECT_ZP = 'indirectZP',
  RELATIVE = 'relative',
  INDIRECT_ABS_X = 'indirectAbsX'
}

export interface OpcodeDef {
  mnemonic: string;
  mode: AddressingMode;
  opcode: number;
  bytes: number;
  cycles: number;
}

// Mode bits from ASM1.S (lines 1439-1483)
// 1st flag byte:
//  bit 7: directive
//  bit 6: SWEET16
//  bit 5: implied mode
//  bit 4: (abs)
//  bit 3: relative mode
//  bit 2: zp,Y (for LDX/STX)
//  bit 1-0: flags for special modes
//
// 2nd flag byte:
//  bit 7: (zp,X)
//  bit 6: (zp),Y
//  bit 5: abs,Y
//  bit 4: abs,X
//  bit 3: zp,X
//  bit 2: immediate
//  bit 1: zp
//  bit 0: abs

// Opcode byte values from ASM1.S OpcodeT table
const OPCODE_TABLE: Record<string, Partial<Record<AddressingMode, number>>> = {
  ADC: {
    [AddressingMode.ABSOLUTE]: 0x6D,
    [AddressingMode.ZERO_PAGE]: 0x65,
    [AddressingMode.IMMEDIATE]: 0x69,
    [AddressingMode.ZERO_PAGE_X]: 0x75,
    [AddressingMode.ABSOLUTE_X]: 0x7D,
    [AddressingMode.ABSOLUTE_Y]: 0x79,
    [AddressingMode.INDIRECT_Y]: 0x71,
    [AddressingMode.INDIRECT_X]: 0x61,
    [AddressingMode.INDIRECT_ZP]: 0x72 // 65C02
  },
  AND: {
    [AddressingMode.ABSOLUTE]: 0x2D,
    [AddressingMode.ZERO_PAGE]: 0x25,
    [AddressingMode.IMMEDIATE]: 0x29,
    [AddressingMode.ZERO_PAGE_X]: 0x35,
    [AddressingMode.ABSOLUTE_X]: 0x3D,
    [AddressingMode.ABSOLUTE_Y]: 0x39,
    [AddressingMode.INDIRECT_Y]: 0x31,
    [AddressingMode.INDIRECT_X]: 0x21,
    [AddressingMode.INDIRECT_ZP]: 0x32 // 65C02
  },
  ASL: {
    [AddressingMode.ABSOLUTE]: 0x0E,
    [AddressingMode.ZERO_PAGE]: 0x06,
    [AddressingMode.ACCUMULATOR]: 0x0A,
    [AddressingMode.ZERO_PAGE_X]: 0x16,
    [AddressingMode.ABSOLUTE_X]: 0x1E
  },
  BCC: { [AddressingMode.RELATIVE]: 0x90 },
  BCS: { [AddressingMode.RELATIVE]: 0xB0 },
  BEQ: { [AddressingMode.RELATIVE]: 0xF0 },
  BIT: {
    [AddressingMode.ABSOLUTE]: 0x2C,
    [AddressingMode.ZERO_PAGE]: 0x24,
    [AddressingMode.IMMEDIATE]: 0x89, // 65C02
    [AddressingMode.ZERO_PAGE_X]: 0x34, // 65C02
    [AddressingMode.ABSOLUTE_X]: 0x3C // 65C02
  },
  BMI: { [AddressingMode.RELATIVE]: 0x30 },
  BNE: { [AddressingMode.RELATIVE]: 0xD0 },
  BPL: { [AddressingMode.RELATIVE]: 0x10 },
  BRA: { [AddressingMode.RELATIVE]: 0x80 },
  BRK: { [AddressingMode.IMPLIED]: 0x00 },
  BVC: { [AddressingMode.RELATIVE]: 0x50 },
  BVS: { [AddressingMode.RELATIVE]: 0x70 },
  CLC: { [AddressingMode.IMPLIED]: 0x18 },
  CLD: { [AddressingMode.IMPLIED]: 0xD8 },
  CLI: { [AddressingMode.IMPLIED]: 0x58 },
  CLV: { [AddressingMode.IMPLIED]: 0xB8 },
  CMP: {
    [AddressingMode.ABSOLUTE]: 0xCD,
    [AddressingMode.ZERO_PAGE]: 0xC5,
    [AddressingMode.IMMEDIATE]: 0xC9,
    [AddressingMode.ZERO_PAGE_X]: 0xD5,
    [AddressingMode.ABSOLUTE_X]: 0xDD,
    [AddressingMode.ABSOLUTE_Y]: 0xD9,
    [AddressingMode.INDIRECT_Y]: 0xD1,
    [AddressingMode.INDIRECT_X]: 0xC1,
    [AddressingMode.INDIRECT_ZP]: 0xD2
  },
  CPX: {
    [AddressingMode.ABSOLUTE]: 0xEC,
    [AddressingMode.ZERO_PAGE]: 0xE4,
    [AddressingMode.IMMEDIATE]: 0xE0
  },
  CPY: {
    [AddressingMode.ABSOLUTE]: 0xCC,
    [AddressingMode.ZERO_PAGE]: 0xC4,
    [AddressingMode.IMMEDIATE]: 0xC0
  },
  DEC: {
    [AddressingMode.ABSOLUTE]: 0xCE,
    [AddressingMode.ZERO_PAGE]: 0xC6,
    [AddressingMode.ACCUMULATOR]: 0x3A, // 65C02
    [AddressingMode.ZERO_PAGE_X]: 0xD6,
    [AddressingMode.ABSOLUTE_X]: 0xDE
  },
  DEX: { [AddressingMode.IMPLIED]: 0xCA },
  DEY: { [AddressingMode.IMPLIED]: 0x88 },
  EOR: {
    [AddressingMode.ABSOLUTE]: 0x4D,
    [AddressingMode.ZERO_PAGE]: 0x45,
    [AddressingMode.IMMEDIATE]: 0x49,
    [AddressingMode.ZERO_PAGE_X]: 0x55,
    [AddressingMode.ABSOLUTE_X]: 0x5D,
    [AddressingMode.ABSOLUTE_Y]: 0x59,
    [AddressingMode.INDIRECT_Y]: 0x51,
    [AddressingMode.INDIRECT_X]: 0x41,
    [AddressingMode.INDIRECT_ZP]: 0x52
  },
  INC: {
    [AddressingMode.ABSOLUTE]: 0xEE,
    [AddressingMode.ZERO_PAGE]: 0xE6,
    [AddressingMode.ACCUMULATOR]: 0x1A,
    [AddressingMode.ZERO_PAGE_X]: 0xF6,
    [AddressingMode.ABSOLUTE_X]: 0xFE
  },
  INX: { [AddressingMode.IMPLIED]: 0xE8 },
  INY: { [AddressingMode.IMPLIED]: 0xC8 },
  JMP: {
    [AddressingMode.ABSOLUTE]: 0x4C,
    [AddressingMode.INDIRECT]: 0x6C,
    [AddressingMode.INDIRECT_ABS_X]: 0x7C // 65C02
  },
  JSR: { [AddressingMode.ABSOLUTE]: 0x20 },
  LDA: {
    [AddressingMode.ABSOLUTE]: 0xAD,
    [AddressingMode.ZERO_PAGE]: 0xA5,
    [AddressingMode.IMMEDIATE]: 0xA9,
    [AddressingMode.ZERO_PAGE_X]: 0xB5,
    [AddressingMode.ABSOLUTE_X]: 0xBD,
    [AddressingMode.ABSOLUTE_Y]: 0xB9,
    [AddressingMode.INDIRECT_Y]: 0xB1,
    [AddressingMode.INDIRECT_X]: 0xA1,
    [AddressingMode.INDIRECT_ZP]: 0xB2
  },
  LDX: {
    [AddressingMode.ABSOLUTE]: 0xAE,
    [AddressingMode.ZERO_PAGE]: 0xA6,
    [AddressingMode.IMMEDIATE]: 0xA2,
    [AddressingMode.ZERO_PAGE_Y]: 0xB6,
    [AddressingMode.ABSOLUTE_Y]: 0xBE
  },
  LDY: {
    [AddressingMode.ABSOLUTE]: 0xAC,
    [AddressingMode.ZERO_PAGE]: 0xA4,
    [AddressingMode.IMMEDIATE]: 0xA0,
    [AddressingMode.ZERO_PAGE_X]: 0xB4,
    [AddressingMode.ABSOLUTE_X]: 0xBC
  },
  LSR: {
    [AddressingMode.ABSOLUTE]: 0x4E,
    [AddressingMode.ZERO_PAGE]: 0x46,
    [AddressingMode.ACCUMULATOR]: 0x4A,
    [AddressingMode.ZERO_PAGE_X]: 0x56,
    [AddressingMode.ABSOLUTE_X]: 0x5E
  },
  NOP: { [AddressingMode.IMPLIED]: 0xEA },
  ORA: {
    [AddressingMode.ABSOLUTE]: 0x0D,
    [AddressingMode.ZERO_PAGE]: 0x05,
    [AddressingMode.IMMEDIATE]: 0x09,
    [AddressingMode.ZERO_PAGE_X]: 0x15,
    [AddressingMode.ABSOLUTE_X]: 0x1D,
    [AddressingMode.ABSOLUTE_Y]: 0x19,
    [AddressingMode.INDIRECT_Y]: 0x11,
    [AddressingMode.INDIRECT_X]: 0x01,
    [AddressingMode.INDIRECT_ZP]: 0x12
  },
  PHA: { [AddressingMode.IMPLIED]: 0x48 },
  PHP: { [AddressingMode.IMPLIED]: 0x08 },
  PHX: { [AddressingMode.IMPLIED]: 0xDA },
  PHY: { [AddressingMode.IMPLIED]: 0x5A },
  PLA: { [AddressingMode.IMPLIED]: 0x68 },
  PLP: { [AddressingMode.IMPLIED]: 0x28 },
  PLX: { [AddressingMode.IMPLIED]: 0xFA },
  PLY: { [AddressingMode.IMPLIED]: 0x7A },
  ROL: {
    [AddressingMode.ABSOLUTE]: 0x2E,
    [AddressingMode.ZERO_PAGE]: 0x26,
    [AddressingMode.ACCUMULATOR]: 0x2A,
    [AddressingMode.ZERO_PAGE_X]: 0x36,
    [AddressingMode.ABSOLUTE_X]: 0x3E
  },
  ROR: {
    [AddressingMode.ABSOLUTE]: 0x6E,
    [AddressingMode.ZERO_PAGE]: 0x66,
    [AddressingMode.ACCUMULATOR]: 0x6A,
    [AddressingMode.ZERO_PAGE_X]: 0x76,
    [AddressingMode.ABSOLUTE_X]: 0x7E
  },
  RTI: { [AddressingMode.IMPLIED]: 0x40 },
  RTS: { [AddressingMode.IMPLIED]: 0x60 },
  SBC: {
    [AddressingMode.ABSOLUTE]: 0xED,
    [AddressingMode.ZERO_PAGE]: 0xE5,
    [AddressingMode.IMMEDIATE]: 0xE9,
    [AddressingMode.ZERO_PAGE_X]: 0xF5,
    [AddressingMode.ABSOLUTE_X]: 0xFD,
    [AddressingMode.ABSOLUTE_Y]: 0xF9,
    [AddressingMode.INDIRECT_Y]: 0xF1,
    [AddressingMode.INDIRECT_X]: 0xE1,
    [AddressingMode.INDIRECT_ZP]: 0xF2
  },
  SEC: { [AddressingMode.IMPLIED]: 0x38 },
  SED: { [AddressingMode.IMPLIED]: 0xF8 },
  SEI: { [AddressingMode.IMPLIED]: 0x78 },
  STA: {
    [AddressingMode.ABSOLUTE]: 0x8D,
    [AddressingMode.ZERO_PAGE]: 0x85,
    [AddressingMode.ZERO_PAGE_X]: 0x95,
    [AddressingMode.ABSOLUTE_X]: 0x9D,
    [AddressingMode.ABSOLUTE_Y]: 0x99,
    [AddressingMode.INDIRECT_Y]: 0x91,
    [AddressingMode.INDIRECT_X]: 0x81,
    [AddressingMode.INDIRECT_ZP]: 0x92
  },
  STX: {
    [AddressingMode.ABSOLUTE]: 0x8E,
    [AddressingMode.ZERO_PAGE]: 0x86,
    [AddressingMode.ZERO_PAGE_Y]: 0x96
  },
  STY: {
    [AddressingMode.ABSOLUTE]: 0x8C,
    [AddressingMode.ZERO_PAGE]: 0x84,
    [AddressingMode.ZERO_PAGE_X]: 0x94
  },
STZ: {
    [AddressingMode.ABSOLUTE]: 0x9C, // 65C02
    [AddressingMode.ZERO_PAGE]: 0x64, // 65C02
    [AddressingMode.ZERO_PAGE_X]: 0x74, // 65C02
    [AddressingMode.ABSOLUTE_X]: 0x9E // 65C02
  },
  TAX: { [AddressingMode.IMPLIED]: 0xAA },
  TAY: { [AddressingMode.IMPLIED]: 0xA8 },
  TRB: {
    [AddressingMode.ABSOLUTE]: 0x1C, // 65C02
    [AddressingMode.ZERO_PAGE]: 0x14 // 65C02
  },
  TSB: {
    [AddressingMode.ABSOLUTE]: 0x0C, // 65C02
    [AddressingMode.ZERO_PAGE]: 0x04 // 65C02
  },
  TSX: { [AddressingMode.IMPLIED]: 0xBA },
  TXA: { [AddressingMode.IMPLIED]: 0x8A },
  TXS: { [AddressingMode.IMPLIED]: 0x9A },
  TYA: { [AddressingMode.IMPLIED]: 0x98 }
};

// Instruction byte lengths by addressing mode
const MODE_SIZES: Record<AddressingMode, number> = {
  [AddressingMode.IMPLIED]: 1,
  [AddressingMode.ACCUMULATOR]: 1,
  [AddressingMode.IMMEDIATE]: 2,
  [AddressingMode.ZERO_PAGE]: 2,
  [AddressingMode.ZERO_PAGE_X]: 2,
  [AddressingMode.ZERO_PAGE_Y]: 2,
  [AddressingMode.ABSOLUTE]: 3,
  [AddressingMode.ABSOLUTE_X]: 3,
  [AddressingMode.ABSOLUTE_Y]: 3,
  [AddressingMode.INDIRECT]: 3,
  [AddressingMode.INDIRECT_X]: 2,
  [AddressingMode.INDIRECT_Y]: 2,
  [AddressingMode.INDIRECT_ZP]: 2,
  [AddressingMode.RELATIVE]: 2,
  [AddressingMode.INDIRECT_ABS_X]: 3
};

export function lookupOpcode(mnemonic: string, mode: AddressingMode): number | null {
  const upperMnem = mnemonic.toUpperCase();
  const modes = OPCODE_TABLE[upperMnem];
  if (!modes) return null;
  return modes[mode] ?? null;
}

export function getInstructionSize(mode: AddressingMode): number {
  return MODE_SIZES[mode] ?? 1;
}

export function getSupportedModes(mnemonic: string): AddressingMode[] {
  const upperMnem = mnemonic.toUpperCase();
  const modes = OPCODE_TABLE[upperMnem];
  if (!modes) return [];
  return Object.keys(modes) as AddressingMode[];
}

export const MNEMONICS = Object.keys(OPCODE_TABLE);
