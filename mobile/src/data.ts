import type { ExerciseTemplate, LibraryExercise, RoutineDefs, WeekSchedule } from './types';

export const LIBRARY: LibraryExercise[] = [
  { name: 'Barbell Bench Press', group: 'Chest' },
  { name: 'Incline DB Press', group: 'Chest' },
  { name: 'Cable Fly', group: 'Chest' },
  { name: 'Overhead Press', group: 'Shoulders' },
  { name: 'Lateral Raise', group: 'Shoulders' },
  { name: 'Deadlift', group: 'Back' },
  { name: 'Barbell Row', group: 'Back' },
  { name: 'Lat Pulldown', group: 'Back' },
  { name: 'Pull-ups', group: 'Back' },
  { name: 'Face Pull', group: 'Back' },
  { name: 'Back Squat', group: 'Legs' },
  { name: 'Romanian Deadlift', group: 'Legs' },
  { name: 'Leg Press', group: 'Legs' },
  { name: 'Leg Curl', group: 'Legs' },
  { name: 'Calf Raise', group: 'Legs' },
  { name: 'Barbell Curl', group: 'Arms' },
  { name: 'Triceps Pushdown', group: 'Arms' },
  { name: 'Hammer Curl', group: 'Arms' },
];

// Seed data only: exercise name + the per-set [kg, reps] pairs a first-time
// session is built from. Everything else (durations, prefills, PRs, "last
// trained") is derived from real logged history, so no display copy lives here.
export const TEMPLATES: Record<string, ExerciseTemplate> = {
  'Push Day': {
    exercises: [
      { name: 'Barbell Bench Press', sets: [[82.5, 8], [82.5, 8], [85, 6], [85, 6]] },
      { name: 'Overhead Press', sets: [[45, 8], [45, 8], [47.5, 6]] },
      { name: 'Incline DB Press', sets: [[28, 10], [28, 10], [30, 8]] },
    ],
  },
  'Pull Day': {
    exercises: [
      { name: 'Deadlift', sets: [[122.5, 5], [122.5, 5], [122.5, 5]] },
      { name: 'Pull-ups', sets: [[0, 8], [0, 8], [0, 7], [0, 6]] },
      { name: 'Barbell Row', sets: [[62.5, 10], [62.5, 10], [62.5, 8]] },
    ],
  },
  'Leg Day': {
    exercises: [
      { name: 'Back Squat', sets: [[102.5, 6], [102.5, 6], [102.5, 6], [102.5, 5]] },
      { name: 'Romanian Deadlift', sets: [[82.5, 10], [82.5, 10], [82.5, 9]] },
      { name: 'Leg Press', sets: [[190, 12], [190, 12], [190, 12]] },
    ],
  },
};

export function defaultDefs(): RoutineDefs {
  const mk = (key: string) =>
    TEMPLATES[key].exercises.map((e) => ({ name: e.name, sets: e.sets.length, reps: e.sets[0][1] }));
  return { 'Push Day': mk('Push Day'), 'Pull Day': mk('Pull Day'), 'Leg Day': mk('Leg Day') };
}

export function defaultSchedule(): WeekSchedule {
  return ['Push Day', 'rest', 'Pull Day', 'rest', 'Leg Day', 'Push Day', 'rest'];
}

export function defaultOrder(): string[] {
  return ['Push Day', 'Pull Day', 'Leg Day'];
}

export function routineType(name: string): 'push' | 'pull' | 'legs' {
  return ({ 'Push Day': 'push', 'Pull Day': 'pull', 'Leg Day': 'legs' } as const)[name] ?? 'push';
}

export function exLookup(name: string) {
  for (const k in TEMPLATES) {
    const hit = TEMPLATES[k].exercises.find((e) => e.name === name);
    if (hit) return hit;
  }
  return null;
}

export function shortExName(n: string): string {
  return n.replace('Barbell ', '').replace('Dumbbell ', '');
}
