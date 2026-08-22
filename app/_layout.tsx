import 'react-native-get-random-values';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { PortalProvider, TamaguiProvider } from 'tamagui';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { MigrationGate } from '@/src/db/MigrationGate';
import { useSettingsStore } from '@/src/state/settingsStore';
import tamaguiConfig from '@/src/theme/tamagui.config';
import i18n, { getDeviceLanguage } from '@/src/i18n';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const deviceColorScheme = useColorScheme();
  const themePreference = useSettingsStore((s) => s.themePreference);
  const languagePreference = useSettingsStore((s) => s.languagePreference);
  const effectiveColorScheme = themePreference === 'system' ? deviceColorScheme : themePreference;

  useEffect(() => {
    const language = languagePreference === 'system' ? getDeviceLanguage() : languagePreference;
    void i18n.changeLanguage(language);
  }, [languagePreference]);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={effectiveColorScheme ?? 'light'}>
      <PortalProvider shouldAddRootHost>
        <ThemeProvider value={effectiveColorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <MigrationGate>
            <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </MigrationGate>
        </ThemeProvider>
      </PortalProvider>
    </TamaguiProvider>
  );
}
