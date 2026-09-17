// Pure helpers that read (but never mutate) AppState — the TS equivalent of
// the read-only helper methods on the prototype's Component class
// (historyBests, lastSetsFor, entryLog, seedHistory, agoLabel, PR-map, …).
import { defaultDefs, defaultOrder, defaultSchedule, exLookup, LIBRARY, routineType, shortExName } from '../data';
import type { AppState, HistoryEntry, LibraryExercise, LoggedExercise, RoutineDefs, SetEntry } from '../types';
import type { Units } from '../types';
import { addDays, dayDiff, est1rm, fromIso, iso, longDate, r1, shortDate, todayDate, volLabel, wdIdx } from '../utils';

export function unitHelpers(U: Units) {
  const toU = (kg: number) => (U === 'lb' ? Math.round(kg * 2.2046) : kg);
  const stepU = U === 'lb' ? 5 : 2.5;
  const fmtSet = (kg: number, reps: number) => (kg === 0 ? 'BW' : toU(kg) + ' ' + U) + ' × ' + reps;
  const convPrev = (str: string) =>
    U === 'lb' && str
      ? str.replace(/([\d.]+)(\s*×)/, (_m, g, tail) => Math.round(parseFloat(g) * 2.2046) + tail)
      : str;
  return { toU, stepU, fmtSet, convPrev };
}

export function effDefs(s: AppState): RoutineDefs {
  return s.routineDefs || defaultDefs();
}
export function effOrder(s: AppState): string[] {
  return s.routineOrder || defaultOrder();
}
export function effSchedule(s: AppState): string[] {
  return s.weekSchedule || defaultSchedule();
}
export function validName(s: AppState, n: string | undefined | null): boolean {
  return !!n && n !== 'rest' && effOrder(s).includes(n);
}

export function allLibrary(s: AppState): LibraryExercise[] {
  return [...LIBRARY, ...(s.customEx || [])];
}

export function entryLog(e: HistoryEntry): LoggedExercise[] {
  if (e._log) return e._log;
  if (e._w) {
    return e._w.exercises
      .map((ex) => ({ name: ex.name, sets: ex.sets.filter((x) => x.done) }))
      .filter((x) => x.sets.length);
  }
  return [];
}

export function logTotals(log: LoggedExercise[]): { volume: number; sets: number } {
  let volume = 0;
  let sets = 0;
  log.forEach((e) => e.sets.forEach((x) => { volume += (x.kg || 0) * x.reps; sets++; }));
  return { volume, sets };
}

// A logged session built from a routine template, stepped back `stepDown` kg
// so older seed entries read as earlier points in a progression.
export function buildLog(
  routineName: string,
  stepDown: number,
  defList: RoutineDefs[string]
): LoggedExercise[] {
  const list = defList || [];
  return list.map((d) => {
    const e = exLookup(d.name);
    return {
      name: d.name,
      sets: Array.from({ length: d.sets }, (_, i) => {
        const p = e && (e.sets[i] || e.sets[e.sets.length - 1]);
        const base = p ? p[0] : 0;
        return { kg: base > 0 ? Math.max(2.5, base - stepDown) : 0, reps: e && e.sets[i] ? p![1] : d.reps };
      }),
    };
  });
}

// Demo history cache: walk back from yesterday and log a session on each day
// the *default* schedule calls for training, so calendar and plan always
// agree — whatever the real date is. Built from pristine defaults so editing
// a routine can never rewrite the past. Pure function of "today", so it's
// memoized at module scope by date stamp rather than living in AppState.
let _seedCache: HistoryEntry[] | null = null;
let _seedKey: string | null = null;
export function seedHistory(): HistoryEntry[] {
  const today = todayDate();
  const stamp = iso(today);
  if (_seedCache && _seedKey === stamp) return _seedCache;
  const sched = defaultSchedule();
  const pristine = defaultDefs();
  const days: { dt: Date; name: string }[] = [];
  for (let back = 1; back <= 26 && days.length < 8; back++) {
    const dt = addDays(today, -back);
    const name = sched[wdIdx(dt)];
    if (name === 'rest' || !pristine[name]) continue;
    days.push({ dt, name });
  }
  days.reverse();
  const out = days
    .map((x, i) => {
      const step = Math.round((days.length - 1 - i) / 2) * 2.5;
      const log = buildLog(x.name, step, pristine[x.name]);
      const t = logTotals(log);
      return {
        name: x.name,
        routine: x.name,
        iso: iso(x.dt),
        date: shortDate(x.dt),
        duration: (5 + t.sets * 4) + ' min',
        volNum: t.volume,
        sets: t.sets,
        volume: volLabel(t.volume),
        _log: log,
      } as HistoryEntry;
    })
    .reverse();
  _seedCache = out;
  _seedKey = stamp;
  return out;
}

