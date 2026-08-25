import { createFlags, type Flags } from './flags';
import { Memory } from './memory';
import { PHYSICAL_REGISTERS, maskForWidth, resolveRegister, toUnsigned64, type PhysicalRegister } from './registers';

export class CpuState {
  private readonly registers: Record<PhysicalRegister, bigint>;
  readonly flags: Flags;
  readonly memory: Memory;

  constructor(
    registers?: Partial<Record<PhysicalRegister, bigint>>,
    flags: Flags = createFlags(),
    memory: Memory = new Memory(),
  ) {
    this.registers = Object.fromEntries(
      PHYSICAL_REGISTERS.map((name) => [name, toUnsigned64(registers?.[name] ?? 0n)]),
    ) as Record<PhysicalRegister, bigint>;
    this.flags = { ...flags };
    this.memory = memory;
  }

  readRegister(name: string): bigint {
    const descriptor = resolveRegister(name);
    if (!descriptor) throw new Error(`Unknown register: ${name}`);
    return (this.registers[descriptor.physical] >> BigInt(descriptor.offset)) & maskForWidth(descriptor.width);
  }

  writeRegister(name: string, value: bigint): void {
    const descriptor = resolveRegister(name);
    if (!descriptor) throw new Error(`Unknown register: ${name}`);
    const valueMask = maskForWidth(descriptor.width);
    const narrowed = value & valueMask;

    if (descriptor.width === 64 || descriptor.zeroExtends) {
      this.registers[descriptor.physical] = toUnsigned64(narrowed);
      return;
    }

    const shiftedMask = valueMask << BigInt(descriptor.offset);
    const preserved = this.registers[descriptor.physical] & ~shiftedMask;
    this.registers[descriptor.physical] = toUnsigned64(preserved | (narrowed << BigInt(descriptor.offset)));
  }

  clone(): CpuState {
    return new CpuState(this.registers, this.flags, this.memory.clone());
  }

  snapshotRegisters(): Readonly<Record<PhysicalRegister, bigint>> {
    return { ...this.registers };
  }
}
