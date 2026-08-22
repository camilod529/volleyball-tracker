import { useTranslation } from "react-i18next";
import { Button, Text, XStack, YStack } from "tamagui";

import { ActionTypeRow } from "@/src/components/recording/ActionTypeRow";
import { OutcomePicker } from "@/src/components/recording/OutcomePicker";
import { PlayerGrid } from "@/src/components/recording/PlayerGrid";

import type { RecordingLayoutProps } from "./types";

/** Phone portrait: one step visible at a time, each prior step collapsed to a tappable chip. */
export function StackedAccordionLayout({
  players,
  recentPlayerId,
  selectedPlayer,
  selectedActionType,
  onSelectPlayer,
  onSelectAction,
  onSelectOutcome,
  onResetPlayer,
  onClearAction,
}: RecordingLayoutProps) {
  const { t } = useTranslation();

  if (!selectedPlayer) {
    return <PlayerGrid players={players} recentPlayerId={recentPlayerId} onSelect={onSelectPlayer} />;
  }

  return (
    <YStack flex={1}>
      <XStack padding="$3" alignItems="center" gap="$2">
        <Button size="$2" chromeless onPress={onResetPlayer}>
          {selectedPlayer.number != null ? `#${selectedPlayer.number} ` : ""}
          {selectedPlayer.name}
        </Button>
        <Text color="$color10">›</Text>
      </XStack>

      {!selectedActionType ? (
        <ActionTypeRow onSelect={onSelectAction} />
      ) : (
        <YStack flex={1}>
          <XStack paddingHorizontal="$3" alignItems="center" gap="$2">
            <Button size="$2" chromeless onPress={onClearAction}>
              {t(`actions.${selectedActionType}`)}
            </Button>
          </XStack>
          <OutcomePicker actionType={selectedActionType} onSelect={onSelectOutcome} />
        </YStack>
      )}
    </YStack>
  );
}
