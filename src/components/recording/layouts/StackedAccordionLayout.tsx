import { useTranslation } from "react-i18next";
import { Button, XStack, YStack } from "tamagui";

import { ActionTypeRow } from "@/src/components/recording/ActionTypeRow";
import { OutcomePicker } from "@/src/components/recording/OutcomePicker";
import { PlayerGrid } from "@/src/components/recording/PlayerGrid";
import { SelectedPlayerBanner } from "@/src/components/recording/SelectedPlayerBanner";

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
      <SelectedPlayerBanner player={selectedPlayer} onChangePlayer={onResetPlayer} />

      {!selectedActionType ? (
        <ActionTypeRow onSelect={onSelectAction} />
      ) : (
        <YStack flex={1}>
          <XStack paddingHorizontal="$3" paddingTop="$2" alignItems="center" gap="$2">
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
