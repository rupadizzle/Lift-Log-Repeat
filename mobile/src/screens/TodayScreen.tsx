import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Btn, Label } from '../components/ui';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/store';
import { computeCalendar, computeHero, weeklyGoal } from '../store/derive';
import { fonts } from '../theme';
import { longDate, todayDate } from '../utils';

export function TodayScreen() {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const state = useStore((s) => s);
  const {
    userName, calOff,
  } = state;

  const hero = useMemo(() => computeHero(state), [state]);
  const goal = useMemo(() => weeklyGoal(state), [state]);
  const cal = useMemo(() => computeCalendar(state), [state]);

  const start = useStore((s) => s.start);
  const startEmpty = useStore((s) => s.startEmpty);
  const repeatRoutine = useStore((s) => s.repeatRoutine);
  const openProfile = useStore((s) => s.openProfile);
  const openDetailFor = useStore((s) => s.openDetailFor);
  const openCalEditDate = useStore((s) => s.openCalEditDate);
  const openBacklogDate = useStore((s) => s.openBacklogDate);
  const setCalOff = useStore((s) => s.setCalOff);
  const calToday = useStore((s) => s.calToday);

  const initials = (userName || '?').trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const GAP = 5;
  const H_PAD = 20;
  const cellSize = (width - H_PAD * 2 - GAP * 6) / 7;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 16 }}>
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <Text style={{ fontSize: 13, color: c.t6a, fontFamily: fonts.bodyMedium }}>{longDate(todayDate())}</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 25, color: c.fg, marginTop: 3 }}>Ready to lift</Text>
          <Text style={{ fontFamily: fonts.num, fontSize: 13, color: c.acct, marginTop: 5 }}>{goal.goalLine}</Text>
        </View>
        <Pressable
          onPress={openProfile}
          accessibilityLabel="Profile"
          style={{
            borderWidth: 1.5, borderColor: c.w16, backgroundColor: c.s14,
            width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: fonts.display, fontSize: 15, color: c.fg }}>{initials}</Text>
        </Pressable>
      </View>

      {/* calendar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 16, color: c.fg }}>{cal.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {calOff !== 0 && (
            <Pressable onPress={calToday} style={{ borderWidth: 1.5, borderColor: c.acct, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 13 }}>
              <Text style={{ color: c.acct, fontFamily: fonts.bodySemibold, fontSize: 12.5 }}>Today</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityLabel="Previous month"
            onPress={() => setCalOff((n) => n - 1)}
            style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: c.w18, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: c.fg, fontSize: 14 }}>‹</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Next month"
            onPress={() => setCalOff((n) => n + 1)}
            style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: c.w18, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: c.fg, fontSize: 14 }}>›</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 4 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => (
          <View key={i} style={{ width: cellSize, alignItems: 'center', marginRight: i < 6 ? GAP : 0 }}>
            <Label style={{ fontSize: 10 }}>{l}</Label>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cal.cells.map((cell, i) => {
          const isCol7 = (i + 1) % 7 === 0;
          if (!cell.iso) {
            return <View key={i} style={{ width: cellSize, height: 36, marginRight: isCol7 ? 0 : GAP, marginBottom: GAP }} />;
          }
          let bg = 'transparent';
          let textColor = c.t5a;
          let border: string | undefined;
          let ring = false;
          if (cell.worked) {
            bg = c.acctFill; textColor = '#000'; ring = !!cell.isToday;
          } else if (cell.isToday) {
            border = c.acct; textColor = c.acct;
          } else if (cell.isFuture) {
            textColor = c.t5a;
          } else {
            bg = c.s14; textColor = c.t5a;
          }
          const onPress = () => {
            if (cell.entry) openDetailFor(cell.entry);
            else if (cell.isToday || cell.isFuture) openCalEditDate(cell.iso!, cell.wd!);
            else openBacklogDate(cell.iso!, cell.wd!);
          };
          // React Native has no CSS box-shadow ring — approximate the
          // original's "bg gap + accent ring" halo (marks today when it's
          // also a trained/green day) with a fixed-size outer border instead
          // of an outer glow, so the ringed cell doesn't grow and shove its
          // grid neighbors.
          return (
            <View
              key={i}
              style={{
                width: cellSize, height: 36, marginRight: isCol7 ? 0 : GAP, marginBottom: GAP,
                borderRadius: 11, borderWidth: ring ? 2 : 0, borderColor: ring ? c.acctFill : 'transparent',
                padding: ring ? 2 : 0,
              }}
            >
              <Pressable
                onPress={onPress}
                style={{
                  flex: 1, borderRadius: ring ? 8 : 10, alignItems: 'center', justifyContent: 'center', gap: 3,
                  backgroundColor: bg,
                  borderWidth: border ? 1.5 : 0, borderColor: border,
                }}
              >
                <Text style={{ fontFamily: fonts.num, fontSize: 12, fontWeight: cell.worked ? '700' as any : '600' as any, color: textColor, lineHeight: 14 }}>{cell.num}</Text>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: cell.planned && !cell.worked ? c.acct : 'transparent' }} />
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: c.acctFill }} />
          <Text style={{ fontSize: 12, color: c.t6a, fontFamily: fonts.bodyMedium }}>Trained</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: c.acct, marginHorizontal: 3 }} />
          <Text style={{ fontSize: 12, color: c.t6a, fontFamily: fonts.bodyMedium }}>Planned</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 12, color: c.t5a, fontFamily: fonts.bodyMedium }}>Tap to plan</Text>
      </View>

      {/* adaptive hero */}
      <HeroCard hero={hero} start={start} startEmpty={startEmpty} repeatRoutine={repeatRoutine} openDetailFor={openDetailFor} />
    </ScrollView>
  );
}

