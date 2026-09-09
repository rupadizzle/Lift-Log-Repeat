export function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function iso(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function fromIso(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function dayDiff(a: string, b: string): number {
  return Math.round((fromIso(a).getTime() - fromIso(b).getTime()) / 86400000);
}

/** Monday-start weekday index: 0=Mon .. 6=Sun */
export function wdIdx(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function longDate(d: Date): string {
  return d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function shortDate(d: Date): string {
  return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

export function est1rm(kg: number, reps: number): number {
  return kg > 0 ? kg * (1 + reps / 30) : 0;
}

export function volLabel(v: number): string {
  return v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(Math.round(v));
}

export function clampS(lo: number, hi: number, v: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Round to one decimal, matching the prototype's `Math.round(x*10)/10` idiom. */
export function r1(v: number): number {
  return Math.round(v * 10) / 10;
}
