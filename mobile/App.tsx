import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from '@expo-google-fonts/instrument-sans';
import {
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useReminder } from './src/hooks/useReminder';
import { useTicker } from './src/hooks/useTicker';
import { Root } from './src/screens/Root';
import { usePersistence } from './src/store/persist';
import { tokensFor } from './src/theme';
import { useStore } from './src/store/store';

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

function AppInner() {
  usePersistence();
  useTicker();
  useReminder();
  const theme = useStore((s) => s.theme);
  const c = tokensFor(theme);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Root />
    </View>
  );
}
