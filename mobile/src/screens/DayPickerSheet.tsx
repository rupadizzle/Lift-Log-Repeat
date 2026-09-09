import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheet } from '../components/ui';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/store';
import { computeDayPicker } from '../store/derive';
import { fonts } from '../theme';

export function DayPickerSheet() {
  const { c } = useTheme();
  const state = useStore((s) => s);
  const vm = useMemo(() => computeDayPicker(state), [state]);

  const closeDayPicker = useStore((s) => s.closeDayPicker);
  const assignDay = useStore((s) => s.assignDay);
  const start = useStore((s) => s.start);
  const newRoutine = useStore((s) => s.newRoutine);

  if (!vm) return null;

  const onPick = (value: string) => {
    if (vm.mode === 'backlog' && state.backlogDate) start(value, state.backlogDate.iso);
    else assignDay(value);
  };

  return (
    <BottomSheet visible onClose={closeDayPicker} maxHeightPct={0.8}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 21, color: c.fg }}>{vm.day}</Text>
        <Pressable onPress={closeDayPicker}><Text style={{ color: c.fg, fontSize: 20 }}>✕</Text></Pressable>
      </View>
      <Text style={{ fontSize: 12.5, color: c.t6a, marginBottom: 6 }}>{vm.sub}</Text>
      {vm.options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onPick(o.value)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderTopWidth: 1, borderTopColor: c.w09 }}
        >
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 16, color: o.active ? c.acct : c.fg }}>{o.label}</Text>
          {o.active && <Text style={{ color: c.acct, fontSize: 12 }}>●</Text>}
        </Pressable>
      ))}
      <Pressable
        onPress={() => newRoutine(vm.createIso)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 15, borderTopWidth: 1, borderTopColor: c.w09 }}
      >
        <Text style={{ fontSize: 16, fontFamily: fonts.bodySemibold, color: c.acct }}>{vm.createLabel}</Text>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(198,255,0,.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: c.acct, fontSize: 17, fontFamily: fonts.bodySemibold }}>+</Text>
        </View>
      </Pressable>
    </BottomSheet>
  );
}
