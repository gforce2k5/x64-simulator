import { FLAG_NAMES } from '../cpu/flags';
import { maskForWidth, type PhysicalRegister } from '../cpu/registers';
import { CpuState } from '../cpu/state';
import type { Instruction, RegisterOperand } from '../instructions/ir';
import type { ExecutionEvent } from './events';

function parityEven(byte: bigint): boolean {
  let bits = byte & 0xffn;
  let count = 0;
  while (bits) { count += Number(bits & 1n); bits >>= 1n; }
  return count % 2 === 0;
}

export class ExecutionEngine {
  private instructions: Instruction[] = [];
  private initialState = new CpuState();
  private state = this.initialState.clone();
  private history: ExecutionEvent[] = [];

  load(instructions: Instruction[], initialState = new CpuState()): CpuState {
    this.instructions = [...instructions];
    this.initialState = initialState.clone();
    this.state = initialState.clone();
    this.state.writeRegister('RIP', 0n);
    this.history = [];
    return this.getState();
  }

  getState(): CpuState { return this.state.clone(); }
  getHistory(): readonly ExecutionEvent[] { return this.history; }

  getCurrentInstruction(): Instruction | undefined {
    return this.instructions[Number(this.state.readRegister('RIP'))];
  }

  step(): ExecutionEvent | undefined {
    const instruction = this.getCurrentInstruction();
    if (!instruction) return undefined;
    const before = this.state.clone();
    this.execute(instruction);
    this.state.writeRegister('RIP', before.readRegister('RIP') + 1n);

    const beforeRegisters = before.snapshotRegisters();
    const afterRegisters = this.state.snapshotRegisters();
    const registerChanges = (Object.keys(afterRegisters) as PhysicalRegister[])
      .filter((register) => beforeRegisters[register] !== afterRegisters[register])
      .map((register) => ({ register, before: beforeRegisters[register], after: afterRegisters[register] }));
    const flagChanges = FLAG_NAMES
      .filter((flag) => before.flags[flag] !== this.state.flags[flag])
      .map((flag) => ({ flag, before: before.flags[flag], after: this.state.flags[flag] }));
    const event = { instruction, registerChanges, flagChanges, memoryChanges: [] } satisfies ExecutionEvent;
    this.history.push(event);
    return event;
  }

  reset(): CpuState {
    this.state = this.initialState.clone();
    this.state.writeRegister('RIP', 0n);
    this.history = [];
    return this.getState();
  }

  private execute(instruction: Instruction): void {
    const destination = instruction.operands[0] as RegisterOperand;
    const source = instruction.operands[1];
    const right = source.kind === 'register'
      ? this.state.readRegister(source.register.name)
      : source.kind === 'immediate' ? source.value : 0n;
    const left = this.state.readRegister(destination.register.name);
    if (instruction.opcode === 'MOV') {
      this.state.writeRegister(destination.register.name, right);
      return;
    }
    const width = destination.register.width;
    const mask = maskForWidth(width);
    const raw = instruction.opcode === 'ADD' ? left + right : left - right;
    const result = raw & mask;
    this.state.writeRegister(destination.register.name, result);
    this.updateArithmeticFlags(instruction.opcode, left, right & mask, result, width);
  }

  private updateArithmeticFlags(opcode: 'ADD' | 'SUB', left: bigint, right: bigint, result: bigint, width: number): void {
    const sign = 1n << BigInt(width - 1);
    const mask = maskForWidth(width);
    this.state.flags.ZF = result === 0n;
    this.state.flags.SF = (result & sign) !== 0n;
    this.state.flags.PF = parityEven(result);
    this.state.flags.AF = opcode === 'ADD' ? ((left & 0xfn) + (right & 0xfn)) > 0xfn : (left & 0xfn) < (right & 0xfn);
    this.state.flags.CF = opcode === 'ADD' ? left + right > mask : left < right;
    this.state.flags.OF = opcode === 'ADD'
      ? ((~(left ^ right) & (left ^ result) & sign) !== 0n)
      : (((left ^ right) & (left ^ result) & sign) !== 0n);
  }
}
