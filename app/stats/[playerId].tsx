import { and, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, Spinner, Text, YStack } from "tamagui";

import { PlayerStatsSummary } from "@/src/components/stats/PlayerStatsSummary";
import { db } from "@/src/db/client";
import { actionEvents, players } from "@/src/db/schema";
import { computePlayerStats, toStatsEvent } from "@/src/domain/stats";

export default function PlayerSeasonStatsScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const { t } = useTranslation();

  const { data: playerRows } = useLiveQuery(db.select().from(players).where(eq(players.id, playerId)));
  const player = playerRows[0];

  // Scoped by teamId (not matchId), so this rolls up every match the team has played.
  const { data: events } = useLiveQuery(
    db
      .select()
      .from(actionEvents)
      .where(and(eq(actionEvents.teamId, player?.teamId ?? ""), eq(actionEvents.isDeleted, false))),
    [player?.teamId]
  );

  if (!player) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner />
      </YStack>
    );
  }

  const statsEvents = events.map(toStatsEvent);
  const stats = computePlayerStats(statsEvents, playerId);

  return (
    <ScrollView>
      <Stack.Screen
        options={{ title: player.number != null ? `#${player.number} ${player.name}` : player.name }}
      />
      <YStack padding="$4" gap="$3">
        <Text fontWeight="700" fontSize="$6">
          {t("stats.seasonStats")}
        </Text>
        <PlayerStatsSummary stats={stats} />
      </YStack>
    </ScrollView>
  );
}
