import React, { createContext, useContext } from 'react';
import { Platform, ViewStyle } from 'react-native';
import { COLORS } from './constants';
import type { TelegramWebApp } from './telegram';

export interface AppColors {
  bg: string;
  card: string;
  text: string;
  muted: string;
  subtle: string;
  border: string;
  cream: string;
  sage: string;
  forest: string;
  terra: string;
  gold: string;
  brown: string;
  input: string;
  forestSoft: string;
  goldSoft: string;
  terraSoft: string;
  shadow: string;
  darkBg: string;
  dark: boolean;
}

export interface AppTheme {
  colors: AppColors;
  serif: string;
  sans: string;
  cardShadow: ViewStyle;
}

export function buildTheme(system: 'light' | 'dark' | 'unspecified' | null | undefined, telegram?: TelegramWebApp): AppTheme {
  const dark = telegram?.colorScheme ? telegram.colorScheme === 'dark' : system === 'dark';
  const colors: AppColors = {
    bg: telegram?.themeParams?.bg_color || (dark ? COLORS.darkBg : COLORS.cream),
    card: dark ? COLORS.darkCard : COLORS.card,
    text: telegram?.themeParams?.text_color || (dark ? COLORS.cream : COLORS.brown),
    muted: dark ? '#C9BCA7' : '#7A6C5C',
    subtle: dark ? '#44382D' : '#EEE4D2',
    border: dark ? '#514236' : '#E5DAC5',
    cream: COLORS.cream,
    sage: COLORS.sage,
    forest: COLORS.forest,
    terra: COLORS.terra,
    gold: COLORS.gold,
    brown: COLORS.brown,
    input: dark ? '#2A221C' : '#F8F1E4',
    forestSoft: dark ? '#414938' : '#E4E8DA',
    goldSoft: dark ? '#51432D' : '#F2E7CA',
    terraSoft: dark ? '#53392D' : '#F2DED1',
    shadow: dark ? '#1E1814' : '#7A6650',
    darkBg: COLORS.darkBg,
    dark,
  };
  return {
    colors,
    serif: Platform.OS === 'android' ? 'serif' : 'Georgia',
    sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
    cardShadow: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: dark ? 0.2 : 0.09,
      shadowRadius: 14,
      elevation: 3,
    },
  };
}

const fallback = buildTheme('light');
const ThemeContext = createContext<AppTheme>(fallback);

export function ThemeProvider({ value, children }: { value: AppTheme; children: React.ReactNode }) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
