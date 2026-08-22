import { useTranslation } from "react-i18next";
import { ListItem, ScrollView, Separator, Text, YStack } from "tamagui";

import type { ActionEvent, Player } from "@/src/db/schema";
import { getOutcomeLabelKey, type ActionType } from "@/src/domain/outcomes";

import { IMPACT_COLOR } from "./impactColors";

interface RecentEventsPanelProps {
  /** Most-recent-first. */
  events: ActionEvent[];
  players: Player[];
  onSelectEvent: (event: ActionEvent) => void;
}

export function RecentEventsPanel({ events, players, onSelectEvent }: RecentEventsPanelProps) {
  const { t } = useTranslation();

  return (
    <YStack flex={1}>
      <Text color="$color10" padding="$3">
        {t("recording.recentEvents")}
      </Text>
      {events.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
          <Text color="$color8">{t("recording.noEvents")}</Text>
        </YStack>
      ) : (
        <ScrollView flex={1}>
          {events.map((event, index) => {
            const player = players.find((p) => p.id === event.playerId);
            const actionType = event.actionType as ActionType;
            return (
              <YStack key={event.id}>
                {index > 0 ? <Separator /> : null}
                <ListItem
                  onPress={() => onSelectEvent(event)}
                  title={
                    player
                      ? player.number != null
                        ? `#${player.number} ${player.name}`
                        : player.name
                      : t(`actions.${actionType}`)
                  }
                  subTitle={
                    player
                      ? `${t(`actions.${actionType}`)} · ${t(getOutcomeLabelKey(actionType, event.outcomeCode))}`
                      : t(getOutcomeLabelKey(actionType, event.outcomeCode))
                  }
                  iconAfter={
                    <Text color={IMPACT_COLOR[event.pointImpact as keyof typeof IMPACT_COLOR]} fontWeight="700">
                      {event.ourScoreAfter}–{event.opponentScoreAfter}
                    </Text>
                  }
                />
              </YStack>
            );
          })}
        </ScrollView>
      )}
    </YStack>
  );
}
