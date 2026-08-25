export type TokenKind = 'identifier' | 'number' | 'comma' | 'newline' | 'eof';

export interface Token {
  kind: TokenKind;
  text: string;
  line: number;
  column: number;
}

export class AssemblySyntaxError extends Error {
  constructor(message: string, readonly line: number, readonly column: number) {
    super(`${message} (line ${line}, column ${column})`);
    this.name = 'AssemblySyntaxError';
  }
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let line = 1;
  let column = 1;

  const push = (kind: TokenKind, text: string, startColumn = column) =>
    tokens.push({ kind, text, line, column: startColumn });

  while (index < source.length) {
    const char = source[index];
    if (char === ' ' || char === '\t' || char === '\r') {
      index += 1;
      column += 1;
      continue;
    }
    if (char === ';') {
      while (index < source.length && source[index] !== '\n') { index += 1; column += 1; }
      continue;
    }
    if (char === '\n') {
      push('newline', char);
      index += 1;
      line += 1;
      column = 1;
      continue;
    }
    if (char === ',') {
      push('comma', char);
      index += 1;
      column += 1;
      continue;
    }
    if (/[A-Za-z]/.test(char)) {
      const start = index;
      const startColumn = column;
      while (index < source.length && /[A-Za-z0-9]/.test(source[index])) { index += 1; column += 1; }
      push('identifier', source.slice(start, index), startColumn);
      continue;
    }
    if (char === '-' || /[0-9]/.test(char)) {
      const start = index;
      const startColumn = column;
      if (char === '-') { index += 1; column += 1; }
      if (source.slice(index, index + 2).toLowerCase() === '0x') {
        index += 2; column += 2;
        const digitsStart = index;
        while (index < source.length && /[0-9a-fA-F]/.test(source[index])) { index += 1; column += 1; }
        if (digitsStart === index) throw new AssemblySyntaxError('Expected hexadecimal digits', line, column);
      } else {
        const digitsStart = index;
        while (index < source.length && /[0-9]/.test(source[index])) { index += 1; column += 1; }
        if (digitsStart === index) throw new AssemblySyntaxError('Expected a number after minus sign', line, column);
      }
      push('number', source.slice(start, index), startColumn);
      continue;
    }
    throw new AssemblySyntaxError(`Unexpected character '${char}'`, line, column);
  }
  tokens.push({ kind: 'eof', text: '', line, column });
  return tokens;
}