export function rawHistory(s: AppState): HistoryEntry[] {
  return [...s.saved, ...seedHistory()].sort((a, b) => dayDiff(b.iso, a.iso));
}

export function historyBests(s: AppState, exclude?: HistoryEntry): Record<string, number> {
  const bests: Record<string, number> = {};
  [...seedHistory(), ...s.saved].forEach((e) => {
    if (e === exclude) return;
    entryLog(e).forEach((ex) =>
      ex.sets.forEach((st) => {
        const v = est1rm(st.kg, st.reps);
        if (v > 0 && (!bests[ex.name] || v > bests[ex.name])) bests[ex.name] = v;
      })
    );
  });
  return bests;
}

export function lastSetsFor(s: AppState, name: string) {
  const all = [...s.saved, ...seedHistory()].sort((a, b) => dayDiff(b.iso, a.iso));
  for (const e of all) {
    const hit = entryLog(e).find((x) => x.name === name);
    if (hit && hit.sets.length) return hit.sets;
  }
  return null;
}

export function agoLabel(s: AppState, name: string): string {
  const hist = rawHistory(s);
  const lastByName: Record<string, string> = {};
  hist.forEach((w) => {
    const k = w.routine || w.name;
    if (lastByName[k] === undefined) lastByName[k] = w.iso;
  });
  const keys = [name, ...((s.routineAlias || {})[name] || [])];
  const d = keys.map((k) => lastByName[k]).filter(Boolean).sort().pop();
  if (d === undefined) return 'never';
  const todayIso = iso(todayDate());
  const diff = dayDiff(todayIso, d);
  return diff <= 0 ? 'today' : diff === 1 ? 'yesterday' : diff + 'd ago';
}

/** PRs are derived, not stored: walk history oldest -> newest, mark each
 * session's exercises that beat every earlier session's best est. 1RM. */
export function prMapFor(s: AppState): Map<HistoryEntry, string[]> {
  const hist = rawHistory(s);
  const prMap = new Map<HistoryEntry, string[]>();
  const runBest: Record<string, number> = {};
  [...hist].reverse().forEach((e) => {
    const names: string[] = [];
    entryLog(e).forEach((ex) => {
      let top = 0;
      ex.sets.forEach((st) => { top = Math.max(top, est1rm(st.kg, st.reps)); });
      if (top > 0 && (!runBest[ex.name] || top > runBest[ex.name] + 0.01)) {
        runBest[ex.name] = top;
        names.push(ex.name);
      }
    });
    prMap.set(e, names);
  });
  return prMap;
}

export function scheduledFor(s: AppState, isoD: string): string | null {
  const ov = (s.dateOverrides || {})[isoD];
  const name = ov !== undefined ? ov : effSchedule(s)[wdIdx(fromIso(isoD))];
  const order = effOrder(s);
  return name !== 'rest' && order.includes(name) ? name : null;
}

/** A name is unavailable if a routine uses it now, or once did (alias). */
export function nameHeld(s: AppState, name: string, except?: string | null): boolean {
  const order = effOrder(s);
  if (order.some((n) => n !== except && n === name)) return true;
  const alias = s.routineAlias || {};
  return Object.keys(alias).some((k) => k !== except && alias[k].includes(name));
}

// ------------------------------------------------------- Today viewmodels -

/** Repeat-last target: the most recent session's routine, if that routine
 * still exists (renames are followed via routineAlias at the store level;
 * a deleted routine has no order entry, so repeat correctly disappears). */
export function lastRoutineName(s: AppState): string {
  const hist = rawHistory(s);
  const lastEntry = hist[0] || null;
  const lastRoutine = lastEntry ? lastEntry.routine || lastEntry.name : '';
  return effOrder(s).includes(lastRoutine) ? lastRoutine : '';
}

