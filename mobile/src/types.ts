// Core data model, ported 1:1 from the Workout Tracker.dc.html prototype's
// Component class state shape.

export type Units = 'kg' | 'lb';
export type Theme = 'dark' | 'light';
export type RoutineType = 'push' | 'pull' | 'legs';

export interface SetEntry {
  kg: number;
  reps: number;
  /** display label for "Last · …", only present on live-workout sets */
  prev?: string;
  done?: boolean;
}

export interface WorkoutExercise {
  name: string;
  /** "3 × 8" style target label, only present on live-workout exercises */
  target?: string;
  sets: SetEntry[];
}

export interface LiveWorkout {
  name: string;
  exercises: WorkoutExercise[];
  /** true only for a from-scratch "Quick workout" with nothing added yet */
  empty?: boolean;
}

/** One exercise's logged sets within a saved session (done sets only). */
export interface LoggedExercise {
  name: string;
  sets: SetEntry[];
}

/** A completed (or in-progress-but-saved) workout session. */
export interface SavedEntry {
  name: string;
  /** routine identity this was logged under; follows renames going forward */
  routine: string;
  iso: string;
  date: string;
  duration: string;
  volume: string;
  volNum: number;
  sets: number;
  _log: LoggedExercise[];
  /** present while the session still has unfinished sets — resumable */
  _w?: LiveWorkout;
  _elapsed?: number;
}

/** A seed/demo history entry has the same shape minus the live-resume fields. */
export type HistoryEntry = SavedEntry;

export interface RoutineExerciseDef {
  name: string;
  sets: number;
  reps: number;
}

export type RoutineDefs = Record<string, RoutineExerciseDef[]>;

export interface LibraryExercise {
  name: string;
  group: string;
}

export interface ExerciseTemplate {
  exercises: { name: string; sets: [number, number][] }[];
}

export type WeekSchedule = string[]; // 7 entries, Mon..Sun, routine name or 'rest'

export type DateOverrides = Record<string, string>; // iso -> routine name or 'rest'
export type RoutineAlias = Record<string, string[]>; // current name -> former names

export interface ConfirmConfig {
  title: string;
  body: string;
  label: string;
  run: () => void;
}

export interface CalEditDate {
  iso: string;
  wd: number;
}

export interface BacklogDate {
  iso: string;
  wd: number;
}

export type NotifPermission = 'default' | 'granted' | 'denied' | 'undetermined';

export interface AppState {
  // ---- auth / onboarding ----
  authed: boolean;
  nameEntry: string;

  // ---- navigation ----
  tab: 'today' | 'routines';
  logging: boolean;

  // ---- active workout ----
  workout: LiveWorkout | null;
  startTs: number;
  elapsed: number;
  curEx: number;
  curSet: number;
  showPr: boolean;
  prDetail: string;
  sessionPrs: string[];
  bests: Record<string, number>;
  logDate: string | null; // set while back-logging a past date
  backlogDate: BacklogDate | null;

  // rest timer — absolute deadline so it survives background/reload
  rest: number;
  restEnd: number;
  restDur: number;
  restDone: boolean;

  // exercise switcher / add sheet
  showPicker: boolean;
  showAddEx: boolean;
  addQuery: string;

  // ---- history ----
  saved: SavedEntry[];
  detailEntry: SavedEntry | null;
  editSets: boolean;

  // ---- routines ----
  routineDefs: RoutineDefs | null;
  routineOrder: string[] | null;
  routineAlias: RoutineAlias;
  editName: string | null;
  editAdding: boolean;
  editQuery: string;
  editPicks: string[];
  nameDraft: string | null;
  nameTaken: boolean;

  // ---- schedule / calendar ----
  weekSchedule: WeekSchedule | null;
  editDay: number | null;
  calEditDate: CalEditDate | null;
  dateOverrides: DateOverrides;
  calOff: number;

  // ---- exercises ----
  customEx: LibraryExercise[];

  // ---- profile / settings ----
  userName: string;
  units: Units;
  theme: Theme;
  notif: boolean;
  notifHour: number;
  notifPerm: NotifPermission;
  lastNotified: string | null;
  sound: boolean;
  haptics: boolean;

  // ---- ui chrome ----
  showProfile: boolean;
  confirm: ConfirmConfig | null;
  toast: string;

  schema: number;
}
