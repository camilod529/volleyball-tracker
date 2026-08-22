import { and, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, Spinner, YStack } from "tamagui";

import { PlayerStatsSummary } from "@/src/components/stats/PlayerStatsSummary";
import { db } from "@/src/db/client";
import { actionEvents, players } from "@/src/db/schema";
import { computePlayerStats, toStatsEvent } from "@/src/domain/stats";

export default function PlayerMatchStatsScreen() {
  const { matchId, playerId } = useLocalSearchParams<{ matchId: string; playerId: string }>();

  const { data: playerRows } = useLiveQuery(db.select().from(players).where(eq(players.id, playerId)));
  const player = playerRows[0];

  const { data: events } = useLiveQuery(
    db
      .select()
      .from(actionEvents)
      .where(and(eq(actionEvents.matchId, matchId), eq(actionEvents.isDeleted, false)))
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
      <YStack padding="$4">
        <PlayerStatsSummary stats={stats} />
      </YStack>
    </ScrollView>
  );
}
