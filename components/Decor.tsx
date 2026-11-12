import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../lib/theme';

export function LeafMark({ size = 34, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const ink = color || colors.forest;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M20 34C20 24 22 14 31 7" stroke={ink} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <Path d="M23 22C13 23 8 18 8 10C17 9 23 13 23 22Z" fill={ink} opacity="0.9" />
      <Path d="M25 17C25 9 30 5 36 5C37 12 33 17 25 17Z" fill={colors.sage} opacity="0.95" />
      <Path d="M20 29C13 30 9 27 8 22C14 20 19 23 20 29Z" fill={colors.gold} opacity="0.65" />
    </Svg>
  );
}

export function GoldSpark({ size = 16, opacity = 1 }: { size?: number; opacity?: number }) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" style={{ opacity }}>
      <Path d="M10 0C10.9 6.2 13.8 9.1 20 10C13.8 10.9 10.9 13.8 10 20C9.1 13.8 6.2 10.9 0 10C6.2 9.1 9.1 6.2 10 0Z" fill={colors.gold} />
    </Svg>
  );
}

export function ForestCorner() {
  const { colors } = useTheme();
  return (
    <View pointerEvents="none" style={styles.corner}>
      <Svg width="100" height="86" viewBox="0 0 100 86">
        <Circle cx="86" cy="13" r="34" fill={colors.sage} opacity="0.1" />
        <Path d="M59 81C67 54 77 35 96 15" stroke={colors.forest} strokeWidth="1.5" opacity="0.17" fill="none" />
        <Path d="M72 50C55 48 51 39 53 30C67 32 74 38 72 50Z" fill={colors.sage} opacity="0.2" />
        <Path d="M80 36C78 24 85 16 95 15C97 27 91 34 80 36Z" fill={colors.gold} opacity="0.16" />
        <Path d="M64 65C51 66 44 60 43 51C55 49 63 54 64 65Z" fill={colors.forest} opacity="0.13" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', right: -3, top: -2 },
});
