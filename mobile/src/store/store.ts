// Ported 1:1 (business logic, not markup) from the prototype's `Component`
// class in Workout Tracker.dc.html. Where the web prototype used
// structuredClone + React setState, this uses Immer draft mutation +
// zustand — the semantics (what changes, in what order, what stays the
// same) are kept identical.
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { defaultDefs, defaultOrder, defaultSchedule, exLookup, TEMPLATES } from '../data';
import type {
  AppState,
  ConfirmConfig,
  LibraryExercise,
  LiveWorkout,
  RoutineExerciseDef,
  SavedEntry,
  Theme,
  Units,
} from '../types';
import { playRestBuzz, playRestChime } from '../sound';
import { dayDiff, est1rm, fromIso, iso, longDate, r1, shortDate, todayDate, volLabel, wdIdx } from '../utils';
import {
  allLibrary,
  effDefs,
  effOrder,
  entryLog,
  historyBests,
  lastSetsFor,
  logTotals,
  nameHeld,
  prMapFor,
  scheduledFor,
} from './derive';

export function initialState(): AppState {
  return {
    authed: false,
    nameEntry: '',
    tab: 'today',
    logging: false,
    workout: null,
    startTs: 0,
    elapsed: 0,
    curEx: 0,
    curSet: 0,
    showPr: false,
    prDetail: '',
    sessionPrs: [],
    bests: {},
    logDate: null,
    backlogDate: null,
    rest: 0,
    restEnd: 0,
    restDur: 90,
    restDone: false,
    showPicker: false,
    showAddEx: false,
    addQuery: '',
    saved: [],
    detailEntry: null,
    editSets: false,
    routineDefs: null,
    routineOrder: null,
    routineAlias: {},
    editName: null,
    editAdding: false,
    editQuery: '',
    editPicks: [],
    nameDraft: null,
    nameTaken: false,
    weekSchedule: null,
    editDay: null,
    calEditDate: null,
    dateOverrides: {},
    calOff: 0,
    customEx: [],
    userName: 'Alex',
    units: 'kg',
    theme: 'dark',
    notif: true,
    notifHour: 18,
    notifPerm: 'default',
    lastNotified: null,
    sound: true,
    haptics: true,
    showProfile: false,
    confirm: null,
    toast: '',
    schema: 3,
  };
}

export interface Store extends AppState {
  hydrated: boolean;

  patch: (partial: Partial<AppState>) => void;
  hydrate: (persisted: Partial<AppState> | null) => void;

  // toast / confirm
  toast_: (msg: string) => void;
  askConfirm: (cfg: ConfirmConfig) => void;
  clearConfirm: () => void;

  // auth
  beginLocal: () => void;
  eraseAll: () => void;

  // reminders
  checkReminder: () => { name: string; iso: string } | null;
  markNotified: (iso: string) => void;

  // rest defaults / live adjust (same handler serves both, like the prototype)
  restMinus: () => void;
  restPlus: () => void;
  skipRest: () => void;
  tick: () => void;

  // routines
  openEdit: (name: string) => void;
  setNameDraft: (v: string) => void;
  commitName: () => boolean;
  closeEdit: () => void;
  openEditAdd: () => void;
  closeEditAdd: () => void;
  setEditQuery: (q: string) => void;
  newRoutine: (forDate?: string | null) => void;
  moveRoutine: (name: string, dir: 1 | -1) => void;
  removeRoutineEx: (i: number) => void;
  moveRoutineEx: (i: number, dir: 1 | -1) => void;
  togglePick: (name: string) => void;
  addRoutineEx: (name: string) => void;
  commitPicks: () => void;
  setRoutineTarget: (i: number, field: 'sets' | 'reps', delta: number) => void;
  deleteRoutine: () => void;
  renameRoutine: (nn: string) => void;
  createExercise: (raw: string, then?: (name: string) => void) => void;

  // schedule / calendar
  assignDay: (name: string) => void;
  setCalOff: (fn: (n: number) => number) => void;
  calToday: () => void;
  openWeekdayPicker: (day: number) => void;
  openCalEditDate: (iso: string, wd: number) => void;
  openBacklogDate: (iso: string, wd: number) => void;
  closeDayPicker: () => void;
  openDetailFor: (entry: SavedEntry) => void;

