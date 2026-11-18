import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PlannerApp from './components/PlannerApp';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ ...Ionicons.font, CormorantGaramond_600SemiBold, Manrope_500Medium });
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return <View style={styles.blank} />;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PlannerApp />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6EFE0' },
  blank: { flex: 1, backgroundColor: '#F8F3E9' },
});