export type HeroVM =
  | { kind: 'resume'; name: string; sub: string }
  | { kind: 'done'; name: string; sub: string; nextName: string; entry: HistoryEntry }
  | { kind: 'rest'; name: string; sub: string }
  | { kind: 'plan'; name: string; meta: string; line: string; showRepeat: boolean; lastName: string };

export function computeHero(s: AppState): HeroVM {
  const todayD = todayDate();
  const todayIso = iso(todayD);
  const todayIdx = wdIdx(todayD);
  const order = effOrder(s);
  const defs = effDefs(s);
  const sched = effSchedule(s);
  const todayOv = (s.dateOverrides || {})[todayIso];
  const scheduledToday = todayOv !== undefined ? todayOv : sched[todayIdx];
  const trainedToday = s.saved.some((e) => e.iso === todayIso);

  if (s.workout && s.workout.exercises.length) {
    const setsLeft = s.workout.exercises.reduce((a, ex) => a + ex.sets.filter((x) => !x.done).length, 0);
    const forPast = s.logDate ? 'Logging ' + shortDate(fromIso(s.logDate)) + ' · ' : '';
    return { kind: 'resume', name: s.workout.name, sub: `${forPast}${setsLeft} set${setsLeft !== 1 ? 's' : ''} left` };
  }
  if (trainedToday) {
    const last = s.saved.find((e) => e.iso === todayIso)!;
    const nextName = order.find((n) => n !== last.name) || order[0];
    return { kind: 'done', name: last.name, sub: `${last.volume} volume · ${last.sets} sets · ${last.duration}`, nextName, entry: last };
  }
  if (!validName(s, scheduledToday)) {
    return { kind: 'rest', name: order[0] || 'Push Day', sub: 'Nothing scheduled today. Recover well — or train anyway.' };
  }
  const list = defs[scheduledToday] || [];
  const lastName = lastRoutineName(s);
  return {
    kind: 'plan',
    name: scheduledToday,
    meta: `${list.length} exercise${list.length !== 1 ? 's' : ''} · today's plan`,
    line: list.map((d) => shortExName(d.name)).join('  ·  '),
    showRepeat: !!(lastName && lastName !== scheduledToday),
    lastName,
  };
}

export function weeklyGoal(s: AppState): { goalTarget: number; weekDone: number; goalLine: string } {
  const todayD = todayDate();
  const todayIdx = wdIdx(todayD);
  const sched = effSchedule(s);
  const goalTarget = sched.filter((n) => validName(s, n)).length;
  const monday = iso(addDays(todayD, -todayIdx));
  const sunday = iso(addDays(todayD, 6 - todayIdx));
  const hist = rawHistory(s);
  const weekDone = new Set(hist.filter((w) => w.iso >= monday && w.iso <= sunday).map((w) => w.iso)).size;
  const goalLine = weekDone >= goalTarget
    ? `Weekly goal complete · ${weekDone}/${goalTarget}`
    : `${weekDone} of ${goalTarget} days this week`;
  return { goalTarget, weekDone, goalLine };
}

export interface CalCell {
  num: string;
  iso?: string;
  wd?: number;
  entry?: HistoryEntry;
  isToday?: boolean;
  isFuture?: boolean;
  worked?: boolean;
  planned?: boolean;
}

// -------------------------------------------------------- Logging screen --

export interface DoneSetVM { idx: number; label: string; val: string }
export interface SetPillVM { idx: number; done: boolean; isCurrent: boolean }
export interface CurrentSetVM {
  name: string; target?: string;
  e1rmText: string; hasE1rm: boolean;
  prBarText: string; beatingPr: boolean;
  position: string; setLabel: string; prevDisplay: string;
  kgDisplay: string; repsDisplay: number;
  doneSets: DoneSetVM[]; anyDone: boolean;
  setPills: SetPillVM[];
}

