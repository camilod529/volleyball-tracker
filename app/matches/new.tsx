import { and, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, Label, ScrollView, Text, XStack, YStack } from "tamagui";

import { db } from "@/src/db/client";
import { players, teams } from "@/src/db/schema";
import type { MatchFormat } from "@/src/domain/scoring";
import { matchRepository, setRepository } from "@/src/repositories";
import { useActiveTeamStore } from "@/src/state/activeTeamStore";

export default function NewMatchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { teamId: preselectedTeamId } = useLocalSearchParams<{ teamId?: string }>();

  const { data: teamRows } = useLiveQuery(db.select().from(teams).where(eq(teams.isDeleted, false)));
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);

  // Defaults to a team passed in via the route (e.g. "Start Match" from a
  // roster screen), else the active team, else the first team — until the
  // user explicitly taps a different one. Computed at render time rather
  // than in an effect.
  const [explicitTeamId, setExplicitTeamId] = useState<string | null>(null);
  const defaultTeamId =
    (preselectedTeamId && teamRows.some((team) => team.id === preselectedTeamId)
      ? preselectedTeamId
      : null) ??
    (activeTeamId && teamRows.some((team) => team.id === activeTeamId) ? activeTeamId : null) ??
    (teamRows[0]?.id ?? null);
  const selectedTeamId = explicitTeamId ?? defaultTeamId;

  const { data: activePlayers } = useLiveQuery(
    db
      .select()
      .from(players)
      .where(
        and(
          eq(players.teamId, selectedTeamId ?? ""),
          eq(players.isActive, true),
          eq(players.isDeleted, false)
        )
      ),
    [selectedTeamId]
  );

  const [opponentName, setOpponentName] = useState("");
  const [format, setFormat] = useState<MatchFormat>("best_of_3");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = Boolean(selectedTeamId) && opponentName.trim().length > 0 && activePlayers.length > 0;

  async function handleStartMatch() {
    if (!selectedTeamId || !canSubmit) return;
    setSubmitting(true);
    try {
      const match = await matchRepository.create({
        teamId: selectedTeamId,
        opponentName: opponentName.trim(),
        matchDate: new Date().toISOString().slice(0, 10),
        location: null,
        format,
        notes: null,
      });
      await matchRepository.update(match.id, { status: "in_progress" });
      await setRepository.create({ matchId: match.id, setNumber: 1 });
      router.replace({ pathname: "/matches/[matchId]/live", params: { matchId: match.id } });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView>
      <Stack.Screen options={{ title: t("matches.newMatch") }} />
      <YStack gap="$4" padding="$4">
        <YStack gap="$2">
          <Label>{t("matches.selectTeam")}</Label>
          {teamRows.length === 0 ? (
            <Text color="$color10">{t("matches.noActiveTeam")}</Text>
          ) : (
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
          )}
        </YStack>

        {selectedTeamId && activePlayers.length === 0 ? (
          <Text color="$red10">{t("matches.noPlayersWarning")}</Text>
        ) : null}

        <YStack gap="$2">
          <Label htmlFor="opponent-name">{t("matches.opponentName")}</Label>
          <Input
            id="opponent-name"
            value={opponentName}
            onChangeText={setOpponentName}
            autoFocus
          />
        </YStack>

        <YStack gap="$2">
          <Label>{t("matches.format")}</Label>
          <XStack gap="$2">
            <Button
              flex={1}
              theme={format === "best_of_3" ? "active" : undefined}
              onPress={() => setFormat("best_of_3")}
            >
              {t("matches.bestOf3")}
            </Button>
            <Button
              flex={1}
              theme={format === "best_of_5" ? "active" : undefined}
              onPress={() => setFormat("best_of_5")}
            >
              {t("matches.bestOf5")}
            </Button>
          </XStack>
        </YStack>

        <Button
          theme="active"
          size="$5"
          disabled={!canSubmit || submitting}
          opacity={canSubmit && !submitting ? 1 : 0.5}
          onPress={handleStartMatch}
        >
          {t("matches.startMatch")}
        </Button>
      </YStack>
    </ScrollView>
  );
}