  // active workout
  start: (key: string, logDate?: string | null) => void;
  startEmpty: () => void;
  addSet: (ei: number) => void;
  step: (ei: number, si: number, field: 'kg' | 'reps', delta: number) => void;
  setField: (ei: number, si: number, field: 'kg' | 'reps', raw: string) => void;
  completeSet: () => void;
  backSet: () => void;
  deferEx: () => void;
  jumpSet: (ei: number, si: number) => void;
  jumpTo: (ei: number) => void;
  moveEx: (ei: number, dir: 1 | -1) => void;
  addExerciseToWorkout: (name: string) => void;
  removeExercise: (ei: number) => void;
  finishWorkout: () => void;
  cancelLogging: () => void;
  openPicker: () => void;
  closePicker: () => void;
  openAddEx: () => void;
  closeAddEx: () => void;
  setAddQuery: (q: string) => void;
  finish: () => void;

  // history / detail
  editSavedSet: (entry: SavedEntry, exI: number, setI: number, field: 'kg' | 'reps', delta: number) => void;
  addSavedSet: (entry: SavedEntry, exI: number) => void;
  removeSavedSet: (entry: SavedEntry, exI: number, setI: number) => void;
  closeDetail: () => void;
  toggleEditSets: () => void;
  deleteSession: (entry: SavedEntry) => void;
  resumeSession: (entry: SavedEntry) => void;
  repeatRoutine: (name: string) => void;

