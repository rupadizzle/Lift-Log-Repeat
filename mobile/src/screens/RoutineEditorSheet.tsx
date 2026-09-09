import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BottomSheet, IconCircleBtn, LineInput } from '../components/ui';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/store';
import { canCreateExercise, computeRoutineEditor, filterLibrary } from '../store/derive';
import { fonts } from '../theme';

export function RoutineEditorSheet() {
  const { c } = useTheme();
  const state = useStore((s) => s);
  const { editName, editQuery, editPicks } = state;
  const vm = useMemo(() => computeRoutineEditor(state), [state]);

  const closeEdit = useStore((s) => s.closeEdit);
  const setNameDraft = useStore((s) => s.setNameDraft);
  const commitName = useStore((s) => s.commitName);
  const openEditAdd = useStore((s) => s.openEditAdd);
  const closeEditAdd = useStore((s) => s.closeEditAdd);
  const setEditQuery = useStore((s) => s.setEditQuery);
  const moveRoutineEx = useStore((s) => s.moveRoutineEx);
  const removeRoutineEx = useStore((s) => s.removeRoutineEx);
  const setRoutineTarget = useStore((s) => s.setRoutineTarget);
  const togglePick = useStore((s) => s.togglePick);
  const commitPicks = useStore((s) => s.commitPicks);
  const createExercise = useStore((s) => s.createExercise);
  const addRoutineEx = useStore((s) => s.addRoutineEx);
  const deleteRoutine = useStore((s) => s.deleteRoutine);
  const askConfirm = useStore((s) => s.askConfirm);
  const toast_ = useStore((s) => s.toast_);

  if (!vm) return null;

  const existingNames = vm.items.map((i) => i.name);
  const library = useMemo(() => filterLibrary(state, editQuery, existingNames), [state, editQuery]);
  const canCreate = canCreateExercise(state, editQuery);
  const picks = editPicks || [];

  return (
    <BottomSheet visible onClose={closeEdit} maxHeightPct={0.82}>
      {!vm.adding ? (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 14 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginBottom: 5 }}>Routine name</Text>
              <TextInput
                value={vm.nameValue}
                onChangeText={setNameDraft}
                onBlur={commitName}
                onSubmitEditing={commitName}
                placeholder="Routine name"
                placeholderTextColor={c.t6a}
                style={{ fontFamily: fonts.display, fontSize: 21, color: c.fg, borderBottomWidth: 1.5, borderBottomColor: c.w18, paddingBottom: 5 }}
              />
            </View>
            <Pressable onPress={closeEdit} style={{ backgroundColor: '#c6ff00', borderRadius: 999, paddingVertical: 9, paddingHorizontal: 18 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 13, color: '#000' }}>Done</Text>
            </Pressable>
          </View>
          {vm.nameTaken && (
            <Text style={{ fontSize: 12.5, color: c.danger, fontFamily: fonts.bodySemibold, marginTop: -8, marginBottom: 12 }}>
              That name is already used by another routine
            </Text>
          )}
          <ScrollView style={{ maxHeight: 340 }}>
            {vm.items.map((it) => (
              <View key={it.name + it.index} style={{ paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.w09 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 11 }}>
                  <Text style={{ flex: 1, minWidth: 0, fontSize: 15, fontFamily: fonts.bodySemibold, color: c.fg }} numberOfLines={1}>{it.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 7 }}>
                    <IconCircleBtn glyph="↑" size={34} disabled={it.isFirst} onPress={() => moveRoutineEx(it.index, -1)} />
                    <IconCircleBtn glyph="↓" size={34} disabled={it.isLast} onPress={() => moveRoutineEx(it.index, 1)} />
                    <IconCircleBtn glyph="✕" size={34} disabled={it.cantRemove} onPress={() => removeRoutineEx(it.index)} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold }}>Sets</Text>
                    <IconCircleBtn glyph="−" size={26} onPress={() => setRoutineTarget(it.index, 'sets', -1)} />
                    <Text style={{ minWidth: 16, textAlign: 'center', fontFamily: fonts.num, fontSize: 15, fontWeight: '600' as any, color: c.fg }}>{it.sets}</Text>
                    <IconCircleBtn glyph="+" size={26} onPress={() => setRoutineTarget(it.index, 'sets', 1)} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold }}>Reps</Text>
                    <IconCircleBtn glyph="−" size={26} onPress={() => setRoutineTarget(it.index, 'reps', -1)} />
                    <Text style={{ minWidth: 16, textAlign: 'center', fontFamily: fonts.num, fontSize: 15, fontWeight: '600' as any, color: c.fg }}>{it.reps}</Text>
                    <IconCircleBtn glyph="+" size={26} onPress={() => setRoutineTarget(it.index, 'reps', 1)} />
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
          <Pressable onPress={openEditAdd} style={{ marginTop: 8, borderWidth: 1.5, borderColor: c.w20, borderRadius: 999, paddingVertical: 13, alignItems: 'center' }}>
            <Text style={{ color: c.fg, fontFamily: fonts.bodySemibold, fontSize: 15 }}>+ Add exercise</Text>
          </Pressable>
          <Pressable
            onPress={() => askConfirm({
              title: 'Delete routine?',
              body: `"${vm.name}" and its exercise list will be removed, and any day it's scheduled on becomes a rest day.`,
              label: 'Delete routine',
              run: () => { deleteRoutine(); toast_('Routine deleted'); },
            })}
            style={{ marginTop: 9, paddingVertical: 12, alignItems: 'center' }}
          >
            <Text style={{ color: c.danger, fontFamily: fonts.bodySemibold, fontSize: 14 }}>Delete routine</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Pressable onPress={closeEditAdd} accessibilityLabel="Back to routine"><Text style={{ color: c.fg, fontSize: 17 }}>‹</Text></Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 20, color: c.fg }} numberOfLines={1}>Add to {vm.name}</Text>
              <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginTop: 3 }}>Tap all you want · then add</Text>
            </View>
          </View>
          <LineInput value={editQuery} onChangeText={setEditQuery} placeholder="Search exercises" style={{ marginBottom: 6, paddingVertical: 11 }} />
          <ScrollView style={{ maxHeight: 300 }}>
            {library.map((lib) => {
              const on = picks.includes(lib.name);
              return (
                <Pressable key={lib.name} onPress={() => togglePick(lib.name)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 13, borderTopWidth: 1, borderTopColor: c.w09 }}>
                  <View style={{ minWidth: 0 }}>
                    <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: on ? c.acct : c.fg }} numberOfLines={1}>{lib.name}</Text>
                    <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginTop: 2 }}>{lib.group}</Text>
                  </View>
                  <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.acctFill : 'rgba(198,255,0,.14)' }}>
                    <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: on ? '#000' : c.acct }}>{on ? '✓' : '+'}</Text>
                  </View>
                </Pressable>
              );
            })}
            {canCreate && (
              <Pressable
                onPress={() => createExercise(editQuery, (n) => addRoutineEx(n))}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 13, borderTopWidth: 1, borderTopColor: c.w09 }}
              >
                <View style={{ minWidth: 0 }}>
                  <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: c.acct }} numberOfLines={1}>Create "{editQuery.trim()}"</Text>
                  <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginTop: 2 }}>New exercise · saved to your list</Text>
                </View>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(198,255,0,.14)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: c.acct, fontSize: 17, fontFamily: fonts.bodySemibold }}>+</Text>
                </View>
              </Pressable>
            )}
          </ScrollView>
          <View style={{ marginTop: 14, paddingTop: 6, borderTopWidth: 1, borderTopColor: c.w09 }}>
            <Pressable
              onPress={commitPicks}
              style={{
                borderRadius: 999, paddingVertical: 14, alignItems: 'center',
                backgroundColor: picks.length ? c.acctFill : 'transparent',
                borderWidth: picks.length ? 0 : 1.5, borderColor: c.w20,
              }}
            >
              <Text style={{ fontFamily: fonts.display, fontSize: 15, color: picks.length ? '#000' : c.fg }}>
                {picks.length ? `Add ${picks.length} exercise${picks.length === 1 ? '' : 's'}` : 'Done'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </BottomSheet>
  );
}
