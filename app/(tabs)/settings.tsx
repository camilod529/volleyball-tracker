import { useTranslation } from 'react-i18next';
import { H2, YStack } from 'tamagui';

export default function SettingsScreen() {
  const { t } = useTranslation();

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$2">
      <H2>{t('tabs.settings')}</H2>
    </YStack>
  );
}
