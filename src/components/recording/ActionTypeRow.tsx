import { useTranslation } from "react-i18next";
import { Button, Text, XStack, YStack } from "tamagui";

import { RECORDABLE_ACTION_TYPES, type ActionType } from "@/src/domain/outcomes";

interface ActionTypeRowProps {
  onSelect: (actionType: ActionType) => void;
}

export function ActionTypeRow({ onSelect }: ActionTypeRowProps) {
  const { t } = useTranslation();

  return (
    <YStack gap="$3" padding="$3" flex={1}>
      <Text color="$color10">{t("recording.selectAction")}</Text>
      <XStack flexWrap="wrap" gap="$2">
        {RECORDABLE_ACTION_TYPES.map((actionType) => (
          <Button key={actionType} size="$5" minWidth="45%" flexGrow={1} onPress={() => onSelect(actionType)}>
            {t(`actions.${actionType}`)}
          </Button>
        ))}
      </XStack>
    </YStack>
  );
}
