import { useTranslation } from "react-i18next";
import { Text, XStack, YStack } from "tamagui";

import { ActionTypeRow } from "@/src/components/recording/ActionTypeRow";
import { OutcomePicker } from "@/src/components/recording/OutcomePicker";
import { PlayerGrid } from "@/src/components/recording/PlayerGrid";

import type { RecordingLayoutProps } from "./types";

/** Phone/tablet landscape: players, actions, and outcomes all visible at once — width allows it, so no accordion collapsing is needed. */
export function ThreeColumnLayout({
  players,
  recentPlayerId,
  selectedPlayer,
  selectedActionType,
  onSelectPlayer,
  onSelectAction,
  onSelectOutcome,
}: RecordingLayoutProps) {
  const { t } = useTranslation();

  return (
    <XStack flex={1}>
      <YStack flex={1} borderRightWidth={1} borderColor="$borderColor">
        <PlayerGrid players={players} recentPlayerId={recentPlayerId} onSelect={onSelectPlayer} />
      </YStack>

      <YStack flex={1} borderRightWidth={1} borderColor="$borderColor">
        {selectedPlayer ? (
          <ActionTypeRow onSelect={onSelectAction} />
        ) : (
          <ColumnPlaceholder text={t("recording.selectPlayer")} />
        )}
      </YStack>

      <YStack flex={1}>
        {selectedPlayer && selectedActionType ? (
          <OutcomePicker actionType={selectedActionType} onSelect={onSelectOutcome} />
        ) : (
          <ColumnPlaceholder text={t("recording.selectAction")} />
        )}
      </YStack>
    </XStack>
  );
}

function ColumnPlaceholder({ text }: { text: string }) {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
      <Text color="$color8" textAlign="center">
        {text}
      </Text>
    </YStack>
  );
}
