import 'react-native-get-random-values';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { PortalProvider, TamaguiProvider } from 'tamagui';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { MigrationGate } from '@/src/db/MigrationGate';
import { useConnectionStore } from '@/src/sync/connectionStore';
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
  // Theme preference loads from AsyncStorage asynchronously — rendering
  // before it resolves would briefly show the "system" default instead of
  // a saved light/dark override, flashing the wrong theme on cold start.
  const themeHasHydrated = useSettingsStore((s) => s.hasHydrated);
  const ready = loaded && themeHasHydrated;

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
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

  useEffect(() => {
    void useConnectionStore.getState().load();
  }, []);

  const navigationTheme = effectiveColorScheme === 'dark' ? DarkTheme : DefaultTheme;

  // contentStyle/headerStyle below only theme the React view tree — on
  // Android, the Activity/window itself has its own default background
  // (white) that's what actually shows through during a screen transition's
  // compositing, before any view has painted. This is the piece that
  // controls that.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(navigationTheme.colors.background);
  }, [navigationTheme.colors.background]);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={effectiveColorScheme ?? 'light'}>
      <PortalProvider shouldAddRootHost>
        <ThemeProvider value={navigationTheme}>
          <MigrationGate>
            <Stack
              screenOptions={{
                headerBackButtonDisplayMode: 'minimal',
                // Without this, react-native-screens gives each newly
                // pushed screen a native container that defaults to white
                // on Android until the JS content paints over it — visible
                // as a flash mid-transition in dark mode. Matching it to
                // the active navigation theme up front avoids that.
                contentStyle: { backgroundColor: navigationTheme.colors.background },
                // The header bar is a separate native element from the
                // screen body — content-only theming above doesn't cover
                // it, so it needs its own explicit colors too.
                headerStyle: { backgroundColor: navigationTheme.colors.card },
                headerTintColor: navigationTheme.colors.text,
                headerTitleStyle: { color: navigationTheme.colors.text },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </MigrationGate>
        </ThemeProvider>
      </PortalProvider>
    </TamaguiProvider>
  );
}