export function computeCurrentSet(s: AppState): CurrentSetVM | null {
  if (!s.workout || !s.workout.exercises.length) return null;
  const { toU, convPrev } = unitHelpers(s.units);
  const exs = s.workout.exercises;
  const ei = s.curEx;
  const si = s.curSet;
  const ex = exs[ei];
  const st = ex.sets[si];
  const e1 = est1rm(st.kg, st.reps);
  const best = s.bests[ex.name] || 0;
  const gap = e1 - best;
  return {
    name: ex.name,
    target: ex.target,
    e1rmText: e1 > 0 ? toU(r1(e1)) + ' ' + s.units : '—',
    hasE1rm: e1 > 0,
    prBarText: best > 0
      ? gap > 0.01 ? `beats your best by ${toU(r1(gap))} ${s.units}` : `best ${toU(r1(best))} ${s.units}`
      : 'first time logged',
    beatingPr: best > 0 && gap > 0.01,
    position: `Exercise ${ei + 1} / ${exs.length}`,
    setLabel: `Set ${si + 1} of ${ex.sets.length}`,
    prevDisplay: convPrev(st.prev || '—'),
    kgDisplay: st.kg === 0 ? '' : String(toU(st.kg)),
    repsDisplay: st.reps,
    doneSets: ex.sets
      .map((p, i) => ({ p, i }))
      .filter((x) => x.p.done)
      .map(({ p, i }) => ({ idx: i, label: 'Set ' + (i + 1), val: (p.kg === 0 ? 'BW' : toU(p.kg) + ' ' + s.units) + ' × ' + p.reps })),
    anyDone: ex.sets.some((p) => p.done),
    setPills: ex.sets.map((p, i) => ({ idx: i, done: !!p.done, isCurrent: i === si })),
  };
}

export type ProgressState = 'done' | 'current' | 'upcoming';
export function computeProgress(s: AppState): ProgressState[] {
  if (!s.workout) return [];
  return s.workout.exercises.map((_, i) => (i < s.curEx ? 'done' : i === s.curEx ? 'current' : 'upcoming'));
}

export interface ExListItemVM {
  name: string; status: string; isCurrent: boolean; allDone: boolean;
  isFirst: boolean; isLast: boolean; cantRemove: boolean;
}
export function computeExList(s: AppState): ExListItemVM[] {
  if (!s.workout) return [];
  return s.workout.exercises.map((ex, i) => {
    const doneCount = ex.sets.filter((x) => x.done).length;
    const allDone = doneCount === ex.sets.length;
    const isCur = i === s.curEx;
    const status = isCur
      ? `Now · ${doneCount}/${ex.sets.length} sets`
      : allDone ? `Done · ${doneCount}/${ex.sets.length} sets` : `${doneCount}/${ex.sets.length} sets`;
    return { name: ex.name, status, isCurrent: isCur, allDone, isFirst: i === 0, isLast: i === s.workout!.exercises.length - 1, cantRemove: s.workout!.exercises.length <= 1 };
  });
}

/** Shared by the in-workout add-exercise sheet and the routine editor's. */
export function filterLibrary(s: AppState, query: string, excludeNames: string[] = []) {
  const q = query.trim().toLowerCase();
  return allLibrary(s).filter(
    (l) => !excludeNames.includes(l.name) && (!q || l.name.toLowerCase().includes(q) || l.group.toLowerCase().includes(q))
  );
}
export function canCreateExercise(s: AppState, query: string): boolean {
  const q = query.trim().toLowerCase();
  return !!q && !allLibrary(s).some((l) => l.name.toLowerCase() === q);
}

// ------------------------------------------------------ Workout detail VM -

export interface DetailSetVM { idx: number; val: string; best: boolean }
export interface DetailExerciseVM { name: string; exI: number; pr: boolean; e1rmLine: string; hasE1rm: boolean; sets: DetailSetVM[] }
export interface DetailVM {
  name: string; date: string; duration: string;
  volume: string; volUnit: string; sets: number; prs: number; prNote: string;
  exercises: DetailExerciseVM[];
  isMine: boolean;
  canResume: boolean;
  canRepeat: boolean;
}

