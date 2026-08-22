import { and, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ListItem, ScrollView, Separator, Text, XStack, YStack } from "tamagui";

import { db } from "@/src/db/client";
import { actionEvents, players, teams } from "@/src/db/schema";
import { computeHowWeLostPoints, computeHowWeScored, toStatsEvent } from "@/src/domain/stats";
import { useActiveTeamStore } from "@/src/state/activeTeamStore";

export default function StatsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: teamRows } = useLiveQuery(db.select().from(teams).where(eq(teams.isDeleted, false)));
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);

  // Viewing a different team's stats here doesn't change which team is
  // "active" for recording matches — that stays Teams tab's job.
  const [explicitTeamId, setExplicitTeamId] = useState<string | null>(null);
  const defaultTeamId =
    activeTeamId && teamRows.some((team) => team.id === activeTeamId) ? activeTeamId : (teamRows[0]?.id ?? null);
  const selectedTeamId = explicitTeamId ?? defaultTeamId;

  const { data: rosterRows } = useLiveQuery(
    db
      .select()
      .from(players)
      .where(and(eq(players.teamId, selectedTeamId ?? ""), eq(players.isDeleted, false))),
    [selectedTeamId]
  );

  const { data: teamEvents } = useLiveQuery(
    db
      .select()
      .from(actionEvents)
      .where(and(eq(actionEvents.teamId, selectedTeamId ?? ""), eq(actionEvents.isDeleted, false))),
    [selectedTeamId]
  );

  if (teamRows.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text color="$color10">{t("stats.noTeams")}</Text>
      </YStack>
    );
  }

  const statsEvents = teamEvents.map(toStatsEvent);
  const scored = computeHowWeScored(statsEvents);
  const lost = computeHowWeLostPoints(statsEvents);

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <XStack flexWrap="wrap" gap="$2">
          {teamRows.map((team) => (
            <Button
              key={team.id}
              size="$3"
              theme={team.id === selectedTeamId ? "active" : undefined}
              onPress={() => setExplicitTeamId(team.id)}
            >
              {team.name}
            </Button>
          ))}
        </XStack>

        <YStack gap="$2" padding="$3" borderRadius="$4" backgroundColor="$color2">
          <Text fontWeight="700">{t("stats.howWeScored")}</Text>
          <Row label={t("actions.serve")} value={scored.aces} />
          <Row label={t("actions.attack")} value={scored.kills} />
          <Row label={t("actions.block")} value={scored.blocks} />
          <Row label={t("stats.other")} value={scored.other} />
        </YStack>

        <YStack gap="$2" padding="$3" borderRadius="$4" backgroundColor="$color2">
          <Text fontWeight="700">{t("stats.howWeLostPoints")}</Text>
          {Object.entries(lost.byAction).map(([actionType, count]) => (
            <Row key={actionType} label={t(`actions.${actionType}`)} value={count} />
          ))}
        </YStack>

        <YStack gap="$2">
          <Text fontWeight="700">{t("stats.seasonStats")}</Text>
          <YStack borderRadius="$4" overflow="hidden">
            {rosterRows.map((player, index) => (
              <YStack key={player.id}>
                {index > 0 ? <Separator /> : null}
                <ListItem
                  title={player.number != null ? `#${player.number} ${player.name}` : player.name}
                  subTitle={t(`positions.${player.position}`)}
                  onPress={() => router.push({ pathname: "/stats/[playerId]", params: { playerId: player.id } })}
                />
              </YStack>
            ))}
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <XStack justifyContent="space-between">
      <Text color="$color10">{label}</Text>
      <Text fontWeight="600">{value}</Text>
    </XStack>
  );
}
