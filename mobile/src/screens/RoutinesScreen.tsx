import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { DumbbellIcon, LegsIcon, PullIcon } from '../components/icons';
import { Btn, IconCircleBtn } from '../components/ui';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/store';
import { computeRoutineCards } from '../store/derive';
import { fonts } from '../theme';

export function RoutinesScreen() {
  const { c } = useTheme();
  const state = useStore((s) => s);
  const cards = useMemo(() => computeRoutineCards(state), [state]);

  const start = useStore((s) => s.start);
  const openEdit = useStore((s) => s.openEdit);
  const moveRoutine = useStore((s) => s.moveRoutine);
  const newRoutine = useStore((s) => s.newRoutine);
  const startEmpty = useStore((s) => s.startEmpty);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 25, color: c.fg }}>Routines</Text>
        <Pressable
          onPress={() => newRoutine()}
          style={{ backgroundColor: c.acctFill, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 }}
        >
          <Text style={{ fontFamily: fonts.display, fontSize: 13, color: '#000' }}>+ New</Text>
        </Pressable>
      </View>

      {cards.map((r) => (
        <View key={r.name} style={{ paddingVertical: 13, borderTopWidth: 1, borderTopColor: c.w10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: c.s14, borderWidth: 1, borderColor: c.w08, alignItems: 'center', justifyContent: 'center' }}>
              {r.type === 'push' && <DumbbellIcon color={c.acct} />}
              {r.type === 'pull' && <PullIcon color={c.acct} />}
              {r.type === 'legs' && <LegsIcon color={c.acct} />}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 20, fontFamily: fonts.bodySemibold, color: c.fg }}>{r.name}</Text>
              <Text style={{ fontFamily: fonts.num, fontSize: 12.5, color: c.t7a, marginTop: 3 }}>{r.metaLine}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13.5, color: c.t5a, lineHeight: 20, marginBottom: 16 }}>{r.exercisesLine}</Text>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <Btn label="Start" flex={1} onPress={() => (r.hasExercises ? start(r.name) : openEdit(r.name))} />
            <Btn label="Edit" variant="outline" onPress={() => openEdit(r.name)} />
            {r.canReorder && (
              <>
                <IconCircleBtn
                  glyph="▲" size={42} disabled={r.isFirst}
                  label={`Move ${r.name} up`}
                  onPress={() => !r.isFirst && moveRoutine(r.name, -1)}
                />
                <IconCircleBtn
                  glyph="▼" size={42} disabled={r.isLast}
                  label={`Move ${r.name} down`}
                  onPress={() => !r.isLast && moveRoutine(r.name, 1)}
                />
              </>
            )}
          </View>
        </View>
      ))}

      <Pressable
        onPress={startEmpty}
        style={{ marginTop: 22, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.w20, borderRadius: 18, padding: 16 }}
      >
        <Text style={{ fontSize: 16, fontFamily: fonts.bodySemibold, color: c.fg }}>Quick workout</Text>
        <Text style={{ fontSize: 13, color: c.t7a, marginTop: 3 }}>Start with nothing and pick exercises as you go</Text>
      </Pressable>
    </ScrollView>
  );
}
