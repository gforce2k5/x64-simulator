import type { FlagName } from '../cpu/flags';
import type { PhysicalRegister } from '../cpu/registers';
import type { Instruction } from '../instructions/ir';

export interface RegisterChange {
  register: PhysicalRegister;
  before: bigint;
  after: bigint;
}

export interface FlagChange {
  flag: FlagName;
  before: boolean;
  after: boolean;
}

export interface MemoryChange {
  address: bigint;
  before: number;
  after: number;
}

export interface ExecutionEvent {
  instruction: Instruction;
  registerChanges: RegisterChange[];
  flagChanges: FlagChange[];
  memoryChanges: MemoryChange[];
}
