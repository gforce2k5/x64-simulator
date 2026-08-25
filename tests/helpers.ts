import { ExecutionEngine } from '../src/execution/engine';
import { parseProgram } from '../src/parser/parser';

export function execute(source: string): ExecutionEngine {
  const engine = new ExecutionEngine();
  engine.load(parseProgram(source));
  while (engine.step()) { /* execute to completion */ }
  return engine;
}