export function computeDetail(s: AppState, de: HistoryEntry | null): DetailVM | null {
  if (!de) return null;
  const { toU, fmtSet } = unitHelpers(s.units);
  const topIdx = (sets: SetEntry[]) =>
    sets.reduce((bi, x, i) => {
      const b = sets[bi];
      return x.kg > b.kg || (x.kg === b.kg && x.reps > b.reps) ? i : bi;
    }, 0);
  const log: LoggedExercise[] = de._w
    ? de._w.exercises.map((ex) => ({ name: ex.name, sets: ex.sets.filter((x) => x.done) }))
    : de._log || [];
  const prNames = prMapFor(s).get(de) || [];
  const isMine = s.saved.includes(de);
  const exercises: DetailExerciseVM[] = log
    // exI must be the exercise's real index in `log` (== `_log`/`_w.exercises`
    // once done-filtered) — that's what editSavedSet/addSavedSet/removeSavedSet
    // index into. Capture it here, before the .filter() below can drop an
    // exercise (a resumable `_w` session can have one with zero done sets
    // sitting mid-array) and shift array positions out from under it.
    .map((ex, trueIndex) => {
      const bi = ex.sets.length ? topIdx(ex.sets) : -1;
      const top1rm = ex.sets.reduce((a, st) => Math.max(a, est1rm(st.kg, st.reps)), 0);
      return {
        name: ex.name,
        exI: trueIndex,
        pr: prNames.includes(ex.name),
        e1rmLine: top1rm > 0 ? 'Est. 1RM ' + toU(r1(top1rm)) + ' ' + s.units : '',
        hasE1rm: top1rm > 0,
        sets: ex.sets.map((x, j) => ({ idx: j, val: fmtSet(x.kg, x.reps), best: j === bi && x.kg > 0 })),
      };
    })
    .filter((e) => e.sets.length);
  return {
    name: de.name, date: de.date, duration: de.duration,
    volume: volLabel(toU(de.volNum || 0)), volUnit: 'Volume · ' + s.units,
    sets: de.sets, prs: prNames.length,
    prNote: prNames.length ? 'PR = best estimated one-rep max for that lift · ✦ marks the top set' : "✦ marks each exercise's top set",
    exercises, isMine,
    canResume: !s.editSets && !!de._w && de._w.exercises.some((ex) => ex.sets.some((x) => !x.done)),
    canRepeat: effOrder(s).includes(de.routine || de.name),
  };
}

// ---------------------------------------------------- Routine editor VM ---

export interface RoutineEditItemVM {
  name: string; index: number; sets: number; reps: number;
  isFirst: boolean; isLast: boolean; cantRemove: boolean;
}
export interface RoutineEditorVM {
  name: string; nameValue: string; nameTaken: boolean;
  adding: boolean;
  items: RoutineEditItemVM[];
}
export function computeRoutineEditor(s: AppState): RoutineEditorVM | null {
  if (!s.editName) return null;
  const defs = effDefs(s);
  const list = defs[s.editName] || [];
  return {
    name: s.editName,
    nameValue: s.nameDraft == null ? s.editName : s.nameDraft,
    nameTaken: !!s.nameTaken,
    adding: s.editAdding,
    items: list.map((d, i) => ({ name: d.name, index: i, sets: d.sets, reps: d.reps, isFirst: i === 0, isLast: i === list.length - 1, cantRemove: list.length <= 1 })),
  };
}

// ------------------------------------------------------- Day picker VM ----

export interface DayPickerOptionVM { label: string; value: string; active: boolean }
export interface DayPickerVM {
  mode: 'backlog' | 'date' | 'weekday';
  day: string; sub: string;
  options: DayPickerOptionVM[];
  createLabel: string;
  createIso?: string;
}
const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function computeDayPicker(s: AppState): DayPickerVM | null {
  const order = effOrder(s);
  const sched = effSchedule(s);
  if (s.backlogDate) {
    return {
      mode: 'backlog',
      day: longDate(fromIso(s.backlogDate.iso)),
      sub: 'Log the workout you did — you enter the real sets',
      options: order.map((n) => ({ label: n, value: n, active: false })),
      createLabel: 'New routine',
    };
  }
  if (s.calEditDate) {
    const cur = (s.dateOverrides || {})[s.calEditDate.iso] !== undefined ? s.dateOverrides[s.calEditDate.iso] : sched[s.calEditDate.wd];
    const options = [...order.map((n) => ({ label: n, value: n })), { label: 'Rest day', value: 'rest' }]
      .map((o) => ({ ...o, active: cur === o.value || (o.value === 'rest' && !validName(s, cur)) }));
    return {
      mode: 'date', day: longDate(fromIso(s.calEditDate.iso)), sub: 'Assign a routine or a rest day',
      options, createLabel: 'New routine for this day', createIso: s.calEditDate.iso,
    };
  }
  if (s.editDay !== null && s.editDay !== undefined) {
    const dayFull = WEEKDAY_NAMES[s.editDay];
    const cur = sched[s.editDay];
    const options = [...order.map((n) => ({ label: n, value: n })), { label: 'Rest day', value: 'rest' }]
      .map((o) => ({ ...o, active: cur === o.value || (o.value === 'rest' && !validName(s, cur)) }));
    return { mode: 'weekday', day: dayFull, sub: 'Assign a routine or a rest day', options, createLabel: 'New routine' };
  }
  return null;
}

