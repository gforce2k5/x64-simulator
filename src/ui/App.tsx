import { useMemo, useState } from 'react';
import { GENERAL_PURPOSE_REGISTERS } from '../cpu/registers';
import { ExecutionEngine } from '../execution/engine';
import type { ExecutionEvent } from '../execution/events';
import { parseProgram } from '../parser/parser';
import { formatHex } from './format';
import './styles.css';

const DEFAULT_SOURCE = `mov rax, 5
mov rbx, 10
add rax, rbx
sub rax, 3`;

export function App() {
  const engine = useMemo(() => new ExecutionEngine(), []);
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string>();

  const load = () => {
    try {
      engine.load(parseProgram(source));
      setError(undefined);
      setVersion((value) => value + 1);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      return false;
    }
  };

  const step = () => {
    if (engine.getHistory().length === 0 && engine.getCurrentInstruction() === undefined && !load()) return;
    // load() updates React later, but the engine itself is ready synchronously.
    if (engine.getCurrentInstruction() === undefined && engine.getHistory().length === 0) return;
    engine.step();
    setVersion((value) => value + 1);
  };

  const reset = () => {
    try {
      engine.load(parseProgram(source));
      setError(undefined);
      setVersion((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const state = engine.getState();
  const current = engine.getCurrentInstruction();
  const history = engine.getHistory();
  void version;

  return (
    <main className="app-shell">
      <header>
        <p className="eyebrow">ARCHITECTURAL LAB</p>
        <h1>x86-64 Simulator</h1>
        <p className="subtitle">A small, inspectable model of architectural state.</p>
      </header>

      <section className="workspace">
        <div className="editor-card panel">
          <div className="panel-heading"><h2>Assembly</h2><span>Intel syntax</span></div>
          <textarea aria-label="Assembly source" value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} />
          {error && <p className="error" role="alert">{error}</p>}
          <div className="controls">
            <button className="primary" onClick={step}>Step</button>
            <button onClick={reset}>Reset</button>
          </div>
          <div className="current-instruction">
            <span>Next instruction</span>
            <code>{current ? `${current.location.line}: ${current.source}` : history.length ? 'Program complete' : 'Press Step to load'}</code>
          </div>
        </div>

        <div className="register-card panel">
          <div className="panel-heading"><h2>Registers</h2><span>64-bit unsigned</span></div>
          <div className="register-grid">
            {[...GENERAL_PURPOSE_REGISTERS, 'RIP' as const].map((register) => (
              <div className={register === 'RIP' ? 'register rip' : 'register'} key={register}>
                <span>{register}</span><code>{formatHex(state.readRegister(register))}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="history panel">
        <div className="panel-heading"><h2>Execution history</h2><span>{history.length} events</span></div>
        {history.length === 0 ? <p className="empty">No instructions executed yet.</p> : (
          <ol>
            {history.map((event, index) => <HistoryItem event={event} key={index} />)}
          </ol>
        )}
      </section>
    </main>
  );
}

function HistoryItem({ event }: { event: ExecutionEvent }) {
  const meaningful = event.registerChanges.filter((change) => change.register !== 'RIP');
  return (
    <li>
      <code className="instruction">{event.instruction.source}</code>
      <div className="changes">
        {meaningful.map((change) => (
          <span key={change.register}>{change.register}: {formatHex(change.before)} → {formatHex(change.after)}</span>
        ))}
        {event.flagChanges.map((change) => <span key={change.flag}>{change.flag}: {Number(change.before)} → {Number(change.after)}</span>)}
      </div>
    </li>
  );
}
