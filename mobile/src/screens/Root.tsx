import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoutinesTabIcon, TodayTabIcon } from '../components/icons';
import { ConfirmDialog, ToastBanner } from '../components/ui';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/store';
import { fonts } from '../theme';
import { DayPickerSheet } from './DayPickerSheet';
import { LoggingScreen } from './LoggingScreen';
import { ProfileScreen } from './ProfileScreen';
import { RoutineEditorSheet } from './RoutineEditorSheet';
import { RoutinesScreen } from './RoutinesScreen';
import { SignInScreen } from './SignInScreen';
import { TodayScreen } from './TodayScreen';
import { WorkoutDetailOverlay } from './WorkoutDetailOverlay';

export function Root() {
  const { c } = useTheme();
  const authed = useStore((s) => s.authed);
  const logging = useStore((s) => s.logging);
  const hydrated = useStore((s) => s.hydrated);
  const toast = useStore((s) => s.toast);

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {!authed ? <SignInScreen /> : logging ? <LoggingScreen /> : <TabbedShell />}
      <ToastBanner message={toast} />
    </View>
  );
}

function TabbedShell() {
  const { c } = useTheme();
  const tab = useStore((s) => s.tab);
  const patch = useStore((s) => s.patch);
  const detailEntry = useStore((s) => s.detailEntry);
  const editName = useStore((s) => s.editName);
  const backlogDate = useStore((s) => s.backlogDate);
  const calEditDate = useStore((s) => s.calEditDate);
  const editDay = useStore((s) => s.editDay);
  const showProfile = useStore((s) => s.showProfile);
  const confirm = useStore((s) => s.confirm);
  const clearConfirm = useStore((s) => s.clearConfirm);

  const showDayPicker = !!backlogDate || !!calEditDate || (editDay !== null && editDay !== undefined);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>
        {tab === 'today' ? <TodayScreen /> : <RoutinesScreen />}
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1, borderTopColor: c.w10 }}>
        <NavItem active={tab === 'today'} label="Today" onPress={() => patch({ tab: 'today' })} icon={(color) => <TodayTabIcon color={color} />} />
        <NavItem active={tab === 'routines'} label="Routines" onPress={() => patch({ tab: 'routines' })} icon={(color) => <RoutinesTabIcon color={color} />} />
      </View>

      {!!detailEntry && <WorkoutDetailOverlay />}
      {!!editName && <RoutineEditorSheet />}
      {showDayPicker && <DayPickerSheet />}
      {showProfile && <ProfileScreen />}
      {!!confirm && (
        <ConfirmDialog
          title={confirm.title}
          body={confirm.body}
          label={confirm.label}
          onRun={confirm.run}
          onCancel={clearConfirm}
        />
      )}
    </SafeAreaView>
  );
}

function NavItem({
  active, label, onPress, icon,
}: { active: boolean; label: string; onPress: () => void; icon: (color: string) => React.ReactNode }) {
  const { c } = useTheme();
  const color = active ? c.acct : c.t5a;
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 6 }}>
      {icon(color)}
      <Text style={{ fontSize: 11, fontFamily: fonts.bodySemibold, color: active ? c.fg : c.t5a }}>{label}</Text>
    </Pressable>
  );
}
