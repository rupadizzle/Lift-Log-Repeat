import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconCircleBtn } from '../components/ui';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/store';
import { computeDetail } from '../store/derive';
import { fonts } from '../theme';

export function WorkoutDetailOverlay() {
  const { c } = useTheme();
  const state = useStore((s) => s);
  const { detailEntry: de, editSets } = state;
  const detail = useMemo(() => computeDetail(state, de), [state, de]);

  const closeDetail = useStore((s) => s.closeDetail);
  const toggleEditSets = useStore((s) => s.toggleEditSets);
  const resumeSession = useStore((s) => s.resumeSession);
  const repeatRoutine = useStore((s) => s.repeatRoutine);
  const deleteSession = useStore((s) => s.deleteSession);
  const askConfirm = useStore((s) => s.askConfirm);
  const toast_ = useStore((s) => s.toast_);
  const editSavedSet = useStore((s) => s.editSavedSet);
  const addSavedSet = useStore((s) => s.addSavedSet);
  const removeSavedSet = useStore((s) => s.removeSavedSet);

  if (!de || !detail) return null;

  const stepBtnSize = 28;

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={closeDetail}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
        <View style={{ paddingTop: 10, paddingHorizontal: 22, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable onPress={closeDetail} accessibilityLabel="Back to today" style={{ width: 34, height: 34, marginLeft: -8, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.fg, fontSize: 22 }}>‹</Text>
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 22, color: c.fg }} numberOfLines={1}>{detail.name}</Text>
            <Text style={{ fontFamily: fonts.num, fontSize: 13, color: c.t7a, marginTop: 2 }}>{detail.date} · {detail.duration}</Text>
          </View>
          {detail.canResume && (
            <Pressable onPress={() => resumeSession(de)} style={{ backgroundColor: '#c6ff00', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 15 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 13, color: '#000' }}>Continue</Text>
            </Pressable>
          )}
          {!detail.canResume && detail.canRepeat && (
            <Pressable onPress={() => repeatRoutine(de.routine || de.name)} style={{ borderWidth: 1.5, borderColor: c.w20, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 15 }}>
              <Text style={{ color: c.fg, fontFamily: fonts.bodySemibold, fontSize: 13 }}>↻ Repeat</Text>
            </Pressable>
          )}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', gap: 22, paddingVertical: 6, paddingBottom: 24 }}>
            <View>
              <Text style={{ fontFamily: fonts.display, fontSize: 22, color: c.fg }}>{detail.volume}</Text>
              <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginTop: 5 }}>{detail.volUnit}</Text>
            </View>
            <View>
              <Text style={{ fontFamily: fonts.display, fontSize: 22, color: c.fg }}>{detail.sets}</Text>
              <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginTop: 5 }}>Sets</Text>
            </View>
            <View>
              <Text style={{ fontFamily: fonts.display, fontSize: 22, color: c.acct }}>{detail.prs}</Text>
              <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginTop: 5 }}>PRs</Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: c.t6a, lineHeight: 17, marginTop: -12, marginBottom: 18 }}>{detail.prNote}</Text>

          {detail.exercises.map((ex) => (
            <View key={ex.name + ex.exI} style={{ paddingVertical: 13, borderTopWidth: 1, borderTopColor: c.w10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 17, fontFamily: fonts.bodySemibold, color: c.fg }}>{ex.name}</Text>
                  {ex.hasE1rm && <Text style={{ fontFamily: fonts.num, fontSize: 12, color: c.t6a, marginTop: 2 }}>{ex.e1rmLine}</Text>}
                </View>
                {ex.pr && (
                  <View style={{ backgroundColor: c.acctFill, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 }}>
                    <Text style={{ fontFamily: fonts.num, fontSize: 10.5, fontWeight: '700' as any, color: '#000', letterSpacing: 0.4 }}>PR</Text>
                  </View>
                )}
              </View>

              {ex.sets.map((st) => (
                <View key={st.idx} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                  <Text style={{ width: 22, fontFamily: fonts.num, fontSize: 13, color: c.t5a, fontWeight: '600' as any }}>{st.idx + 1}</Text>
                  <Text style={{ flex: 1, minWidth: 0, fontFamily: fonts.num, fontSize: 16, fontWeight: '600' as any, color: st.best ? c.acct : c.fg }}>{st.val}</Text>
                  {st.best && <Text style={{ color: c.acct, fontSize: 13 }}>✦</Text>}
                  {editSets && detail.isMine && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, width: '100%', paddingLeft: 34 }}>
                      <IconCircleBtn glyph="−" size={stepBtnSize} label="Less weight" onPress={() => editSavedSet(de, ex.exI, st.idx, 'kg', -unitStep(state.units))} />
                      <IconCircleBtn glyph="+" size={stepBtnSize} label="More weight" onPress={() => editSavedSet(de, ex.exI, st.idx, 'kg', unitStep(state.units))} />
                      <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold }}>{state.units}</Text>
                      <IconCircleBtn glyph="−" size={stepBtnSize} label="Fewer reps" onPress={() => editSavedSet(de, ex.exI, st.idx, 'reps', -1)} />
                      <IconCircleBtn glyph="+" size={stepBtnSize} label="More reps" onPress={() => editSavedSet(de, ex.exI, st.idx, 'reps', 1)} />
                      <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold }}>reps</Text>
                      <View style={{ flex: 1 }} />
                      <IconCircleBtn glyph="✕" size={stepBtnSize} label="Delete set" onPress={() => removeSavedSet(de, ex.exI, st.idx)} />
                    </View>
                  )}
                </View>
              ))}
              {editSets && detail.isMine && (
                <Pressable onPress={() => addSavedSet(de, ex.exI)} style={{ marginTop: 6, alignSelf: 'flex-start', borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.w20, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 }}>
                  <Text style={{ color: c.t8a, fontFamily: fonts.bodySemibold, fontSize: 13 }}>+ Add set</Text>
                </Pressable>
              )}
            </View>
          ))}

          {detail.isMine && (
            <Pressable onPress={toggleEditSets} style={{ marginTop: 18, borderWidth: 1.5, borderColor: c.w20, borderRadius: 999, paddingVertical: 13, alignItems: 'center' }}>
              <Text style={{ color: c.fg, fontFamily: fonts.bodySemibold, fontSize: 14 }}>{editSets ? 'Done editing' : 'Edit sets'}</Text>
            </Pressable>
          )}
          {detail.isMine && (
            <Pressable
              onPress={() => askConfirm({
                title: 'Delete this session?',
                body: `${detail.name} · ${detail.date} will be removed from your history. This can't be undone.`,
                label: 'Delete session',
                run: () => { deleteSession(de); toast_('Session deleted'); },
              })}
              style={{ marginTop: 10, borderWidth: 1.5, borderColor: c.w16, borderRadius: 999, paddingVertical: 13, alignItems: 'center' }}
            >
              <Text style={{ color: c.danger, fontFamily: fonts.bodySemibold, fontSize: 14 }}>Delete this session</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function unitStep(units: 'kg' | 'lb') {
  return units === 'lb' ? 5 : 2.5;
}
