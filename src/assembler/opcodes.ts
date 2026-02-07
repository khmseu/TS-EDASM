// Port of EdAsm opcode tables from ASM1.S lines 1015-1250
// Preserves original table structure and lookup semantics

export enum AddressingMode {
  IMPLIED = "implied",
  ACCUMULATOR = "accumulator",
  IMMEDIATE = "immediate",
  ZERO_PAGE = "zeroPage",
  ZERO_PAGE_X = "zeroPageX",
  ZERO_PAGE_Y = "zeroPageY",
  ABSOLUTE = "absolute",
  ABSOLUTE_X = "absoluteX",
  ABSOLUTE_Y = "absoluteY",
  INDIRECT = "indirect",
  INDIRECT_X = "indirectX",
  INDIRECT_Y = "indirectY",
  INDIRECT_ZP = "indirectZP",
  RELATIVE = "relative",
  INDIRECT_ABS_X = "indirectAbsX",
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
    [AddressingMode.ABSOLUTE]: 0x6d,
    [AddressingMode.ZERO_PAGE]: 0x65,
    [AddressingMode.IMMEDIATE]: 0x69,
    [AddressingMode.ZERO_PAGE_X]: 0x75,
    [AddressingMode.ABSOLUTE_X]: 0x7d,
    [AddressingMode.ABSOLUTE_Y]: 0x79,
    [AddressingMode.INDIRECT_Y]: 0x71,
    [AddressingMode.INDIRECT_X]: 0x61,
    [AddressingMode.INDIRECT_ZP]: 0x72, // 65C02
  },
  AND: {
    [AddressingMode.ABSOLUTE]: 0x2d,
    [AddressingMode.ZERO_PAGE]: 0x25,
    [AddressingMode.IMMEDIATE]: 0x29,
    [AddressingMode.ZERO_PAGE_X]: 0x35,
    [AddressingMode.ABSOLUTE_X]: 0x3d,
    [AddressingMode.ABSOLUTE_Y]: 0x39,
    [AddressingMode.INDIRECT_Y]: 0x31,
    [AddressingMode.INDIRECT_X]: 0x21,
    [AddressingMode.INDIRECT_ZP]: 0x32, // 65C02
  },
  ASL: {
    [AddressingMode.ABSOLUTE]: 0x0e,
    [AddressingMode.ZERO_PAGE]: 0x06,
    [AddressingMode.ACCUMULATOR]: 0x0a,
    [AddressingMode.ZERO_PAGE_X]: 0x16,
    [AddressingMode.ABSOLUTE_X]: 0x1e,
  },
  BCC: { [AddressingMode.RELATIVE]: 0x90 },
  BCS: { [AddressingMode.RELATIVE]: 0xb0 },
  BEQ: { [AddressingMode.RELATIVE]: 0xf0 },
  BIT: {
    [AddressingMode.ABSOLUTE]: 0x2c,
    [AddressingMode.ZERO_PAGE]: 0x24,
    [AddressingMode.IMMEDIATE]: 0x89, // 65C02
    [AddressingMode.ZERO_PAGE_X]: 0x34, // 65C02
    [AddressingMode.ABSOLUTE_X]: 0x3c, // 65C02
  },
  BMI: { [AddressingMode.RELATIVE]: 0x30 },
  BNE: { [AddressingMode.RELATIVE]: 0xd0 },
  BPL: { [AddressingMode.RELATIVE]: 0x10 },
  BRA: { [AddressingMode.RELATIVE]: 0x80 },
  BRK: { [AddressingMode.IMPLIED]: 0x00 },
  BVC: { [AddressingMode.RELATIVE]: 0x50 },
  BVS: { [AddressingMode.RELATIVE]: 0x70 },
  CLC: { [AddressingMode.IMPLIED]: 0x18 },
  CLD: { [AddressingMode.IMPLIED]: 0xd8 },
  CLI: { [AddressingMode.IMPLIED]: 0x58 },
  CLV: { [AddressingMode.IMPLIED]: 0xb8 },
  CMP: {
    [AddressingMode.ABSOLUTE]: 0xcd,
    [AddressingMode.ZERO_PAGE]: 0xc5,
    [AddressingMode.IMMEDIATE]: 0xc9,
    [AddressingMode.ZERO_PAGE_X]: 0xd5,
    [AddressingMode.ABSOLUTE_X]: 0xdd,
    [AddressingMode.ABSOLUTE_Y]: 0xd9,
    [AddressingMode.INDIRECT_Y]: 0xd1,
    [AddressingMode.INDIRECT_X]: 0xc1,
    [AddressingMode.INDIRECT_ZP]: 0xd2,
  },
  CPX: {
    [AddressingMode.ABSOLUTE]: 0xec,
    [AddressingMode.ZERO_PAGE]: 0xe4,
    [AddressingMode.IMMEDIATE]: 0xe0,
  },
  CPY: {
    [AddressingMode.ABSOLUTE]: 0xcc,
    [AddressingMode.ZERO_PAGE]: 0xc4,
    [AddressingMode.IMMEDIATE]: 0xc0,
  },
  DEC: {
    [AddressingMode.ABSOLUTE]: 0xce,
    [AddressingMode.ZERO_PAGE]: 0xc6,
    [AddressingMode.ACCUMULATOR]: 0x3a, // 65C02
    [AddressingMode.ZERO_PAGE_X]: 0xd6,
    [AddressingMode.ABSOLUTE_X]: 0xde,
  },
  DEX: { [AddressingMode.IMPLIED]: 0xca },
  DEY: { [AddressingMode.IMPLIED]: 0x88 },
  EOR: {
    [AddressingMode.ABSOLUTE]: 0x4d,
    [AddressingMode.ZERO_PAGE]: 0x45,
    [AddressingMode.IMMEDIATE]: 0x49,
    [AddressingMode.ZERO_PAGE_X]: 0x55,
    [AddressingMode.ABSOLUTE_X]: 0x5d,
    [AddressingMode.ABSOLUTE_Y]: 0x59,
    [AddressingMode.INDIRECT_Y]: 0x51,
    [AddressingMode.INDIRECT_X]: 0x41,
    [AddressingMode.INDIRECT_ZP]: 0x52,
  },
  INC: {
    [AddressingMode.ABSOLUTE]: 0xee,
    [AddressingMode.ZERO_PAGE]: 0xe6,
    [AddressingMode.ACCUMULATOR]: 0x1a,
    [AddressingMode.ZERO_PAGE_X]: 0xf6,
    [AddressingMode.ABSOLUTE_X]: 0xfe,
  },
  INX: { [AddressingMode.IMPLIED]: 0xe8 },
  INY: { [AddressingMode.IMPLIED]: 0xc8 },
  JMP: {
    [AddressingMode.ABSOLUTE]: 0x4c,
    [AddressingMode.INDIRECT]: 0x6c,
    [AddressingMode.INDIRECT_ABS_X]: 0x7c, // 65C02
  },
  JSR: { [AddressingMode.ABSOLUTE]: 0x20 },
  LDA: {
    [AddressingMode.ABSOLUTE]: 0xad,
    [AddressingMode.ZERO_PAGE]: 0xa5,
    [AddressingMode.IMMEDIATE]: 0xa9,
    [AddressingMode.ZERO_PAGE_X]: 0xb5,
    [AddressingMode.ABSOLUTE_X]: 0xbd,
    [AddressingMode.ABSOLUTE_Y]: 0xb9,
    [AddressingMode.INDIRECT_Y]: 0xb1,
    [AddressingMode.INDIRECT_X]: 0xa1,
    [AddressingMode.INDIRECT_ZP]: 0xb2,
  },
  LDX: {
    [AddressingMode.ABSOLUTE]: 0xae,
    [AddressingMode.ZERO_PAGE]: 0xa6,
    [AddressingMode.IMMEDIATE]: 0xa2,
    [AddressingMode.ZERO_PAGE_Y]: 0xb6,
    [AddressingMode.ABSOLUTE_Y]: 0xbe,
  },
  LDY: {
    [AddressingMode.ABSOLUTE]: 0xac,
    [AddressingMode.ZERO_PAGE]: 0xa4,
    [AddressingMode.IMMEDIATE]: 0xa0,
    [AddressingMode.ZERO_PAGE_X]: 0xb4,
    [AddressingMode.ABSOLUTE_X]: 0xbc,
  },
  LSR: {
    [AddressingMode.ABSOLUTE]: 0x4e,
    [AddressingMode.ZERO_PAGE]: 0x46,
    [AddressingMode.ACCUMULATOR]: 0x4a,
    [AddressingMode.ZERO_PAGE_X]: 0x56,
    [AddressingMode.ABSOLUTE_X]: 0x5e,
  },
  NOP: { [AddressingMode.IMPLIED]: 0xea },
  ORA: {
    [AddressingMode.ABSOLUTE]: 0x0d,
    [AddressingMode.ZERO_PAGE]: 0x05,
    [AddressingMode.IMMEDIATE]: 0x09,
    [AddressingMode.ZERO_PAGE_X]: 0x15,
    [AddressingMode.ABSOLUTE_X]: 0x1d,
    [AddressingMode.ABSOLUTE_Y]: 0x19,
    [AddressingMode.INDIRECT_Y]: 0x11,
    [AddressingMode.INDIRECT_X]: 0x01,
    [AddressingMode.INDIRECT_ZP]: 0x12,
  },
  PHA: { [AddressingMode.IMPLIED]: 0x48 },
  PHP: { [AddressingMode.IMPLIED]: 0x08 },
  PHX: { [AddressingMode.IMPLIED]: 0xda },
  PHY: { [AddressingMode.IMPLIED]: 0x5a },
  PLA: { [AddressingMode.IMPLIED]: 0x68 },
  PLP: { [AddressingMode.IMPLIED]: 0x28 },
  PLX: { [AddressingMode.IMPLIED]: 0xfa },
  PLY: { [AddressingMode.IMPLIED]: 0x7a },
  ROL: {
    [AddressingMode.ABSOLUTE]: 0x2e,
    [AddressingMode.ZERO_PAGE]: 0x26,
    [AddressingMode.ACCUMULATOR]: 0x2a,
    [AddressingMode.ZERO_PAGE_X]: 0x36,
    [AddressingMode.ABSOLUTE_X]: 0x3e,
  },
  ROR: {
    [AddressingMode.ABSOLUTE]: 0x6e,
    [AddressingMode.ZERO_PAGE]: 0x66,
    [AddressingMode.ACCUMULATOR]: 0x6a,
    [AddressingMode.ZERO_PAGE_X]: 0x76,
    [AddressingMode.ABSOLUTE_X]: 0x7e,
  },
  RTI: { [AddressingMode.IMPLIED]: 0x40 },
  RTS: { [AddressingMode.IMPLIED]: 0x60 },
  SBC: {
    [AddressingMode.ABSOLUTE]: 0xed,
    [AddressingMode.ZERO_PAGE]: 0xe5,
    [AddressingMode.IMMEDIATE]: 0xe9,
    [AddressingMode.ZERO_PAGE_X]: 0xf5,
    [AddressingMode.ABSOLUTE_X]: 0xfd,
    [AddressingMode.ABSOLUTE_Y]: 0xf9,
    [AddressingMode.INDIRECT_Y]: 0xf1,
    [AddressingMode.INDIRECT_X]: 0xe1,
    [AddressingMode.INDIRECT_ZP]: 0xf2,
  },
  SEC: { [AddressingMode.IMPLIED]: 0x38 },
  SED: { [AddressingMode.IMPLIED]: 0xf8 },
  SEI: { [AddressingMode.IMPLIED]: 0x78 },
  STA: {
    [AddressingMode.ABSOLUTE]: 0x8d,
    [AddressingMode.ZERO_PAGE]: 0x85,
    [AddressingMode.ZERO_PAGE_X]: 0x95,
    [AddressingMode.ABSOLUTE_X]: 0x9d,
    [AddressingMode.ABSOLUTE_Y]: 0x99,
    [AddressingMode.INDIRECT_Y]: 0x91,
    [AddressingMode.INDIRECT_X]: 0x81,
    [AddressingMode.INDIRECT_ZP]: 0x92,
  },
  STX: {
    [AddressingMode.ABSOLUTE]: 0x8e,
    [AddressingMode.ZERO_PAGE]: 0x86,
    [AddressingMode.ZERO_PAGE_Y]: 0x96,
  },
  STY: {
    [AddressingMode.ABSOLUTE]: 0x8c,
    [AddressingMode.ZERO_PAGE]: 0x84,
    [AddressingMode.ZERO_PAGE_X]: 0x94,
  },
  STZ: {
    [AddressingMode.ABSOLUTE]: 0x9c, // 65C02
    [AddressingMode.ZERO_PAGE]: 0x64, // 65C02
    [AddressingMode.ZERO_PAGE_X]: 0x74, // 65C02
    [AddressingMode.ABSOLUTE_X]: 0x9e, // 65C02
  },
  TAX: { [AddressingMode.IMPLIED]: 0xaa },
  TAY: { [AddressingMode.IMPLIED]: 0xa8 },
  TRB: {
    [AddressingMode.ABSOLUTE]: 0x1c, // 65C02
    [AddressingMode.ZERO_PAGE]: 0x14, // 65C02
  },
  TSB: {
    [AddressingMode.ABSOLUTE]: 0x0c, // 65C02
    [AddressingMode.ZERO_PAGE]: 0x04, // 65C02
  },
  TSX: { [AddressingMode.IMPLIED]: 0xba },
  TXA: { [AddressingMode.IMPLIED]: 0x8a },
  TXS: { [AddressingMode.IMPLIED]: 0x9a },
  TYA: { [AddressingMode.IMPLIED]: 0x98 },
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
  [AddressingMode.INDIRECT_ABS_X]: 3,
};

export function lookupOpcode(
  mnemonic: string,
  mode: AddressingMode,
): number | null {
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
