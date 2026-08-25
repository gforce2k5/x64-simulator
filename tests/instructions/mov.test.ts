import { describe, expect, it } from 'vitest';
import { execute } from '../helpers';

describe('MOV', () => {
  it('moves an immediate into a register', () => {
    expect(execute('mov rax, 5').getState().readRegister('RAX')).toBe(5n);
  });

  it('moves between registers', () => {
    const state = execute('mov rax, 42\nmov rbx, rax').getState();
    expect(state.readRegister('RBX')).toBe(42n);
  });

  it('does not modify unrelated registers', () => {
    const state = execute('mov rax, 9').getState();
    expect(state.readRegister('RBX')).toBe(0n);
    expect(state.readRegister('R15')).toBe(0n);
  });

  it('zero-extends a 32-bit alias write', () => {
    const state = execute('mov rax, 0xffffffffffffffff\nmov eax, 1').getState();
    expect(state.readRegister('RAX')).toBe(1n);
  });
});