function HeroCard({
  hero, start, repeatRoutine, openDetailFor,
}: {
  hero: ReturnType<typeof computeHero>;
  start: (name: string) => void;
  startEmpty: () => void;
  repeatRoutine: (name: string) => void;
  openDetailFor: (e: any) => void;
}) {
  const { c } = useTheme();
  const cancelLogging = useStore((s) => s.cancelLogging);
  const patch = useStore((s) => s.patch);

  if (hero.kind === 'resume') {
    return (
      <View>
        <Label color={c.acct} style={{ marginBottom: 10 }}>In progress</Label>
        <Text style={{ fontFamily: fonts.display, fontSize: 23, color: c.fg, marginBottom: 8 }}>{hero.name}</Text>
        <Text style={{ fontSize: 14, color: c.t8a, marginBottom: 13 }}>{hero.sub}</Text>
        <Btn label="Resume workout" onPress={() => patch({ logging: true, startTs: Date.now() - useStore.getState().elapsed * 1000 })} style={{ marginBottom: 10 }} />
        <Btn
          label="Discard"
          variant="outline"
          onPress={() => patch({ workout: null, curEx: 0, curSet: 0, sessionPrs: [], logDate: null, rest: 0, restEnd: 0 })}
        />
      </View>
    );
  }
  if (hero.kind === 'done') {
    return (
      <View>
        <Label color={c.acct} style={{ marginBottom: 10 }}>Logged today</Label>
        <Text style={{ fontFamily: fonts.display, fontSize: 23, color: c.fg, marginBottom: 8 }}>{hero.name}</Text>
        <Text style={{ fontFamily: fonts.num, fontSize: 14, color: c.t8a, marginBottom: 13 }}>{hero.sub}</Text>
        <Btn label="View summary" onPress={() => openDetailFor(hero.entry)} style={{ marginBottom: 10 }} />
        <Btn label={`Train again · ${hero.nextName}`} variant="outline" onPress={() => start(hero.nextName)} />
      </View>
    );
  }
  if (hero.kind === 'rest') {
    return (
      <View>
        <Label style={{ marginBottom: 10 }}>Recovery</Label>
        <Text style={{ fontFamily: fonts.display, fontSize: 23, color: c.fg, marginBottom: 8 }}>Rest day</Text>
        <Text style={{ fontSize: 14, color: c.t8a, marginBottom: 13 }}>{hero.sub}</Text>
        <Btn label={`Train anyway · ${hero.name}`} variant="outline" onPress={() => start(hero.name)} />
      </View>
    );
  }
  return (
    <View>
      <Label style={{ marginBottom: 10 }}>Up next</Label>
      <Text style={{ fontFamily: fonts.display, fontSize: 23, color: c.fg, marginBottom: 8 }}>{hero.name}</Text>
      <Text style={{ fontSize: 14, color: c.t8a, marginBottom: 6 }}>{hero.meta}</Text>
      <Text style={{ fontSize: 13, color: c.t5a, lineHeight: 19.5, marginBottom: 13 }}>{hero.line}</Text>
      <Btn label="Start workout" onPress={() => start(hero.name)} style={{ marginBottom: hero.showRepeat ? 10 : 0 }} />
      {hero.showRepeat && (
        <Btn label={`↻ Repeat last · ${hero.lastName}`} variant="outline" onPress={() => repeatRoutine(hero.lastName)} />
      )}
    </View>
  );
}