  // profile / settings
  setUserName: (v: string) => void;
  setUnits: (u: Units) => void;
  setTheme: (t: Theme) => void;
  toggleNotif: () => void;
  notifEarlier: () => void;
  notifLater: () => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  openProfile: () => void;
  closeProfile: () => void;
  setNotifPerm: (p: AppState['notifPerm']) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
let prTimer: ReturnType<typeof setTimeout> | null = null;
let restDoneTimer: ReturnType<typeof setTimeout> | null = null;
let finishTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<Store>()(
  immer((set, get) => ({
    ...initialState(),
    hydrated: false,

    patch: (partial) => set((d) => { Object.assign(d, partial); }),

    hydrate: (persisted) => {
      set((d) => {
        if (persisted) Object.assign(d, persisted);
        d.hydrated = true;
      });
    },

    toast_: (msg) => {
      if (toastTimer) clearTimeout(toastTimer);
      set((d) => { d.toast = msg; });
      toastTimer = setTimeout(() => set((d) => { d.toast = ''; }), 2600);
    },
    askConfirm: (cfg) => set((d) => { d.confirm = cfg as any; }),
    clearConfirm: () => set((d) => { d.confirm = null; }),

    beginLocal: () => {
      const name = (get().nameEntry || '').trim();
      set((d) => { d.authed = true; d.userName = name || 'Lifter'; d.nameEntry = ''; });
    },
    eraseAll: () => {
      set((d) => {
        const fresh = initialState();
        Object.assign(d, fresh);
        d.hydrated = true;
      });
    },

    checkReminder: () => {
      const s = get();
      if (!s.notif || s.logging) return null;
      const todayIso = iso(todayDate());
      if (s.lastNotified === todayIso) return null;
      if (new Date().getHours() < s.notifHour) return null;
      const name = scheduledFor(s, todayIso);
      if (!name) return null;
      if (s.saved.some((e) => e.iso === todayIso)) return null;
      return { name, iso: todayIso };
    },
    markNotified: (isoD) => set((d) => { d.lastNotified = isoD; }),

    restMinus: () => set((d) => {
      d.restDur = Math.max(15, d.restDur - 15);
      d.rest = d.rest > 0 ? Math.max(1, d.rest - 15) : 0;
      d.restEnd = d.restEnd ? Math.max(Date.now() + 1000, d.restEnd - 15000) : 0;
    }),
    restPlus: () => set((d) => {
      d.restDur = d.restDur + 15;
      d.rest = d.rest > 0 ? d.rest + 15 : 0;
      d.restEnd = d.restEnd ? d.restEnd + 15000 : 0;
    }),
    skipRest: () => {
      if (restDoneTimer) clearTimeout(restDoneTimer);
      set((d) => { d.rest = 0; d.restEnd = 0; d.restDone = false; });
    },
    tick: () => {
      const s = get();
      if (!s.workout) return;
      // Captured before the producer runs — matches the original's
      // `s.rest` (state as of the *previous* tick), not the value this
      // same tick is about to overwrite `d.rest` with a few lines down.
      const wasCounting = s.rest > 0;
      let fireAlert = false;
      set((d) => {
        if (d.logging) d.elapsed = Math.floor((Date.now() - d.startTs) / 1000);
        if (d.restEnd) {
          const left = Math.max(0, Math.ceil((d.restEnd - Date.now()) / 1000));
          if (left !== d.rest) d.rest = left;
          if (left === 0) {
            d.restEnd = 0;
            if (wasCounting) {
              d.restDone = true;
              fireAlert = true;
              if (restDoneTimer) clearTimeout(restDoneTimer);
              restDoneTimer = setTimeout(() => set((d2) => { d2.restDone = false; }), 8000);
            }
          }
        }
      });
      if (fireAlert) {
        const s2 = get();
        if (s2.sound) playRestChime();
        if (s2.haptics) playRestBuzz();
      }
    },

    // ---------------- routines ----------------
    openEdit: (name) => set((d) => {
      d.editName = name; d.editAdding = false; d.editQuery = ''; d.nameDraft = null; d.nameTaken = false;
    }),
    setNameDraft: (v) => set((d) => { d.nameDraft = v; d.nameTaken = false; }),
    commitName: () => {
      const s = get();
      const v = (s.nameDraft == null ? s.editName : s.nameDraft).trim();
      if (!v || v === s.editName) { set((d) => { d.nameDraft = null; d.nameTaken = false; }); return true; }
      if (nameHeld(s, v, s.editName)) { set((d) => { d.nameTaken = true; }); return false; }
      set((d) => { d.nameDraft = null; d.nameTaken = false; });
      get().renameRoutine(v);
      return true;
    },
    closeEdit: () => {
      if (!get().commitName()) return;
      set((d) => { d.editName = null; d.editAdding = false; d.nameDraft = null; d.nameTaken = false; });
    },
    openEditAdd: () => set((d) => { d.editAdding = true; d.editQuery = ''; d.editPicks = []; }),
    closeEditAdd: () => set((d) => { d.editAdding = false; d.editPicks = []; }),
    setEditQuery: (q) => set((d) => { d.editQuery = q; }),

    startEmpty: () => set((d) => {
      d.logging = true;
      d.workout = { name: 'Quick workout', exercises: [], empty: true };
      d.startTs = Date.now(); d.elapsed = 0; d.rest = 0; d.restEnd = 0;
      d.curEx = 0; d.curSet = 0; d.showPr = false;
      d.bests = historyBests(d as AppState);
      d.sessionPrs = []; d.detailEntry = null;
      d.showPicker = true; d.showAddEx = true; d.addQuery = '';
      d.editName = null; d.editSets = false; d.logDate = null; d.backlogDate = null;
    }),

    newRoutine: (forDate) => {
      const s = get();
      const defs: Record<string, RoutineExerciseDef[]> = JSON.parse(JSON.stringify(effDefs(s)));
      const order = effOrder(s).slice();
      const baseD = forDate ? fromIso(forDate) : todayDate();
      const base = baseD.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
      let n = 1;
      let name = base;
      while (nameHeld(s, name)) { n++; name = base + ' (' + n + ')'; }
      defs[name] = [];
      order.push(name);
      set((d) => {
        d.routineDefs = defs;
        d.routineOrder = order;
        d.editName = name; d.editAdding = true; d.editQuery = ''; d.editPicks = [];
        d.tab = 'routines'; d.calEditDate = null;
        if (forDate) d.dateOverrides = { ...(d.dateOverrides || {}), [forDate]: name };
      });
      if (forDate) get().toast_('New routine planned for ' + shortDate(fromIso(forDate)));
    },
    moveRoutine: (name, dir) => set((d) => {
      const order = (d.routineOrder || defaultOrder()).slice();
      const i = order.indexOf(name);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= order.length) return;
      [order[i], order[j]] = [order[j], order[i]];
      d.routineOrder = order;
    }),
    removeRoutineEx: (i) => set((d) => {
      const defs = JSON.parse(JSON.stringify(d.routineDefs || defaultDefs()));
      if (defs[d.editName].length <= 1) return;
      defs[d.editName].splice(i, 1);
      d.routineDefs = defs;
    }),
    moveRoutineEx: (i, dir) => set((d) => {
      const defs = JSON.parse(JSON.stringify(d.routineDefs || defaultDefs()));
      const arr = defs[d.editName];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      d.routineDefs = defs;
    }),
    togglePick: (name) => set((d) => {
      const picks = d.editPicks || [];
      d.editPicks = picks.includes(name) ? picks.filter((n) => n !== name) : [...picks, name];
    }),
    addRoutineEx: (name) => set((d) => {
      const defs = JSON.parse(JSON.stringify(d.routineDefs || defaultDefs()));
      if (!defs[d.editName].some((x: RoutineExerciseDef) => x.name === name)) {
        defs[d.editName].push({ name, sets: 3, reps: 8 });
      }
      d.routineDefs = defs; d.editAdding = false; d.editQuery = ''; d.editPicks = [];
    }),
    commitPicks: () => {
      const names = get().editPicks || [];
      if (!names.length) { set((d) => { d.editAdding = false; d.editQuery = ''; }); return; }
      set((d) => {
        const defs = JSON.parse(JSON.stringify(d.routineDefs || defaultDefs()));
        names.forEach((n) => {
          if (!defs[d.editName].some((x: RoutineExerciseDef) => x.name === n)) defs[d.editName].push({ name: n, sets: 3, reps: 8 });
        });
        d.routineDefs = defs; d.editAdding = false; d.editQuery = ''; d.editPicks = [];
      });
      get().toast_(names.length + (names.length === 1 ? ' exercise added' : ' exercises added'));
    },
    setRoutineTarget: (i, field, delta) => set((d) => {
      const defs = JSON.parse(JSON.stringify(d.routineDefs || defaultDefs()));
      const item = defs[d.editName][i];
      const lo = 1;
      const hi = field === 'sets' ? 12 : 30;
      item[field] = Math.max(lo, Math.min(hi, item[field] + delta));
      d.routineDefs = defs;
    }),
    deleteRoutine: () => set((d) => {
      const name = d.editName;
      const defs = JSON.parse(JSON.stringify(d.routineDefs || defaultDefs()));
      delete defs[name];
      const order = (d.routineOrder || defaultOrder()).filter((n) => n !== name);
      const sched = (d.weekSchedule || defaultSchedule()).map((x) => (x === name ? 'rest' : x));
      const alias = { ...(d.routineAlias || {}) };
      delete alias[name];
      const ov: Record<string, string> = {};
      Object.keys(d.dateOverrides || {}).forEach((k) => { if (d.dateOverrides[k] !== name) ov[k] = d.dateOverrides[k]; });
      d.routineDefs = defs; d.routineOrder = order; d.weekSchedule = sched;
      d.routineAlias = alias; d.dateOverrides = ov; d.editName = null; d.editAdding = false;
    }),
    renameRoutine: (nn) => set((d) => {
      const old = d.editName;
      if (!nn.trim() || nn === old) return;
      const order = (d.routineOrder || defaultOrder()).slice();
      if (nameHeld(d as AppState, nn, old)) return;
      const defs = JSON.parse(JSON.stringify(d.routineDefs || defaultDefs()));
      defs[nn] = defs[old];
      delete defs[old];
      const i = order.indexOf(old);
      if (i >= 0) order[i] = nn;
      const saved = d.saved.map((e) => (e.routine === old ? { ...e, routine: nn } : e));
      const alias: Record<string, string[]> = {};
      Object.keys(d.routineAlias || {}).forEach((k) => {
        if (k === old) return;
        const kept = d.routineAlias[k].filter((n) => n !== old && n !== nn);
        if (kept.length) alias[k] = kept;
      });
      alias[nn] = Array.from(new Set([...((d.routineAlias || {})[old] || []), old])).filter((n) => n !== nn);
      const sched = (d.weekSchedule || defaultSchedule()).map((x) => (x === old ? nn : x));
      const ov: Record<string, string> = {};
      Object.keys(d.dateOverrides || {}).forEach((k) => { ov[k] = d.dateOverrides[k] === old ? nn : d.dateOverrides[k]; });
      d.routineDefs = defs; d.routineOrder = order; d.editName = nn; d.saved = saved as any;
      d.weekSchedule = sched; d.dateOverrides = ov; d.routineAlias = alias;
    }),
    createExercise: (raw, then) => {
      const name = (raw || '').trim();
      if (!name) return;
      const s = get();
      const dupe = allLibrary(s).find((l) => l.name.toLowerCase() === name.toLowerCase());
      if (dupe) { if (then) then(dupe.name); return; }
      set((d) => { d.customEx = [...(d.customEx || []), { name, group: 'Custom' } as LibraryExercise]; });
      if (then) then(name);
      get().toast_(name + ' added to your exercises');
    },

    // ---------------- schedule / calendar ----------------
    assignDay: (name) => set((d) => {
      if (d.calEditDate) {
        const ov = { ...d.dateOverrides };
        ov[d.calEditDate.iso] = name;
        d.dateOverrides = ov; d.calEditDate = null;
        return;
      }
      const sched = (d.weekSchedule || defaultSchedule()).slice();
      sched[d.editDay!] = name;
      d.weekSchedule = sched; d.editDay = null;
    }),
    setCalOff: (fn) => set((d) => { d.calOff = Math.max(-11, Math.min(11, fn(d.calOff || 0))); }),
    calToday: () => set((d) => { d.calOff = 0; }),
    openWeekdayPicker: (day) => set((d) => { d.editDay = day; }),
    openCalEditDate: (isoD, wd) => set((d) => { d.calEditDate = { iso: isoD, wd }; }),
    openBacklogDate: (isoD, wd) => set((d) => { d.backlogDate = { iso: isoD, wd }; }),
    closeDayPicker: () => set((d) => { d.calEditDate = null; d.editDay = null; d.backlogDate = null; }),
    openDetailFor: (entry) => set((d) => { d.detailEntry = entry as any; d.editSets = false; }),

    // ---------------- active workout ----------------
    start: (key, logDateArg) => {
      const s = get();
      const defs = effDefs(s);
      const list = defs[key] || (TEMPLATES[key] ? TEMPLATES[key].exercises.map((e) => ({ name: e.name, sets: e.sets.length, reps: e.sets[0][1] })) : []);
      const bests = historyBests(s);
      const workout: LiveWorkout = {
        name: key,
        exercises: list.map((d) => {
          const e = exLookup(d.name);
          const prevSets = lastSetsFor(s, d.name);
          const sets = Array.from({ length: d.sets }, (_, i) => {
            const ps = prevSets && prevSets[i];
            const tpl = e && (e.sets[i] || e.sets[e.sets.length - 1]);
            return {
              kg: ps ? ps.kg : tpl ? tpl[0] : 0,
              reps: ps ? ps.reps : d.reps,
              prev: ps ? (ps.kg === 0 ? 'BW' : String(ps.kg)) + ' × ' + ps.reps : '—',
              done: false,
            };
          });
          return { name: d.name, target: `${d.sets} × ${d.reps}`, sets };
        }),
      };
      set((draft) => {
        draft.logging = true; draft.workout = workout as any; draft.startTs = Date.now();
        draft.elapsed = 0; draft.rest = 0; draft.restEnd = 0; draft.curEx = 0; draft.curSet = 0;
        draft.showPr = false; draft.bests = bests; draft.sessionPrs = [];
        draft.detailEntry = null; draft.showPicker = false; draft.editName = null; draft.editSets = false;
        draft.logDate = logDateArg || null; draft.backlogDate = null;
      });
    },
    addSet: (ei) => set((d) => {
      const sets = d.workout.exercises[ei].sets;
      const last = sets[sets.length - 1] || { kg: 0, reps: 8 };
      sets.push({ kg: last.kg, reps: last.reps, prev: '—', done: false });
    }),
    step: (ei, si, field, delta) => set((d) => {
      const set_ = d.workout.exercises[ei].sets[si];
      if (field === 'kg' && d.units === 'lb') {
        const cur = Math.round(set_.kg * 2.2046);
        const next = Math.max(0, cur + delta);
        set_.kg = +(next / 2.2046).toFixed(2);
      } else {
        (set_ as any)[field] = Math.max(0, +((set_ as any)[field] + delta).toFixed(2));
      }
    }),
    setField: (ei, si, field, raw) => set((d) => {
      let v = raw.trim() === '' || raw.toUpperCase() === 'BW' ? 0 : parseFloat(raw) || 0;
      if (field === 'kg' && d.units === 'lb' && v > 0) v = +(v / 2.2046).toFixed(2);
      (d.workout.exercises[ei].sets[si] as any)[field] = v;
    }),
    completeSet: () => {
      const s = get();
      if (!s.workout) return;
      const exs = s.workout.exercises;
      const ex = exs[s.curEx];
      const setEntry = ex.sets[s.curSet];
      const e1 = est1rm(setEntry.kg, setEntry.reps);
      const prior = s.bests[ex.name] || 0;
      const bests = { ...s.bests };
      let pr = false;
      if (e1 > 0 && (!bests[ex.name] || e1 > bests[ex.name] + 0.01)) { bests[ex.name] = e1; pr = true; }

      const isLastSetOfEx = s.curSet === ex.sets.length - 1;
      const isLastEx = s.curEx === exs.length - 1;
      const isFinal = isLastSetOfEx && isLastEx;
      let nextCurEx = s.curEx;
      let nextCurSet = s.curSet;
      let rest = 0;
      let restEnd = 0;
      if (!isLastSetOfEx) { nextCurSet = s.curSet + 1; rest = s.restDur; }
      else if (!isLastEx) { nextCurEx = s.curEx + 1; nextCurSet = 0; rest = s.restDur; }
      if (rest > 0) restEnd = Date.now() + rest * 1000;

      const sessionPrs = pr && !s.sessionPrs.includes(ex.name) ? [...s.sessionPrs, ex.name] : s.sessionPrs;
      const U = s.units;
      const cv = (kg: number) => (U === 'lb' ? Math.round(kg * 2.2046 * 10) / 10 : Math.round(kg * 10) / 10);
      const prDetail = pr
        ? prior > 0
          ? `Est. 1RM ${cv(e1)} ${U} — up ${cv(e1 - prior)} ${U} from ${cv(prior)} ${U}`
          : `Est. 1RM ${cv(e1)} ${U} — first record for this lift`
        : s.prDetail;

      if (restDoneTimer) clearTimeout(restDoneTimer);
      const wasRestDone = s.restDone;

      set((d) => {
        d.workout.exercises[d.curEx].sets[d.curSet].done = true;
        d.bests = bests;
        d.sessionPrs = sessionPrs;
        d.prDetail = prDetail;
        d.showPr = pr;
        if (isFinal) { d.rest = 0; d.restEnd = 0; }
        else { d.curEx = nextCurEx; d.curSet = nextCurSet; d.rest = rest; d.restEnd = restEnd; }
        if (wasRestDone) d.restDone = false;
      });

      if (isFinal) {
        if (finishTimer) clearTimeout(finishTimer);
        if (pr) finishTimer = setTimeout(() => get().finishWorkout(), 1800);
        else get().finishWorkout();
      } else if (pr) {
        if (prTimer) clearTimeout(prTimer);
        prTimer = setTimeout(() => set((d) => { d.showPr = false; }), 2600);
      }
    },
    backSet: () => set((d) => {
      if (d.curSet > 0) { d.curSet -= 1; d.showPr = false; return; }
      if (d.curEx > 0) {
        const prevEx = d.workout.exercises[d.curEx - 1];
        d.curEx -= 1; d.curSet = prevEx.sets.length - 1; d.showPr = false;
      }
    }),
    deferEx: () => {
      const s0 = get();
      const name = s0.workout && s0.workout.exercises[s0.curEx] && s0.workout.exercises[s0.curEx].name;
      let moved = false;
      set((d) => {
        const exs = d.workout.exercises;
        if (exs.length < 2) return;
        moved = true;
        const [m] = exs.splice(d.curEx, 1);
        exs.push(m);
        const unfinished = (i: number) => exs[i].sets.some((x) => !x.done);
        let ei = -1;
        for (let i = d.curEx; i < exs.length - 1; i++) { if (unfinished(i)) { ei = i; break; } }
        if (ei < 0) for (let i = 0; i < exs.length - 1; i++) { if (unfinished(i)) { ei = i; break; } }
        if (ei < 0) ei = exs.length - 1;
        let si = exs[ei].sets.findIndex((x) => !x.done);
        if (si < 0) si = 0;
        d.curEx = ei; d.curSet = si; d.showPr = false; d.rest = 0; d.restEnd = 0; d.showPicker = false;
      });
      if (moved && name) get().toast_(name + ' moved to the end');
    },
    jumpSet: (ei, si) => set((d) => { d.curEx = ei; d.curSet = si; d.showPr = false; d.rest = 0; d.restEnd = 0; }),
    jumpTo: (ei) => set((d) => {
      const ex = d.workout.exercises[ei];
      let si = ex.sets.findIndex((x) => !x.done);
      if (si < 0) si = ex.sets.length - 1;
      d.curEx = ei; d.curSet = si; d.showPicker = false; d.showPr = false;
    }),
    moveEx: (ei, dir) => set((d) => {
      const j = ei + dir;
      if (j < 0 || j >= d.workout.exercises.length) return;
      const exs = d.workout.exercises;
      [exs[ei], exs[j]] = [exs[j], exs[ei]];
      if (d.curEx === ei) d.curEx = j; else if (d.curEx === j) d.curEx = ei;
    }),
    addExerciseToWorkout: (name) => {
      const s = get();
      const existing = s.workout.exercises.findIndex((e) => e.name === name);
      if (existing >= 0) {
        set((d) => { d.showAddEx = false; d.addQuery = ''; });
        get().jumpTo(existing);
        return;
      }
      set((d) => {
        d.workout.exercises.push({
          name, target: '3 × 8',
          sets: [
            { kg: 0, reps: 8, prev: '—', done: false },
            { kg: 0, reps: 8, prev: '—', done: false },
            { kg: 0, reps: 8, prev: '—', done: false },
          ],
        });
        d.showAddEx = false; d.addQuery = '';
        d.curEx = d.workout.exercises.length - 1; d.curSet = 0; d.showPicker = false; d.showPr = false;
      });
    },
    removeExercise: (ei) => set((d) => {
      if (d.workout.exercises.length <= 1) return;
      d.workout.exercises.splice(ei, 1);
      let curEx = d.curEx;
      if (ei < curEx) curEx--; else if (ei === curEx) curEx = Math.min(curEx, d.workout.exercises.length - 1);
      d.curEx = curEx; d.curSet = 0;
    }),
    finishWorkout: () => {
      const s = get();
      const w = s.workout;
      if (!w) return;
      const log = w.exercises.map((ex) => ({ name: ex.name, sets: ex.sets.filter((st) => st.done) })).filter((e) => e.sets.length);
      const t = logTotals(log);
      if (t.sets === 0) {
        set((d) => { d.logging = false; d.workout = null; d.tab = 'today'; d.logDate = null; d.rest = 0; d.restEnd = 0; });
        return;
      }
      const isoD = s.logDate || iso(todayDate());
      const dt = fromIso(isoD);
      const isBacklog = !!s.logDate;
      const hasLeft = w.exercises.some((ex) => ex.sets.some((x) => !x.done));
      const entry: SavedEntry = {
        name: w.name, routine: w.name, iso: isoD, date: shortDate(dt),
        duration: (isBacklog ? 5 + t.sets * 4 : Math.max(1, Math.round(s.elapsed / 60))) + ' min',
        volume: volLabel(t.volume), volNum: t.volume, sets: t.sets,
        _log: log, _elapsed: s.elapsed,
      };
      if (hasLeft && !isBacklog) entry._w = w;
      set((d) => {
        d.logging = false; d.workout = null; d.tab = 'today'; d.logDate = null; d.rest = 0; d.restEnd = 0;
        d.saved = [entry, ...d.saved];
      });
      if (isBacklog) get().toast_(w.name + ' logged to ' + shortDate(dt));
    },
    finish: () => get().finishWorkout(),
    cancelLogging: () => set((d) => {
      d.logging = false; d.tab = 'today';
      if (d.workout && !d.workout.exercises.length) d.workout = null;
    }),
    openPicker: () => set((d) => { d.showPicker = true; d.showAddEx = false; }),
    closePicker: () => set((d) => { d.showPicker = false; d.showAddEx = false; }),
    openAddEx: () => set((d) => { d.showAddEx = true; d.addQuery = ''; }),
    closeAddEx: () => set((d) => { d.showAddEx = false; }),
    setAddQuery: (q) => set((d) => { d.addQuery = q; }),

    // ---------------- history / detail ----------------
    // Note: `entry` is a plain-object reference from the last *committed*
    // state (as read by a component's selector). Immer wraps `d.saved`'s
    // items in Proxies while a producer runs, so `===`/`indexOf` against
    // `entry` must happen against the plain snapshot from get() — doing it
    // inside the producer against draft items would never match.
    editSavedSet: (entry, exI, setI, field, delta) => {
      const i = get().saved.indexOf(entry);
      if (i < 0) return;
      set((d) => {
        const e2: SavedEntry = JSON.parse(JSON.stringify(entry));
        e2._log = entryLog(e2);
        delete e2._w;
        const setEntry = e2._log[exI].sets[setI];
        const U = d.units;
        if (field === 'kg') {
          if (U === 'lb') setEntry.kg = +(Math.max(0, Math.round(setEntry.kg * 2.2046) + delta) / 2.2046).toFixed(2);
          else setEntry.kg = Math.max(0, +(setEntry.kg + delta).toFixed(2));
        } else {
          setEntry.reps = Math.max(1, setEntry.reps + delta);
        }
        const t = logTotals(e2._log);
        e2.volNum = t.volume; e2.sets = t.sets; e2.volume = volLabel(t.volume);
        d.saved[i] = e2 as any;
        d.detailEntry = e2 as any;
      });
    },
    addSavedSet: (entry, exI) => {
      const i = get().saved.indexOf(entry);
      if (i < 0) return;
      set((d) => {
        const e2: SavedEntry = JSON.parse(JSON.stringify(entry));
        e2._log = entryLog(e2);
        delete e2._w;
        const sets = e2._log[exI].sets;
        const last = sets[sets.length - 1] || { kg: 0, reps: 8 };
        sets.push({ kg: last.kg, reps: last.reps });
        const t = logTotals(e2._log);
        e2.volNum = t.volume; e2.sets = t.sets; e2.volume = volLabel(t.volume);
        d.saved[i] = e2 as any;
        d.detailEntry = e2 as any;
      });
    },
    removeSavedSet: (entry, exI, setI) => {
      const i = get().saved.indexOf(entry);
      if (i < 0) return;
      set((d) => {
        const e2: SavedEntry = JSON.parse(JSON.stringify(entry));
        e2._log = entryLog(e2);
        delete e2._w;
        e2._log[exI].sets.splice(setI, 1);
        e2._log = e2._log.filter((ex) => ex.sets.length);
        if (!e2._log.length) {
          d.saved.splice(i, 1);
          d.detailEntry = null;
          return;
        }
        const t = logTotals(e2._log);
        e2.volNum = t.volume; e2.sets = t.sets; e2.volume = volLabel(t.volume);
        d.saved[i] = e2 as any;
        d.detailEntry = e2 as any;
      });
    },
    closeDetail: () => set((d) => { d.detailEntry = null; d.editSets = false; }),
    toggleEditSets: () => set((d) => { d.editSets = !d.editSets; }),
    deleteSession: (entry) => {
      const i = get().saved.indexOf(entry);
      set((d) => {
        if (i >= 0) d.saved.splice(i, 1);
        d.detailEntry = null; d.confirm = null;
      });
    },
    resumeSession: (entry) => {
      if (!entry._w) return;
      const s = get();
      const w = entry._w;
      let ei = 0, si = 0, found = false;
      w.exercises.some((ex, i) => ex.sets.some((x, j) => { if (!x.done) { ei = i; si = j; found = true; return true; } return false; }));
      if (!found) { ei = w.exercises.length - 1; si = w.exercises[ei].sets.length - 1; w.exercises[ei].sets[si].done = false; }
      const sessionPrs = prMapFor(s).get(entry) || [];
      const idx = s.saved.indexOf(entry);
      set((d) => {
        d.logging = true; d.workout = w as any; d.curEx = ei; d.curSet = si; d.rest = 0; d.restEnd = 0; d.showPr = false;
        d.sessionPrs = sessionPrs;
        d.startTs = Date.now() - (entry._elapsed || 0) * 1000; d.elapsed = entry._elapsed || 0;
        if (idx >= 0) d.saved.splice(idx, 1);
        d.detailEntry = null;
      });
    },
    repeatRoutine: (name) => get().start(name),

    // ---------------- profile / settings ----------------
    setUserName: (v) => set((d) => { d.userName = v; }),
    setUnits: (u) => set((d) => { d.units = u; }),
    setTheme: (t) => set((d) => { d.theme = t; }),
    toggleNotif: () => set((d) => { d.notif = !d.notif; }),
    notifEarlier: () => set((d) => { d.notifHour = Math.max(5, d.notifHour - 1); d.lastNotified = null; }),
    notifLater: () => set((d) => { d.notifHour = Math.min(22, d.notifHour + 1); d.lastNotified = null; }),
    toggleSound: () => {
      set((d) => { d.sound = !d.sound; });
      if (get().sound) playRestChime();
    },
    toggleHaptics: () => {
      set((d) => { d.haptics = !d.haptics; });
      if (get().haptics) playRestBuzz();
    },
    openProfile: () => set((d) => { d.showProfile = true; }),
    closeProfile: () => set((d) => { d.showProfile = false; }),
    setNotifPerm: (p) => set((d) => { d.notifPerm = p; }),
  }))
);

// Re-exported so screens can pull the same derivations the store's own
// actions use, kept in one place (derive.ts) rather than duplicated.
export {
  agoLabel, allLibrary, buildLog, effDefs, effOrder, effSchedule, entryLog,
  historyBests, lastSetsFor, logTotals, nameHeld, prMapFor, rawHistory,
  scheduledFor, seedHistory, validName,
} from './derive';
export { dayDiff, est1rm, fromIso, iso, longDate, r1, shortDate, todayDate, volLabel, wdIdx };
