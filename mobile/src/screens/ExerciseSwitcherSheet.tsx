import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BottomSheet, IconCircleBtn, LineInput } from '../components/ui';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/store';
import { canCreateExercise, computeExList, filterLibrary } from '../store/derive';
import { fonts } from '../theme';

export function ExerciseSwitcherSheet({ visible }: { visible: boolean }) {
  const { c } = useTheme();
  const state = useStore((s) => s);
  const { showAddEx, addQuery, workout } = state;
  const exList = useMemo(() => computeExList(state), [state]);

  const closePicker = useStore((s) => s.closePicker);
  const openAddEx = useStore((s) => s.openAddEx);
  const closeAddEx = useStore((s) => s.closeAddEx);
  const setAddQuery = useStore((s) => s.setAddQuery);
  const jumpTo = useStore((s) => s.jumpTo);
  const moveEx = useStore((s) => s.moveEx);
  const removeExercise = useStore((s) => s.removeExercise);
  const addExerciseToWorkout = useStore((s) => s.addExerciseToWorkout);
  const createExercise = useStore((s) => s.createExercise);

  const inWorkout = workout ? workout.exercises.map((e) => e.name) : [];
  const library = useMemo(() => filterLibrary(state, addQuery), [state, addQuery]);
  const canCreate = canCreateExercise(state, addQuery);

  return (
    <BottomSheet visible={visible} onClose={closePicker} maxHeightPct={0.78}>
      {!showAddEx ? (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 22, color: c.fg }}>Exercises</Text>
            <Pressable onPress={closePicker}><Text style={{ color: c.fg, fontSize: 20 }}>✕</Text></Pressable>
          </View>
          <Text style={{ fontSize: 13, color: c.t6a, marginBottom: 14 }}>
            {exList.length ? 'Tap to jump · arrows reorder · skip and return anytime' : 'Nothing added yet — start with your first exercise.'}
          </Text>
          <ScrollView style={{ maxHeight: 380 }}>
            {exList.map((e, i) => (
              <View key={e.name + i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11, borderTopWidth: 1, borderTopColor: c.w09 }}>
                <Pressable onPress={() => jumpTo(i)} style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <View style={{
                      width: 9, height: 9, borderRadius: 4.5,
                      backgroundColor: e.allDone || e.isCurrent ? '#c6ff00' : 'transparent',
                      borderWidth: e.allDone || e.isCurrent ? 0 : 1.5, borderColor: c.w25,
                    }}
                    />
                    <Text style={{ fontSize: 16, fontFamily: fonts.bodySemibold, color: e.isCurrent ? c.acct : c.fg }}>{e.name}</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.num, fontSize: 12.5, color: c.t6a, marginTop: 3, paddingLeft: 18 }}>{e.status}</Text>
                </Pressable>
                <View style={{ flexDirection: 'row', gap: 7 }}>
                  <IconCircleBtn glyph="↑" size={34} disabled={e.isFirst} onPress={() => moveEx(i, -1)} />
                  <IconCircleBtn glyph="↓" size={34} disabled={e.isLast} onPress={() => moveEx(i, 1)} />
                  <IconCircleBtn glyph="✕" size={34} disabled={e.cantRemove} onPress={() => removeExercise(i)} />
                </View>
              </View>
            ))}
          </ScrollView>
          <Pressable onPress={openAddEx} style={{ marginTop: 18, borderWidth: 1.5, borderColor: c.w20, borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: c.fg, fontFamily: fonts.bodySemibold, fontSize: 15 }}>+ Add exercise</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Pressable onPress={closeAddEx} accessibilityLabel="Back to exercise list"><Text style={{ color: c.fg, fontSize: 20 }}>‹</Text></Pressable>
            <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 22, color: c.fg }}>Add exercise</Text>
          </View>
          <LineInput value={addQuery} onChangeText={setAddQuery} placeholder="Search exercises" style={{ marginBottom: 6, paddingVertical: 11 }} />
          <ScrollView style={{ maxHeight: 340 }}>
            {library.map((lib) => (
              <Pressable
                key={lib.name}
                onPress={() => addExerciseToWorkout(lib.name)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.w09 }}
              >
                <View style={{ minWidth: 0 }}>
                  <Text style={{ fontSize: 16, fontFamily: fonts.bodySemibold, color: c.fg }} numberOfLines={1}>{lib.name}</Text>
                  <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginTop: 3 }}>
                    {inWorkout.includes(lib.name) ? lib.group + ' · already added' : lib.group}
                  </Text>
                </View>
                <Text style={{ color: c.acct, fontSize: 22, fontFamily: fonts.bodySemibold }}>+</Text>
              </Pressable>
            ))}
            {canCreate && (
              <Pressable
                onPress={() => createExercise(addQuery, (n) => addExerciseToWorkout(n))}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 13, borderTopWidth: 1, borderTopColor: c.w09 }}
              >
                <View style={{ minWidth: 0 }}>
                  <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: c.acct }} numberOfLines={1}>Create "{addQuery.trim()}"</Text>
                  <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginTop: 3 }}>
                    New exercise · saved to your list
                  </Text>
                </View>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(198,255,0,.14)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: c.acct, fontSize: 17, fontFamily: fonts.bodySemibold }}>+</Text>
                </View>
              </Pressable>
            )}
            {!library.length && !canCreate && (
              <Text style={{ textAlign: 'center', color: c.t6a, fontSize: 14, paddingVertical: 24 }}>No matches for "{addQuery}"</Text>
            )}
          </ScrollView>
        </View>
      )}
    </BottomSheet>
  );
}
