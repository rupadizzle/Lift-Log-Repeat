import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageIcon } from '../components/icons';
import { SwitchToggle } from '../components/ui';
import { askNotifPermission } from '../hooks/useReminder';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/store';
import { computeProfile, weeklyGoal } from '../store/derive';
import { fonts } from '../theme';
import { fmtClock } from '../utils';
import { exportCsv } from '../export';
import { eraseAllStorage } from '../store/persist';

export function ProfileScreen() {
  const { c } = useTheme();
  const state = useStore((s) => s);
  const profile = useMemo(() => computeProfile(state), [state]);
  const goal = useMemo(() => weeklyGoal(state), [state]);

  const closeProfile = useStore((s) => s.closeProfile);
  const setUserName = useStore((s) => s.setUserName);
  const setUnits = useStore((s) => s.setUnits);
  const setTheme = useStore((s) => s.setTheme);
  const restMinus = useStore((s) => s.restMinus);
  const restPlus = useStore((s) => s.restPlus);
  const toggleNotif = useStore((s) => s.toggleNotif);
  const notifEarlier = useStore((s) => s.notifEarlier);
  const notifLater = useStore((s) => s.notifLater);
  const toggleSound = useStore((s) => s.toggleSound);
  const toggleHaptics = useStore((s) => s.toggleHaptics);
  const askConfirm = useStore((s) => s.askConfirm);
  const eraseAll = useStore((s) => s.eraseAll);
  const toast_ = useStore((s) => s.toast_);

  const notifHint = !state.notif
    ? 'Off — no nudge on training days'
    : state.notifPerm === 'granted' ? 'System notification while the app is open'
    : state.notifPerm === 'denied' ? 'Blocked by your device settings — shows in-app instead'
    : state.notifPerm === 'undetermined' ? 'Unsupported in Expo Go on Android — shows in-app instead'
    : 'Shows in-app · tap to allow system notifications';

  const notifTimeLabel = (state.notifHour % 12 === 0 ? 12 : state.notifHour % 12) + (state.notifHour < 12 ? ' am' : ' pm');

  const onToggleNotif = () => {
    toggleNotif();
    if (useStore.getState().notif) askNotifPermission();
  };

  const row = (children: React.ReactNode, key?: string) => (
    <View key={key} style={{ paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.w09 }}>{children}</View>
  );

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={closeProfile}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
        <View style={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable onPress={closeProfile} accessibilityLabel="Close profile" style={{ width: 34, height: 34, marginLeft: -8, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.fg, fontSize: 26 }}>‹</Text>
          </Pressable>
          <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 22, color: c.fg }}>Profile</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, paddingTop: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, borderColor: c.w16, backgroundColor: c.s14, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 24, color: c.fg }}>{profile.initials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <TextInput
                value={state.userName}
                onChangeText={setUserName}
                placeholder="Your name"
                placeholderTextColor={c.t6a}
                style={{ fontFamily: fonts.display, fontSize: 24, color: c.fg, padding: 0 }}
              />
              <Text style={{ fontSize: 13, color: c.t6a, marginTop: 2 }}>{profile.since}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 22, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.w10, marginBottom: 24 }}>
            <View><Text style={{ fontFamily: fonts.display, fontSize: 24, color: c.fg }}>{profile.workouts}</Text><Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginTop: 5 }}>Workouts</Text></View>
            <View><Text style={{ fontFamily: fonts.display, fontSize: 24, color: c.fg }}>{profile.volume}</Text><Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginTop: 5 }}>{profile.volUnit}</Text></View>
            <View><Text style={{ fontFamily: fonts.display, fontSize: 24, color: c.acct }}>{profile.week}</Text><Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginTop: 5 }}>This week</Text></View>
          </View>

          <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginBottom: 12 }}>Preferences</Text>

          {row(
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: c.fg }}>Units</Text>
              <SegToggle
                left="kg" right="lb" value={state.units}
                onLeft={() => setUnits('kg')} onRight={() => setUnits('lb')}
              />
            </View>
          )}

          {row(
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: c.fg }}>Appearance</Text>
              <SegToggle
                left="Dark" right="Light" value={state.theme === 'dark' ? 'dark' : 'light'} leftVal="dark" rightVal="light"
                onLeft={() => setTheme('dark')} onRight={() => setTheme('light')}
              />
            </View>
          )}

          {row(
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ minWidth: 0 }}>
                <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: c.fg }}>Weekly goal</Text>
                <Text style={{ fontSize: 12.5, color: c.t6a, marginTop: 2 }}>Set by your weekly plan</Text>
              </View>
              <Text style={{ fontFamily: fonts.num, fontSize: 15, fontWeight: '600' as any, color: c.acct }}>
                {goal.goalTarget} days
              </Text>
            </View>
          )}

          {row(
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: c.fg }}>Default rest</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <StepCircle glyph="−" onPress={restMinus} c={c} />
                <Text style={{ fontFamily: fonts.num, fontSize: 16, fontWeight: '600' as any, color: c.fg, minWidth: 52, textAlign: 'center' }}>{fmtClock(state.restDur)}</Text>
                <StepCircle glyph="+" onPress={restPlus} c={c} />
              </View>
            </View>
          )}

          <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginTop: 24, marginBottom: 4 }}>Your data</Text>

          {row(
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
              <StorageIcon color={c.t8a} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 14, fontFamily: fonts.bodySemibold, color: c.fg }}>Saved on this device</Text>
                <Text style={{ fontSize: 12.5, color: c.t6a, marginTop: 1 }}>{profile.storageLine}</Text>
              </View>
            </View>
          )}

          {row(
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: c.fg }}>Workout reminders</Text>
                <Text style={{ fontSize: 12.5, color: c.t6a, marginTop: 2 }}>{notifHint}</Text>
              </View>
              <SwitchToggle on={state.notif} onToggle={onToggleNotif} />
            </View>
          )}

          {state.notif && row(
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: c.fg }}>Remind me at</Text>
                <Text style={{ fontSize: 12.5, color: c.t6a, marginTop: 2 }}>Only if you haven't trained yet</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <StepCircle glyph="−" onPress={notifEarlier} c={c} size={30} />
                <Text style={{ fontFamily: fonts.num, fontSize: 15, fontWeight: '600' as any, color: c.fg, minWidth: 52, textAlign: 'center' }}>{notifTimeLabel}</Text>
                <StepCircle glyph="+" onPress={notifLater} c={c} size={30} />
              </View>
            </View>
          )}

          {row(
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: c.fg }}>Rest timer sound</Text>
                <Text style={{ fontSize: 12.5, color: c.t6a, marginTop: 2 }}>Two chimes when your rest ends</Text>
              </View>
              <SwitchToggle on={state.sound} onToggle={toggleSound} />
            </View>
          )}

          {row(
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: c.fg }}>Vibration</Text>
                <Text style={{ fontSize: 12.5, color: c.t6a, marginTop: 2 }}>Buzz when the rest timer ends</Text>
              </View>
              <SwitchToggle on={state.haptics} onToggle={toggleHaptics} />
            </View>
          )}

          <Pressable
            onPress={() => exportCsv(state, toast_)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.w09 }}
          >
            <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: c.fg }}>Export data</Text>
            <Text style={{ fontSize: 13, fontFamily: fonts.bodyMedium, color: c.t6a }}>{profile.workouts} workouts · CSV</Text>
          </Pressable>

          <Pressable
            onPress={() => askConfirm({
              title: 'Erase all data?',
              body: 'Every logged workout, routine and setting on this device is removed. There is no account holding a copy — export your CSV first if you want to keep it.',
              label: 'Erase everything',
              run: () => { eraseAll(); eraseAllStorage(); },
            })}
            style={{ paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.w09 }}
          >
            <Text style={{ fontSize: 15, fontFamily: fonts.bodySemibold, color: c.danger }}>Erase all data</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function SegToggle({
  left, right, value, leftVal = 'kg', rightVal = 'lb', onLeft, onRight,
}: { left: string; right: string; value: string; leftVal?: string; rightVal?: string; onLeft: () => void; onRight: () => void }) {
  const { c } = useTheme();
  const seg = (label: string, active: boolean, onPress: () => void) => (
    <Pressable onPress={onPress} style={{ borderRadius: 999, paddingVertical: 6, paddingHorizontal: 16, backgroundColor: active ? c.acctFill : 'transparent' }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 14, color: active ? '#000' : c.t8a }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.s14, borderWidth: 1, borderColor: c.w10, borderRadius: 999, padding: 3 }}>
      {seg(left, value === leftVal, onLeft)}
      {seg(right, value === rightVal, onRight)}
    </View>
  );
}

function StepCircle({ glyph, onPress, c, size = 32 }: { glyph: string; onPress: () => void; c: ReturnType<typeof useTheme>['c']; size?: number }) {
  return (
    <Pressable onPress={onPress} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: c.w20, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: c.fg, fontSize: 17 }}>{glyph}</Text>
    </Pressable>
  );
}
