// AsyncStorage persistence, ported from the prototype's loadPersisted()/
// persist() pair. The prototype's cross-tab "revision counter" arbitration
// is dropped on purpose — that existed only to referee multiple browser
// tabs sharing one localStorage key, which has no equivalent on a single
// mobile app instance (there's only ever one writer).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';
import { defaultDefs, defaultOrder, defaultSchedule } from '../data';
import type { AppState } from '../types';
import { fromIso, wdIdx } from '../utils';
import { useStore } from './store';

const PKEY = 'wt.v3';
const SCHEMA = 3;
const PERSIST: (keyof AppState)[] = [
  'authed', 'saved', 'routineDefs', 'routineOrder', 'weekSchedule', 'dateOverrides',
  'restDur', 'units', 'userName', 'theme', 'notif', 'workout', 'curEx', 'curSet',
  'elapsed', 'bests', 'sessionPrs', 'customEx', 'logDate', 'restEnd', 'routineAlias',
  'schema', 'sound', 'haptics', 'notifHour', 'lastNotified',
];

export async function loadPersisted(): Promise<Partial<AppState> | null> {
  try {
    const raw = await AsyncStorage.getItem(PKEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    const next: Partial<AppState> & Record<string, any> = {};
    PERSIST.forEach((k) => { if (p[k] !== undefined && p[k] !== null) (next as any)[k] = p[k]; });

    next.logging = false;
    next.restDone = false;
    const left = next.restEnd ? Math.ceil((next.restEnd - Date.now()) / 1000) : 0;
    next.rest = Math.max(0, left);
    if (left <= 0) next.restEnd = 0;

    // A session with nothing logged is not progress — resuming it would be
    // identical to starting the routine fresh, so don't restore it as "in progress".
    if (next.workout && !next.workout.exercises.some((ex: any) => ex.sets.some((x: any) => x.done))) {
      next.workout = null;
      next.elapsed = 0; next.curEx = 0; next.curSet = 0; next.sessionPrs = []; next.logDate = null;
    }
    if (next.workout) next.startTs = Date.now() - (next.elapsed || 0) * 1000;

    // Routine order and definitions must agree — a snapshot can bring one
    // without the other (a null routineDefs means "defaults").
    if (next.routineOrder && next.routineDefs) {
      next.routineOrder = next.routineOrder.filter((n: string) => next.routineDefs![n] !== undefined);
      Object.keys(next.routineDefs).forEach((n) => {
        if (!next.routineOrder!.includes(n)) next.routineOrder!.push(n);
      });
    } else if (next.routineOrder && !next.routineDefs) {
      const base = defaultDefs();
      next.routineOrder = next.routineOrder.filter((n: string) => base[n] !== undefined);
    }

    // Per-date overrides are rebuilt, not trusted as-is: a snapshot without
    // the current schema stamp predates the ISO key format, so its
    // overrides are dropped.
    const ov: Record<string, string> = {};
    if (p.schema === SCHEMA && next.dateOverrides) {
      const sched = next.weekSchedule || defaultSchedule();
      Object.keys(next.dateOverrides).forEach((k) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return;
        const order = next.routineOrder || defaultOrder();
        if (next.dateOverrides![k] !== 'rest' && !order.includes(next.dateOverrides![k])) return;
        if (next.dateOverrides![k] === sched[wdIdx(fromIso(k))]) return;
        ov[k] = next.dateOverrides![k];
      });
    }
    next.dateOverrides = ov;
    next.schema = SCHEMA;
    return next;
  } catch (e) {
    return null;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastPayload: string | null = null;

function persistNow(state: AppState) {
  try {
    const out: Record<string, any> = {};
    PERSIST.forEach((k) => { out[k] = (state as any)[k]; });
    const json = JSON.stringify(out);
    if (json === lastPayload) return;
    lastPayload = json;
    AsyncStorage.setItem(PKEY, json).catch(() => {});
  } catch (e) {
    // quota or unavailable storage — degrade to session-only, same as the prototype
  }
}

export function schedulePersist(state: AppState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveTimer = null; persistNow(state); }, 400);
}

export async function eraseAllStorage() {
  lastPayload = null;
  try { await AsyncStorage.removeItem(PKEY); } catch (e) {}
}

/** Mount once at the app root: hydrates from storage, then persists on every change. */
export function usePersistence() {
  const hydrated = useStore((s) => s.hydrated);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    let cancelled = false;
    (async () => {
      const persisted = await loadPersisted();
      if (!cancelled) useStore.getState().hydrate(persisted);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const unsub = useStore.subscribe((state) => schedulePersist(state));
    return unsub;
  }, [hydrated]);
}
