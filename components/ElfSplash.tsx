import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

const ELF_ART = require('../assets/images/elf-sleeping.webp');
const ART_RATIO = 1000 / 1071;
const PHRASES = [
  'Собираем твои планы…',
  'Наводим порядок в лесу…',
  'Эльфийка готовит всё к новому дню…',
  'Раскладываем дела по полочкам…',
  'Проверяем, какие планы ждут впереди…',
];
const PHRASE_INTERVAL = 3500;
const ENTER_DURATION = 1000;
const EXIT_DURATION = 450;
const SPIN_DURATION = 1800;
const SPIN_DURATION_REDUCED = 3200;
const FIXED_BLOCK_HEIGHT = 330;
const RING_SIZE = 44;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const COLORS = {
  paper: '#F8F3E9',
  paperDeep: '#F2E9D9',
  paperGlow: '#E8D5A7',
  forest: '#596B50',
  fox: '#C76B32',
  gold: '#D5AD59',
  track: '#E8DCC4',
  text: '#766D5E',
};

type Props = {
  ready: boolean;
  onDone: () => void;
  topInset: number;
  bottomInset: number;
};

export default function ElfSplash({ ready, onDone, topInset, bottomInset }: Props) {
  const { width, height } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(() => Math.floor(Math.random() * PHRASES.length));
  const [enter] = useState(() => new Animated.Value(0));
  const [spin] = useState(() => new Animated.Value(0));
  const [phraseOpacity] = useState(() => new Animated.Value(1));
  const [exit] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      enter.setValue(1);
      return;
    }
    const animation = Animated.timing(enter, { toValue: 1, duration: ENTER_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [enter, reduceMotion]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: reduceMotion ? SPIN_DURATION_REDUCED : SPIN_DURATION, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, spin]);

  useEffect(() => {
    if (ready) return;
    const timer = setInterval(() => {
      Animated.timing(phraseOpacity, { toValue: 0, duration: reduceMotion ? 0 : 220, useNativeDriver: true }).start(({ finished }) => {
        if (!finished) return;
        setPhraseIndex((index) => (index + 1) % PHRASES.length);
        Animated.timing(phraseOpacity, { toValue: 1, duration: reduceMotion ? 0 : 320, useNativeDriver: true }).start();
      });
    }, PHRASE_INTERVAL);
    return () => clearInterval(timer);
  }, [phraseOpacity, ready, reduceMotion]);

  useEffect(() => {
    if (!ready) return;
    const animation = Animated.timing(exit, { toValue: 0, duration: reduceMotion ? 0 : EXIT_DURATION, easing: Easing.out(Easing.quad), useNativeDriver: true });
    animation.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => animation.stop();
  }, [exit, onDone, ready, reduceMotion]);

  const artHeight = Math.max(150, Math.min(height * 0.44, height - topInset - bottomInset - FIXED_BLOCK_HEIGHT));
  const artWidth = Math.min(width * 0.72, 440, artHeight * ART_RATIO);
  const titleSize = Math.min(38, Math.max(32, width * 0.095));
  const brandSize = Math.min(52, Math.max(44, width * 0.13));
  const lift = enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View pointerEvents={ready ? 'none' : 'auto'} style={[styles.root, { opacity: exit, paddingTop: topInset + 20, paddingBottom: bottomInset + 18 }]}>
      <Backdrop />
      <Animated.View style={[styles.header, { opacity: enter, transform: [{ translateY: lift }] }]}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.2} style={[styles.titleFirst, { fontSize: titleSize, lineHeight: titleSize * 1.15 }]}>
          Планировщик
        </Text>
        <Text maxFontSizeMultiplier={1.2} style={[styles.titleSecond, { fontSize: brandSize, lineHeight: brandSize * 1.12 }]}>
          Рыжий Эльф
        </Text>
        <Divider width={168} />
      </Animated.View>
      <View style={styles.center}>
        <Animated.View style={{ opacity: enter }}>
          <Image
            source={ELF_ART}
            style={{ width: artWidth, height: artWidth / ART_RATIO }}
            contentFit="contain"
            transition={300}
            accessibilityLabel="Спящая рыжеволосая эльфийка с лисёнком"
          />
        </Animated.View>
        <View accessibilityRole="progressbar" accessibilityLabel="Загрузка" style={styles.ring}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotation }] }]}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke={COLORS.track} strokeWidth={RING_STROKE} fill="none" />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={COLORS.gold}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={[RING_LENGTH * 0.28, RING_LENGTH]}
                fill="none"
              />
            </Svg>
          </Animated.View>
        </View>
        <Animated.Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.2} style={[styles.phrase, { opacity: phraseOpacity }]}>
          {PHRASES[phraseIndex]}
        </Animated.Text>
      </View>
      <Divider width={96} />
    </Animated.View>
  );
}

function Backdrop() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="washGlow">
          <Stop offset="0" stopColor={COLORS.paperGlow} stopOpacity="0.3" />
          <Stop offset="1" stopColor={COLORS.paperGlow} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="washDeep">
          <Stop offset="0" stopColor={COLORS.paperDeep} stopOpacity="0.8" />
          <Stop offset="1" stopColor={COLORS.paperDeep} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={0} cy={0} r={60} fill="url(#washGlow)" />
      <Circle cx={100} cy={100} r={70} fill="url(#washDeep)" />
    </Svg>
  );
}

function Divider({ width }: { width: number }) {
  const mid = width / 2;
  return (
    <Svg width={width} height={16} viewBox={`0 0 ${width} 16`} style={styles.divider}>
      <Path d={`M0 8 H${mid - 16} M${mid + 16} 8 H${width}`} stroke={COLORS.gold} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      <Path d={`M${mid} 2.5 C${mid + 5} 5.5 ${mid + 5.5} 10.5 ${mid} 13.5 C${mid - 5.5} 10.5 ${mid - 5} 5.5 ${mid} 2.5 Z`} fill={COLORS.gold} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
    elevation: 50,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  header: { alignItems: 'center', width: '100%' },
  titleFirst: { fontFamily: 'CormorantGaramond_600SemiBold', color: COLORS.forest, textAlign: 'center' },
  titleSecond: { fontFamily: 'CormorantGaramond_600SemiBold', color: COLORS.fox, textAlign: 'center' },
  divider: { marginTop: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  ring: { width: RING_SIZE, height: RING_SIZE, marginTop: 18 },
  phrase: {
    minHeight: 52,
    maxWidth: 300,
    marginTop: 14,
    fontFamily: 'Manrope_500Medium',
    fontSize: 18,
    lineHeight: 26,
    color: COLORS.text,
    textAlign: 'center',
  },
});
