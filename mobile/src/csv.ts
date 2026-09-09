// Ported from the prototype's exportCsv() — one row per set, so the file is
// usable in a spreadsheet without unpacking.
import type { AppState } from './types';
import { est1rm } from './utils';
import { entryLog, rawHistory } from './store/derive';

function q(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function buildCsv(s: AppState): { csv: string; rowCount: number } {
  const U = s.units;
  const conv = (kg: number) => (U === 'lb' ? Math.round(kg * 2.2046 * 10) / 10 : kg);
  const rows: (string | number)[][] = [['date', 'workout', 'routine', 'exercise', 'set', 'weight_' + U, 'reps', 'est_1rm_' + U]];
  rawHistory(s).forEach((e) =>
    entryLog(e).forEach((ex) =>
      ex.sets.forEach((st, i) => {
        rows.push([e.iso, e.name, e.routine || e.name, ex.name, i + 1, conv(st.kg), st.reps, Math.round(conv(est1rm(st.kg, st.reps)) * 10) / 10]);
      })
    )
  );
  const csv = rows.map((r) => r.map(q).join(',')).join('\n');
  return { csv, rowCount: rows.length - 1 };
}
