import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { fonts, ON_ACCENT } from '../theme';

// ---------------------------------------------------------------- Button --
type BtnVariant = 'solid' | 'outline' | 'ghost' | 'danger-solid' | 'danger-ghost';

export function Btn({
  label, onPress, variant = 'solid', disabled, style, textStyle, flex,
}: {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  flex?: number;
}) {
  const { c } = useTheme();
  const bg =
    variant === 'solid' ? c.acctFill
      : variant === 'danger-solid' ? c.dangerFill
      : 'transparent';
  const border =
    variant === 'outline' ? c.w20
      : variant === 'danger-ghost' ? 'transparent'
      : 'transparent';
  const color =
    variant === 'solid' ? ON_ACCENT
      : variant === 'danger-solid' ? '#fff'
      : variant === 'danger-ghost' ? c.danger
      : c.fg;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: border,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
          flex,
        },
        style,
      ]}
    >
      <Text
        style={[
          { fontFamily: fonts.display, fontSize: 15, fontWeight: undefined, color },
          variant === 'ghost' || variant === 'outline' || variant === 'danger-ghost'
            ? { fontFamily: fonts.bodySemibold }
            : null,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ------------------------------------------------------------ IconCircle --
export function IconCircleBtn({
  glyph, onPress, size = 34, disabled, color, borderColor, style, label,
}: {
  glyph: string;
  onPress?: () => void;
  size?: number;
  disabled?: boolean;
  color?: string;
  borderColor?: string;
  style?: ViewStyle;
  label?: string;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          width: size, height: size, borderRadius: size / 2,
          borderWidth: 1.5, borderColor: disabled ? c.w14 : (borderColor || c.w20),
          alignItems: 'center', justifyContent: 'center',
          opacity: disabled ? 0.45 : pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.44, color: disabled ? c.t3a : (color || c.fg), lineHeight: size * 0.5 }}>{glyph}</Text>
    </Pressable>
  );
}

// -------------------------------------------------------------- Switch ----
export function SwitchToggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={disabled ? undefined : onToggle} disabled={disabled} accessibilityRole="switch" accessibilityState={{ checked: on }}>
      <View
        style={{
          width: 46, height: 28, borderRadius: 999, padding: 3,
          backgroundColor: on ? c.acctFill : c.s1d,
          flexDirection: 'row', justifyContent: on ? 'flex-end' : 'flex-start',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: on ? '#000' : c.t6a }} />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------- Input ---
export function LineInput(props: TextInputProps & { c?: ReturnType<typeof useTheme>['c'] }) {
  const { c } = useTheme();
  return (
    <TextInput
      placeholderTextColor={c.t6a}
      style={[
        {
          width: '100%',
          backgroundColor: c.s0d, borderWidth: 1.5, borderColor: c.b33,
          borderRadius: 999, paddingVertical: 13, paddingHorizontal: 20,
          color: c.fg, fontFamily: fonts.body, fontSize: 16,
        },
        props.style,
      ]}
      {...props}
    />
  );
}

// ------------------------------------------------------------ BottomSheet -
export function BottomSheet({
  visible, onClose, children, maxHeightPct = 0.8,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeightPct?: number;
}) {
  const { c } = useTheme();
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles2.backdrop} onPress={onClose} />
      <View style={[styles2.sheet, { backgroundColor: c.sheet, borderColor: c.sheetline, maxHeight: `${maxHeightPct * 100}%` }]}>
        <View style={[styles2.handle, { backgroundColor: c.t44 }]} />
        {children}
      </View>
    </Modal>
  );
}

const styles2 = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,.6)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopWidth: 1.5, borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 22, paddingTop: 16, paddingBottom: 30,
  },
  handle: { width: 38, height: 4, borderRadius: 999, alignSelf: 'center', marginBottom: 16 },
});

// --------------------------------------------------------- ConfirmDialog --
export function ConfirmDialog({
  title, body, label, onRun, onCancel,
}: {
  title: string; body: string; label: string; onRun: () => void; onCancel: () => void;
}) {
  const { c } = useTheme();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles3.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles3.card, { backgroundColor: c.sheet, borderColor: c.sheetline }]}>
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: c.fg, lineHeight: 23, marginBottom: 8 }}>{title}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: c.t8a, lineHeight: 21, marginBottom: 20 }}>{body}</Text>
          <Btn label={label} variant="danger-solid" onPress={onRun} style={{ marginBottom: 9 }} />
          <Btn label="Keep it" variant="outline" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

const styles3 = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,.66)', alignItems: 'stretch', justifyContent: 'center', paddingHorizontal: 24,
  },
  card: {
    borderWidth: 1.5, borderRadius: 24, padding: 22, paddingTop: 24,
  },
});

// -------------------------------------------------------------- Toast ----
export function ToastBanner({ message }: { message: string }) {
  const { c } = useTheme();
  if (!message) return null;
  return (
    <View pointerEvents="none" style={styles4.wrap}>
      <View style={[styles4.pill, { backgroundColor: c.fg }]}>
        <Text style={{ color: c.bg, fontFamily: fonts.bodySemibold, fontSize: 13.5 }}>{message}</Text>
      </View>
    </View>
  );
}

const styles4 = StyleSheet.create({
  wrap: { position: 'absolute', left: 20, right: 20, bottom: 100, alignItems: 'center', zIndex: 50 },
  pill: { paddingVertical: 11, paddingHorizontal: 18, borderRadius: 999, maxWidth: '100%' },
});

// -------------------------------------------------------------- Label ----
export function Label({ children, color, style }: { children: React.ReactNode; color?: string; style?: TextStyle }) {
  const { c } = useTheme();
  return (
    <Text
      style={[
        { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: color || c.t6a, fontFamily: fonts.bodySemibold },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
