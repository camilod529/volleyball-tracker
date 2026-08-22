import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Button, H1, Text, XStack, YStack } from "tamagui";

interface ScoreboardProps {
  setNumber: number;
  ourScore: number;
  opponentScore: number;
  opponentName: string;
  canUndo: boolean;
  onUndoLast: () => void;
  onPlusUs: () => void;
  onPlusOpponent: () => void;
  /** Omit to hide the History button (e.g. tablet landscape, where Recent Events is an always-visible column instead). */
  onOpenHistory?: () => void;
  /** True once the set has a winner — the score is locked pending finalization, so +1/-1 adjustments are blocked (Undo Last stays available to fix a wrong call). */
  setDecided?: boolean;
}

export function Scoreboard({
  setNumber,
  ourScore,
  opponentScore,
  opponentName,
  canUndo,
  onUndoLast,
  onPlusUs,
  onPlusOpponent,
  onOpenHistory,
  setDecided,
}: ScoreboardProps) {
  const { t } = useTranslation();

  return (
    <YStack padding="$3" gap="$2" borderBottomWidth={1} borderBottomColor="$borderColor">
      <XStack justifyContent="space-between" alignItems="center">
        <XStack alignItems="center" gap="$2">
          <Text color="$color10">{t("recording.set", { number: setNumber })}</Text>
          {onOpenHistory ? (
            <Button
              size="$2"
              chromeless
              icon={<Ionicons name="time-outline" size={16} />}
              onPress={onOpenHistory}
            >
              {t("recording.history")}
            </Button>
          ) : null}
        </XStack>
        <Button
          size="$2"
          chromeless
          disabled={!canUndo}
          opacity={canUndo ? 1 : 0.4}
          icon={<Ionicons name="arrow-undo" size={16} />}
          onPress={onUndoLast}
        >
          {t("recording.undoLast")}
        </Button>
      </XStack>

      <XStack justifyContent="space-around" alignItems="center">
        <YStack alignItems="center" gap="$1">
          <Text color="$color10">{t("tabs.teams")}</Text>
          <H1>{ourScore}</H1>
        </YStack>
        <Text color="$color10">–</Text>
        <YStack alignItems="center" gap="$1">
          <Text color="$color10" numberOfLines={1}>
            {opponentName}
          </Text>
          <H1>{opponentScore}</H1>
        </YStack>
      </XStack>

      <XStack justifyContent="center" gap="$3">
        <Button size="$3" disabled={setDecided} opacity={setDecided ? 0.4 : 1} onPress={onPlusUs}>
          {t("recording.plusUs")}
        </Button>
        <Button size="$3" disabled={setDecided} opacity={setDecided ? 0.4 : 1} onPress={onPlusOpponent}>
          {t("recording.plusOpponent")}
        </Button>
      </XStack>
    </YStack>
  );
}
