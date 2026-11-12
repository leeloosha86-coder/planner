import React from 'react';
import { Image } from 'expo-image';

const PORTRAITS = [
  require('../assets/images/elf-level-1.png'),
  require('../assets/images/elf-level-2.png'),
  require('../assets/images/elf-level-3.png'),
  require('../assets/images/elf-level-4.png'),
  require('../assets/images/elf-level-5.png'),
];

export default function ElfPortrait({ level, size = 128 }: { level: number; size?: number }) {
  const stage = Math.max(0, Math.min(4, level));
  return (
    <Image
      source={PORTRAITS[stage]}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="contain"
      transition={180}
      accessibilityLabel={`Иллюстрация эльфийки, уровень ${stage + 1}`}
    />
  );
}
