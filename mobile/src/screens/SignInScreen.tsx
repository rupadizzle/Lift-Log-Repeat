import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoMark } from '../components/icons';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/store';
import { fonts } from '../theme';

export function SignInScreen() {
  const { c } = useTheme();
  const nameEntry = useStore((s) => s.nameEntry);
  const patch = useStore((s) => s.patch);
  const beginLocal = useStore((s) => s.beginLocal);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, paddingHorizontal: 28, paddingBottom: 24 }}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#c6ff00', alignItems: 'center', justifyContent: 'center', marginBottom: 26 }}>
              <LogoMark size={30} color="#000" />
            </View>
            <Text style={{ fontFamily: fonts.display, fontSize: 40, color: c.fg, lineHeight: 41, letterSpacing: -0.5, marginBottom: 12 }}>
              Lift.{'\n'}Log.{'\n'}Repeat.
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: c.t8a, lineHeight: 22.5 }}>
              The simplest way to track your lifts and watch your numbers climb.
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.t6a, fontFamily: fonts.bodySemibold, marginBottom: 8 }}>
              What should we call you?
            </Text>
            <TextInput
              value={nameEntry}
              onChangeText={(v) => patch({ nameEntry: v })}
              onSubmitEditing={beginLocal}
              placeholder="Your name"
              placeholderTextColor={c.t6a}
              returnKeyType="go"
              style={{
                width: '100%', backgroundColor: c.s0d, borderWidth: 1.5, borderColor: c.b33,
                borderRadius: 999, paddingVertical: 15, paddingHorizontal: 20,
                color: c.fg, fontFamily: fonts.body, fontSize: 16, marginBottom: 11,
              }}
            />
            <Pressable
              onPress={beginLocal}
              style={({ pressed }) => ({
                width: '100%', borderWidth: 0, backgroundColor: c.fg,
                paddingVertical: 16, borderRadius: 999, alignItems: 'center', marginBottom: 16,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontFamily: fonts.display, fontSize: 16, color: c.bg }}>Start training</Text>
            </Pressable>
            <Text style={{ fontSize: 11.5, color: c.t55, textAlign: 'center', lineHeight: 17 }}>
              No account, no sign-up. Your workouts are saved on this device only, and you can export or erase them anytime.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
