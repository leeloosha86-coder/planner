import React, { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { GoldSpark } from './Decor';

const POINTS = [
  [-30, -28], [4, -40], [35, -22], [42, 10], [22, 34], [-14, 38], [-42, 18], [-8, -17],
];

export default function SparkBurst({ trigger }: { trigger: number }) {
  const [progress] = useState(() => new Animated.Value(0));
  const [visible, setVisible] = useState(false);
  const sparkles = useMemo(() => POINTS.map((point, index) => ({ point, size: index % 3 === 0 ? 14 : 9 })), []);

  useEffect(() => {
    if (!trigger) return;
    let animation: Animated.CompositeAnimation | undefined;
    const timer = setTimeout(() => {
      setVisible(true);
      progress.setValue(0);
      animation = Animated.timing(progress, { toValue: 1, duration: 600, useNativeDriver: true });
      animation.start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }, 0);
    return () => {
      clearTimeout(timer);
      animation?.stop();
    };
  }, [trigger, progress]);

  if (!visible) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.center}>
        {sparkles.map(({ point, size }, index) => {
          const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, point[0]] });
          const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, point[1]] });
          const opacity = progress.interpolate({ inputRange: [0, 0.18, 0.75, 1], outputRange: [0, 1, 0.85, 0] });
          const scale = progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1.15, 0.45] });
          return (
            <Animated.View key={index} style={[styles.spark, { opacity, transform: [{ translateX }, { translateY }, { scale }] }]}>
              <GoldSpark size={size} />
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', left: '50%', top: '50%', width: 1, height: 1 },
  spark: { position: 'absolute' },
});
