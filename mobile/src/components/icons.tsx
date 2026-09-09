import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function DumbbellIcon({ size = 20, color = '#c6ff00' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx={4} cy={12} r={3} />
      <Circle cx={20} cy={12} r={3} />
      <Rect x={6} y={10.6} width={12} height={2.8} rx={1} />
    </Svg>
  );
}

export function PullIcon({ size = 20, color = '#c6ff00' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 5h16" />
      <Path d="M12 7v10" />
      <Path d="M8 13l4 4 4-4" />
    </Svg>
  );
}

export function LegsIcon({ size = 20, color = '#c6ff00' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={4.5} r={1.8} fill={color} stroke="none" />
      <Path d="M12 8v5l-4 6" />
      <Path d="M12 13l4 6" />
    </Svg>
  );
}

export function TodayTabIcon({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={4.5} width={18} height={16} rx={3} />
      <Path d="M8 3v3M16 3v3M3 9.5h18" />
      <Path d="M9 14.5l2.2 2.2L15.5 12.5" />
    </Svg>
  );
}

export function RoutinesTabIcon({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 6.5h4M4 12h4M4 17.5h4" />
      <Path d="M11.5 6.5h8.5M11.5 12h8.5M11.5 17.5h8.5" />
    </Svg>
  );
}

export function LogoMark({ size = 30, color = '#000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx={4} cy={12} r={3} />
      <Circle cx={20} cy={12} r={3} />
      <Rect x={6} y={10.6} width={12} height={2.8} rx={1} />
    </Svg>
  );
}

export function StorageIcon({ size = 18, color = '#8a8a8a' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4} y={10} width={16} height={10} rx={2.5} />
      <Path d="M8 10V7.5a4 4 0 018 0V10" />
    </Svg>
  );
}