// ------------------------------------------------------------ Profile VM --

export interface ProfileVM {
  workouts: number; volume: string; volUnit: string; since: string; week: string; initials: string;
  storageLine: string;
}
export function computeProfile(s: AppState): ProfileVM {
  const hist = rawHistory(s);
  const { toU } = unitHelpers(s.units);
  const lifetimeVol = volLabel(toU(hist.reduce((a, w) => a + (w.volNum || 0), 0)));
  const goal = weeklyGoal(s);
  return {
    workouts: hist.length,
    volume: lifetimeVol,
    volUnit: s.units === 'lb' ? 'Lb lifted' : 'Kg lifted',
    since: hist.length
      ? 'Training log since ' + fromIso(hist[hist.length - 1].iso).toLocaleDateString('en', { month: 'long', year: 'numeric' })
      : 'No workouts logged yet',
    week: goal.weekDone + '/' + goal.goalTarget,
    initials: (s.userName || '?').trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
    storageLine: hist.length
      ? `${s.saved.length} of ${hist.length} workouts are yours · the rest is sample data`
      : 'Nothing logged yet',
  };
}

export interface RoutineCardVM {
  name: string;
  type: 'push' | 'pull' | 'legs';
  metaLine: string;
  exercisesLine: string;
  canReorder: boolean;
  isFirst: boolean;
  isLast: boolean;
  hasExercises: boolean;
}

export function computeRoutineCards(s: AppState): RoutineCardVM[] {
  const defs = effDefs(s);
  const order = effOrder(s);
  return order.map((name, ri) => {
    const list = defs[name] || [];
    const totalSets = list.reduce((a, d) => a + d.sets, 0);
    return {
      name,
      type: routineType(name),
      metaLine: `${list.length} exercise${list.length !== 1 ? 's' : ''} · ~${5 + totalSets * 4} min · last ${agoLabel(s, name)}`,
      exercisesLine: list.length ? list.map((d) => shortExName(d.name)).join(' · ') : 'No exercises yet — tap Edit to build it',
      canReorder: order.length > 1,
      isFirst: ri === 0,
      isLast: ri === order.length - 1,
      hasExercises: list.length > 0,
    };
  });
}

export function computeCalendar(s: AppState): { title: string; cells: CalCell[] } {
  const todayD = todayDate();
  const todayIso = iso(todayD);
  const hist = rawHistory(s);
  const dayEntry: Record<string, HistoryEntry> = {};
  hist.forEach((w) => { dayEntry[w.iso] = w; });
  const view = new Date(todayD.getFullYear(), todayD.getMonth() + (s.calOff || 0), 1);
  const title = view.toLocaleString('en', { month: 'long' }) + ' ' + view.getFullYear();
  const startOff = wdIdx(view);
  const dim = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const sched = effSchedule(s);
  const cells: CalCell[] = [];
  for (let i = 0; i < startOff; i++) cells.push({ num: '' });
  for (let d = 1; d <= dim; d++) {
    const dt = new Date(view.getFullYear(), view.getMonth(), d);
    const dIso = iso(dt);
    const entry = dayEntry[dIso];
    const worked = !!entry;
    const isToday = dIso === todayIso;
    const isFuture = dIso > todayIso;
    const wd = wdIdx(dt);
    const ovName = (s.dateOverrides || {})[dIso];
    const effName = ovName !== undefined ? ovName : sched[wd];
    const planned = (isToday || isFuture) && validName(s, effName);
    cells.push({ num: String(d), iso: dIso, wd, entry, isToday, isFuture, worked, planned });
  }
  return { title, cells };
}
