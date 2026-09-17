import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Btn, IconCircleBtn } from '../components/ui';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/store';
import { computeCurrentSet, computeProgress, unitHelpers } from '../store/derive';
import { fonts } from '../theme';
import { fmtClock } from '../utils';
import { ExerciseSwitcherSheet } from './ExerciseSwitcherSheet';

export function LoggingScreen() {
  const { c } = useTheme();
  const state = useStore((s) => s);
  const { workout, curEx, curSet, elapsed, rest, restDone, logDate, units, showPr, prDetail, showPicker } = state;

  const cur = useMemo(() => computeCurrentSet(state), [state]);
  const progress = useMemo(() => computeProgress(state), [state]);
  const { stepU } = unitHelpers(units);

  const cancelLogging = useStore((s) => s.cancelLogging);
  const finish = useStore((s) => s.finish);
  const restMinus = useStore((s) => s.restMinus);
  const restPlus = useStore((s) => s.restPlus);
  const skipRest = useStore((s) => s.skipRest);
  const openPicker = useStore((s) => s.openPicker);
  const openAddEx = useStore((s) => s.openAddEx);
  const jumpSet = useStore((s) => s.jumpSet);
  const step = useStore((s) => s.step);
  const setField = useStore((s) => s.setField);
  const addSet = useStore((s) => s.addSet);
  const deferEx = useStore((s) => s.deferEx);
  const backSet = useStore((s) => s.backSet);
  const completeSet = useStore((s) => s.completeSet);

  if (!workout) return null;

  const noExercises = workout.exercises.length === 0;
  const hasExercises = !noExercises;
  const atStart = curEx === 0 && curSet === 0;
  const isLastSet = hasExercises && curEx === workout.exercises.length - 1 && curSet === workout.exercises[curEx].sets.length - 1;
  const canDefer = hasExercises && workout.exercises.length > 1 && workout.exercises.some((e, i) => i !== curEx && e.sets.some((x) => !x.done));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      {/* top bar */}
      <View style={{ paddingTop: 6, paddingHorizontal: 22, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable onPress={cancelLogging} accessibilityLabel="Minimize workout" style={{ width: 34, height: 34, marginLeft: -8, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: c.fg, fontSize: 20 }}>⌄</Text>
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 16, fontFamily: fonts.bodySemibold, color: c.fg }} numberOfLines={1}>{workout.name}</Text>
          {logDate ? (
            <Text style={{ fontFamily: fonts.num, fontSize: 12.5, color: c.acct, fontWeight: '600' as any, marginTop: 2 }}>
              Back-logging {logDate}
            </Text>
          ) : (
            <Text style={{ fontFamily: fonts.num, fontSize: 13, color: c.t6a, marginTop: 1 }}>{fmtClock(elapsed)}</Text>
          )}
        </View>
        <Pressable onPress={finish} style={{ backgroundColor: '#c6ff00', paddingVertical: 9, paddingHorizontal: 18, borderRadius: 999 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 14, color: '#000' }}>Finish</Text>
        </Pressable>
      </View>

      {/* progress segments */}
      <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 22, paddingBottom: 22 }}>
        {progress.map((p, i) => (
          <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: p === 'done' ? '#c6ff00' : p === 'current' ? c.fg : c.s1d }} />
        ))}
      </View>

      {rest > 0 && (
        <View style={{ marginHorizontal: 22, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.w10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.acct, fontFamily: fonts.bodySemibold }}>Rest</Text>
          <Text style={{ flex: 1, fontFamily: fonts.num, fontSize: 22, fontWeight: '600' as any, color: c.fg }}>{fmtClock(rest)}</Text>
          <IconCircleBtn glyph="−" size={32} onPress={restMinus} />
          <IconCircleBtn glyph="+" size={32} onPress={restPlus} />
          <Pressable onPress={skipRest} style={{ borderWidth: 1.5, borderColor: c.w20, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 16 }}>
            <Text style={{ color: c.fg, fontFamily: fonts.bodySemibold, fontSize: 13 }}>Skip</Text>
          </Pressable>
        </View>
      )}
      {restDone && rest === 0 && (
        <View style={{ marginHorizontal: 22, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.w10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#c6ff00' }} />
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: c.fg }}>Rest complete — next set up</Text>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 20 }}>
        {noExercises && (
          <View style={{ paddingVertical: 30, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 19, color: c.fg, marginBottom: 7 }}>Build it as you go</Text>
            <Text style={{ fontSize: 14, color: c.t8a, lineHeight: 21, textAlign: 'center', marginBottom: 20 }}>
              Add your first exercise — search the library or create your own.
            </Text>
            <Btn label="Add an exercise" onPress={openAddEx} />
          </View>
        )}

        {cur && (
          <View>
            <Pressable onPress={openPicker} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold }}>{cur.position}</Text>
              <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.acct, fontFamily: fonts.bodySemibold }}>▾ Switch</Text>
            </Pressable>
            <Text style={{ fontFamily: fonts.display, fontSize: 23, color: c.fg, marginBottom: 12 }}>{cur.name}</Text>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 15 }}>
              {cur.setPills.map((sp) => (
                <Pressable
                  key={sp.idx}
                  onPress={() => jumpSet(curEx, sp.idx)}
                  style={{
                    width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: sp.done ? '#c6ff00' : 'transparent',
                    borderWidth: sp.done ? 0 : 1.5,
                    borderColor: sp.done ? undefined : sp.isCurrent ? c.acct : c.w14,
                  }}
                >
                  <Text style={{ fontFamily: fonts.num, fontSize: 14, fontWeight: '600' as any, color: sp.done ? '#000' : sp.isCurrent ? c.acct : c.t5a }}>{sp.idx + 1}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
              <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: c.fg }}>{cur.setLabel}</Text>
              <Text style={{ fontFamily: fonts.num, fontSize: 13, color: c.t6a }}>Last · {cur.prevDisplay}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
              <View style={{ flex: 1.3, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginBottom: 14 }}>
                  Weight · {units}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <IconCircleBtn glyph="−" size={38} onPress={() => step(curEx, curSet, 'kg', -stepU)} />
                  <TextInput
                    value={cur.kgDisplay}
                    onChangeText={(v) => setField(curEx, curSet, 'kg', v)}
                    inputMode="decimal"
                    placeholder="BW"
                    placeholderTextColor={c.t6a}
                    style={{ width: 96, textAlign: 'center', fontFamily: fonts.display, fontSize: 32, fontWeight: '600' as any, color: c.fg }}
                  />
                  <IconCircleBtn glyph="+" size={38} onPress={() => step(curEx, curSet, 'kg', stepU)} />
                </View>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginBottom: 14 }}>Reps</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <IconCircleBtn glyph="−" size={38} onPress={() => step(curEx, curSet, 'reps', -1)} />
                  <TextInput
                    value={String(cur.repsDisplay)}
                    onChangeText={(v) => setField(curEx, curSet, 'reps', v)}
                    inputMode="numeric"
                    style={{ width: 52, textAlign: 'center', fontFamily: fonts.display, fontSize: 32, fontWeight: '600' as any, color: c.fg }}
                  />
                  <IconCircleBtn glyph="+" size={38} onPress={() => step(curEx, curSet, 'reps', 1)} />
                </View>
              </View>
            </View>

            <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold }}>Est. 1RM</Text>
              <Text style={{ fontFamily: fonts.num, fontSize: 15, fontWeight: '600' as any, color: cur.beatingPr ? c.acct : c.t6a }}>{cur.e1rmText}</Text>
              <Text style={{ fontSize: 12.5, color: c.t6a }}>· {cur.prBarText}</Text>
            </View>

            {cur.anyDone && (
              <View style={{ marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.w09 }}>
                <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginBottom: 8 }}>
                  Logged · this exercise
                </Text>
                {cur.doneSets.map((d) => (
                  <Pressable key={d.idx} onPress={() => jumpSet(curEx, d.idx)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 }}>
                    <Text style={{ fontSize: 13, color: c.t6a, fontFamily: fonts.bodyMedium, minWidth: 52 }}>{d.label}</Text>
                    <Text style={{ flex: 1, fontFamily: fonts.num, fontSize: 14.5, fontWeight: '600' as any, color: c.fg }}>{d.val}</Text>
                    <Text style={{ fontSize: 12, color: c.acct, fontFamily: fonts.bodySemibold }}>Edit</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {showPr && (
              <View style={{ marginTop: 18, alignItems: 'center' }}>
                <Text style={{ color: c.acct, fontFamily: fonts.display, fontSize: 15, letterSpacing: 1 }}>✦ NEW PERSONAL RECORD</Text>
                <Text style={{ marginTop: 5, fontSize: 12.5, color: c.t7a }}>{prDetail}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {hasExercises && (
        <View style={{ paddingTop: 6, paddingHorizontal: 22, paddingBottom: 20 }}>
          {canDefer && (
            <Pressable onPress={deferEx} style={{ marginBottom: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.w20, borderRadius: 999, paddingVertical: 11, alignItems: 'center' }}>
              <Text style={{ color: c.t8a, fontFamily: fonts.bodySemibold, fontSize: 13.5 }}>Machine busy — do this later</Text>
            </Pressable>
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              disabled={atStart}
              onPress={backSet}
              style={{ flex: 1, borderWidth: 1.5, borderColor: c.w20, borderRadius: 999, paddingVertical: 15, alignItems: 'center', opacity: atStart ? 0.4 : 1 }}
            >
              <Text style={{ color: c.fg, fontFamily: fonts.bodySemibold, fontSize: 15 }}>Back</Text>
            </Pressable>
            <Pressable onPress={completeSet} style={{ flex: 1.7, backgroundColor: '#c6ff00', borderRadius: 999, paddingVertical: 15, alignItems: 'center' }}>
              <Text style={{ color: '#000', fontFamily: fonts.display, fontSize: 15 }}>{isLastSet ? 'Finish workout' : 'Complete set'}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <ExerciseSwitcherSheet visible={showPicker} />
    </SafeAreaView>
  );
}
