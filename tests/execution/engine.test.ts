import { describe, expect, it } from 'vitest';
import { CpuState } from '../../src/cpu/state';
import { ExecutionEngine } from '../../src/execution/engine';
import { parseProgram } from '../../src/parser/parser';

describe('ExecutionEngine', () => {
  it('advances RIP once per instruction', () => {
    const engine = new ExecutionEngine();
    engine.load(parseProgram('mov rax, 1\nadd rax, 1'));
    engine.step();
    expect(engine.getState().readRegister('RIP')).toBe(1n);
    engine.step();
    expect(engine.getState().readRegister('RIP')).toBe(2n);
  });

  it('emits changes and protects internal state from callers', () => {
    const engine = new ExecutionEngine();
    engine.load(parseProgram('mov rax, 5'));
    const event = engine.step()!;
    expect(event.registerChanges).toEqual(expect.arrayContaining([
      { register: 'RAX', before: 0n, after: 5n },
      { register: 'RIP', before: 0n, after: 1n },
    ]));
    engine.getState().writeRegister('RAX', 99n);
    expect(engine.getState().readRegister('RAX')).toBe(5n);
  });

  it('resets registers, RIP, and history to the loaded initial state', () => {
    const initial = new CpuState({ RBX: 7n });
    const engine = new ExecutionEngine();
    engine.load(parseProgram('mov rax, 5'), initial);
    engine.step();
    const reset = engine.reset();
    expect(reset.readRegister('RAX')).toBe(0n);
    expect(reset.readRegister('RBX')).toBe(7n);
    expect(reset.readRegister('RIP')).toBe(0n);
    expect(engine.getHistory()).toHaveLength(0);
  });
});
