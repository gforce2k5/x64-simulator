import type { Instruction, Opcode, Operand, RegisterOperand } from '../instructions/ir';
import { resolveRegister } from '../cpu/registers';
import { AssemblySyntaxError, tokenize, type Token } from './tokenizer';

const OPCODES = new Set<Opcode>(['MOV', 'ADD', 'SUB']);

export function parseProgram(source: string): Instruction[] {
  const tokens = tokenize(source);
  const instructions: Instruction[] = [];
  let cursor = 0;
  const current = () => tokens[cursor];
  const consume = () => tokens[cursor++];
  const fail = (message: string, token: Token = current()): never => {
    throw new AssemblySyntaxError(message, token.line, token.column);
  };

  while (current().kind !== 'eof') {
    if (current().kind === 'newline') { consume(); continue; }
    const opcodeToken = consume();
    const opcode = opcodeToken.text.toUpperCase() as Opcode;
    if (opcodeToken.kind !== 'identifier' || !OPCODES.has(opcode)) fail(`Unknown opcode '${opcodeToken.text}'`, opcodeToken);

    const operands: Operand[] = [];
    while (current().kind !== 'newline' && current().kind !== 'eof') {
      const token = consume();
      if (token.kind === 'identifier') {
        const register = resolveRegister(token.text);
        if (register) operands.push({ kind: 'register', register });
        else fail(`Unknown register '${token.text}'`, token);
      } else if (token.kind === 'number') {
        operands.push({ kind: 'immediate', value: BigInt(token.text) });
      } else {
        fail('Expected a register or immediate', token);
      }
      if (current().kind === 'comma') consume();
      else if (current().kind !== 'newline' && current().kind !== 'eof') fail("Expected ',' between operands");
    }
    if (operands.length !== 2) fail(`${opcode} expects two operands`, opcodeToken);
    const destination = operands[0];
    if (destination.kind !== 'register') fail(`${opcode} destination must be a register`, opcodeToken);
    const destinationRegister = destination as RegisterOperand;
    if (operands[1].kind === 'memory') fail('Memory operands are not implemented', opcodeToken);
    if (operands[1].kind === 'register' && operands[1].register.width !== destinationRegister.register.width) {
      fail('Register operands must have the same width', opcodeToken);
    }

    const lineEnd = source.split(/\r?\n/)[opcodeToken.line - 1] ?? '';
    instructions.push({ opcode, operands, source: lineEnd.trim(), location: { line: opcodeToken.line, column: opcodeToken.column } });
    if (current().kind === 'newline') consume();
  }
  return instructions;
}
