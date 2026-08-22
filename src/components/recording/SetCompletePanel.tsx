import { useTranslation } from "react-i18next";
import { Button, H2, Text, YStack } from "tamagui";

interface SetCompletePanelProps {
  setNumber: number;
  ourScore: number;
  opponentScore: number;
  winner: "us" | "opponent";
  isMatchComplete: boolean;
  onContinue: () => void;
  submitting: boolean;
}

export function SetCompletePanel({
  setNumber,
  ourScore,
  opponentScore,
  winner,
  isMatchComplete,
  onContinue,
  submitting,
}: SetCompletePanelProps) {
  const { t } = useTranslation();

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$4" padding="$6">
      <H2>{t("recording.setComplete", { number: setNumber })}</H2>
      <Text fontSize="$8" fontWeight="700">
        {ourScore} – {opponentScore}
      </Text>
      <Text color="$color10">{t(winner === "us" ? "recording.weWonSet" : "recording.theyWonSet")}</Text>
      <Button
        theme="active"
        size="$5"
        disabled={submitting}
        opacity={submitting ? 0.5 : 1}
        onPress={onContinue}
      >
        {isMatchComplete ? t("recording.goToSummary") : t("recording.startNextSet", { number: setNumber + 1 })}
      </Button>
    </YStack>
  );
}
