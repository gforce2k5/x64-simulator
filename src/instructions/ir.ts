import type { RegisterDescriptor } from '../cpu/registers';

export type Opcode = 'MOV' | 'ADD' | 'SUB';

export interface RegisterOperand {
  kind: 'register';
  register: RegisterDescriptor;
}

export interface ImmediateOperand {
  kind: 'immediate';
  value: bigint;
}

export interface MemoryOperand {
  kind: 'memory';
  expression: string;
}

export type Operand = RegisterOperand | ImmediateOperand | MemoryOperand;

export interface SourceLocation {
  line: number;
  column: number;
}

export interface Instruction {
  opcode: Opcode;
  operands: Operand[];
  source: string;
  location: SourceLocation;
}
