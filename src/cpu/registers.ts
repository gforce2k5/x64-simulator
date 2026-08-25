export const GENERAL_PURPOSE_REGISTERS = [
  'RAX', 'RBX', 'RCX', 'RDX', 'RSI', 'RDI', 'RBP', 'RSP',
  'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15',
] as const;

export const PHYSICAL_REGISTERS = [...GENERAL_PURPOSE_REGISTERS, 'RIP'] as const;
export type PhysicalRegister = (typeof PHYSICAL_REGISTERS)[number];

export interface RegisterDescriptor {
  name: string;
  physical: PhysicalRegister;
  width: 8 | 16 | 32 | 64;
  offset: 0 | 8;
  zeroExtends: boolean;
}

const descriptors: RegisterDescriptor[] = PHYSICAL_REGISTERS.map((name) => ({
  name,
  physical: name,
  width: 64,
  offset: 0,
  zeroExtends: false,
}));

// This family proves the alias model. Other families can be added as data only.
descriptors.push(
  { name: 'EAX', physical: 'RAX', width: 32, offset: 0, zeroExtends: true },
  { name: 'AX', physical: 'RAX', width: 16, offset: 0, zeroExtends: false },
  { name: 'AH', physical: 'RAX', width: 8, offset: 8, zeroExtends: false },
  { name: 'AL', physical: 'RAX', width: 8, offset: 0, zeroExtends: false },
);

const REGISTER_MAP = new Map(descriptors.map((descriptor) => [descriptor.name, descriptor]));

export function resolveRegister(name: string): RegisterDescriptor | undefined {
  return REGISTER_MAP.get(name.toUpperCase());
}

export function maskForWidth(width: number): bigint {
  return (1n << BigInt(width)) - 1n;
}

export function toUnsigned64(value: bigint): bigint {
  return BigInt.asUintN(64, value);
}
