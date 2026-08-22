import { useTranslation } from "react-i18next";
import { ScrollView, Text, XStack, YStack } from "tamagui";

import { ActionTypeRow } from "@/src/components/recording/ActionTypeRow";
import { OutcomePicker } from "@/src/components/recording/OutcomePicker";
import { PlayerGrid } from "@/src/components/recording/PlayerGrid";

import type { RecordingLayoutProps } from "./types";

/** Tablet portrait: player grid on the left (fixed roster order — see the roster screen's reorder buttons), action + outcome stacked on the right — no accordion, both stay mounted once a player is selected. */
export function TwoColumnLayout({
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
      <ScrollView flex={1} borderRightWidth={1} borderColor="$borderColor">
        <PlayerGrid players={players} recentPlayerId={recentPlayerId} onSelect={onSelectPlayer} columns={2} />
      </ScrollView>

      <YStack flex={1}>
        {selectedPlayer ? (
          <>
            <YStack borderBottomWidth={1} borderColor="$borderColor">
              <ActionTypeRow onSelect={onSelectAction} />
            </YStack>
            <YStack flex={1}>
              {selectedActionType ? (
                <OutcomePicker actionType={selectedActionType} onSelect={onSelectOutcome} />
              ) : (
                <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
                  <Text color="$color8" textAlign="center">
                    {t("recording.selectAction")}
                  </Text>
                </YStack>
              )}
            </YStack>
          </>
        ) : (
          <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
            <Text color="$color8" textAlign="center">
              {t("recording.selectPlayer")}
            </Text>
          </YStack>
        )}
      </YStack>
    </XStack>
  );
}
