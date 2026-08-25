import { describe, expect, it } from 'vitest';
import { execute } from '../helpers';

describe('arithmetic', () => {
  it('adds register operands', () => {
    expect(execute('mov rax, 5\nmov rbx, 10\nadd rax, rbx').getState().readRegister('RAX')).toBe(15n);
  });

  it('subtracts an immediate operand', () => {
    expect(execute('mov rax, 15\nsub rax, 3').getState().readRegister('RAX')).toBe(12n);
  });

  it('wraps addition at 64 bits', () => {
    const state = execute('mov rax, 0xffffffffffffffff\nadd rax, 1').getState();
    expect(state.readRegister('RAX')).toBe(0n);
    expect(state.flags.CF).toBe(true);
    expect(state.flags.ZF).toBe(true);
  });

  it('wraps subtraction at 64 bits', () => {
    expect(execute('mov rax, 0\nsub rax, 1').getState().readRegister('RAX')).toBe(0xffffffffffffffffn);
  });
});
