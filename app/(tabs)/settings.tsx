import { useTranslation } from 'react-i18next';
import { Label, ScrollView, Text, XStack, YStack } from 'tamagui';

import { CloudSyncSection } from '@/src/components/settings/CloudSyncSection';
import { SelectableChip } from '@/src/components/shared/SelectableChip';
import {
  useSettingsStore,
  type LanguagePreference,
  type ThemePreference,
} from '@/src/state/settingsStore';

const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];
const LANGUAGE_OPTIONS: LanguagePreference[] = ['system', 'en', 'es'];

const THEME_LABEL_KEY: Record<ThemePreference, string> = {
  system: 'settings.themeSystem',
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
};

const LANGUAGE_LABEL_KEY: Record<LanguagePreference, string> = {
  system: 'settings.languageSystem',
  en: 'settings.languageEnglish',
  es: 'settings.languageSpanish',
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const themePreference = useSettingsStore((s) => s.themePreference);
  const languagePreference = useSettingsStore((s) => s.languagePreference);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);
  const setLanguagePreference = useSettingsStore((s) => s.setLanguagePreference);

  return (
    <ScrollView>
      <YStack padding="$4" gap="$5">
        <YStack gap="$2">
          <Label>{t('settings.appearance')}</Label>
          <XStack gap="$2">
            {THEME_OPTIONS.map((option) => (
              <SelectableChip
                key={option}
                flex={1}
                selected={option === themePreference}
                onPress={() => setThemePreference(option)}
              >
                {t(THEME_LABEL_KEY[option])}
              </SelectableChip>
            ))}
          </XStack>
        </YStack>

        <YStack gap="$2">
          <Label>{t('settings.language')}</Label>
          <XStack gap="$2">
            {LANGUAGE_OPTIONS.map((option) => (
              <SelectableChip
                key={option}
                flex={1}
                selected={option === languagePreference}
                onPress={() => setLanguagePreference(option)}
              >
                {t(LANGUAGE_LABEL_KEY[option])}
              </SelectableChip>
            ))}
          </XStack>
        </YStack>

        <CloudSyncSection />

        <YStack gap="$2">
          <Label>{t('settings.about')}</Label>
          <Text color="$color10">{t('settings.aboutBody')}</Text>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
