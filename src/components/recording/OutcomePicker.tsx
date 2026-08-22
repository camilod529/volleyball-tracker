import { useTranslation } from "react-i18next";
import { Button, Text, XStack, YStack } from "tamagui";

import { ACTION_OUTCOMES, type ActionType } from "@/src/domain/outcomes";

interface OutcomePickerProps {
  actionType: ActionType;
  onSelect: (outcomeCode: string) => void;
}

const IMPACT_COLOR: Record<string, string> = {
  our_point: "$green8",
  opponent_point: "$red8",
  neutral: "$gray5",
};

export function OutcomePicker({ actionType, onSelect }: OutcomePickerProps) {
  const { t } = useTranslation();
  const outcomes = ACTION_OUTCOMES[actionType];

  return (
    <YStack gap="$3" padding="$3" flex={1}>
      <Text color="$color10">{t("recording.selectOutcome")}</Text>
      <XStack flexWrap="wrap" gap="$2">
        {outcomes.map((outcome) => (
          <Button
            key={outcome.code}
            size="$5"
            minWidth="45%"
            flexGrow={1}
            backgroundColor={IMPACT_COLOR[outcome.pointImpact]}
            onPress={() => onSelect(outcome.code)}
          >
            {t(outcome.labelKey)}
          </Button>
        ))}
      </XStack>
    </YStack>
  );
}
