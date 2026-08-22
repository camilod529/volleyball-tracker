import { useTranslation } from "react-i18next";
import { Button, Text, XStack, YStack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";

import { ACTION_OUTCOMES, type ActionType } from "@/src/domain/outcomes";

import { IMPACT_COLOR, IMPACT_ICON } from "./impactColors";

interface OutcomePickerProps {
  actionType: ActionType;
  onSelect: (outcomeCode: string) => void;
}

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
            icon={<Ionicons name={IMPACT_ICON[outcome.pointImpact]} size={18} />}
            onPress={() => onSelect(outcome.code)}
          >
            {t(outcome.labelKey)}
          </Button>
        ))}
      </XStack>
    </YStack>
  );
}
