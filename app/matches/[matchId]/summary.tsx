import { and, asc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import {
  Button,
  H2,
  ListItem,
  ScrollView,
  Separator,
  Spinner,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { Ionicons } from "@expo/vector-icons";

import { db } from "@/src/db/client";
import { actionEvents, matches, players, sets } from "@/src/db/schema";
import { getMatchWinner } from "@/src/domain/scoring";
import { computeHowWeLostPoints, computeHowWeScored, toStatsEvent } from "@/src/domain/stats";

export default function MatchSummaryScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: matchRows } = useLiveQuery(db.select().from(matches).where(eq(matches.id, matchId)));
  const match = matchRows[0];

  const { data: setRows } = useLiveQuery(
    db.select().from(sets).where(eq(sets.matchId, matchId)).orderBy(asc(sets.setNumber))
  );

  const { data: matchEvents } = useLiveQuery(
    db
      .select()
      .from(actionEvents)
      .where(and(eq(actionEvents.matchId, matchId), eq(actionEvents.isDeleted, false)))
  );

  const { data: rosterRows } = useLiveQuery(
    db.select().from(players).where(and(eq(players.teamId, match?.teamId ?? ""), eq(players.isDeleted, false))),
    [match?.teamId]
  );

  if (!match) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner />
      </YStack>
    );
  }

  const completedSets = setRows.filter((s) => s.status === "completed");
  const setWins = {
    us: completedSets.filter((s) => s.winner === "us").length,
    opponent: completedSets.filter((s) => s.winner === "opponent").length,
  };
  const matchWinner =
    match.status === "completed"
      ? getMatchWinner(setWins, match.format as "best_of_3" | "best_of_5")
      : null;

  const statsEvents = matchEvents.map(toStatsEvent);
  const scored = computeHowWeScored(statsEvents);
  const lost = computeHowWeLostPoints(statsEvents);

  return (
    <ScrollView>
      <Stack.Screen
        options={{
          title: t("matches.summaryTitle"),
          headerRight: () => (
            <Pressable
              onPress={() => router.push({ pathname: "/matches/[matchId]/export", params: { matchId } })}
              hitSlop={12}
            >
              <Ionicons name="share-outline" size={22} />
            </Pressable>
          ),
        }}
      />
      <YStack gap="$4" padding="$4">
        <YStack gap="$1">
          <H2>{t("matches.vs", { opponent: match.opponentName })}</H2>
          <Text color="$color10">
            {match.matchDate} · {t(match.format === "best_of_5" ? "matches.bestOf5" : "matches.bestOf3")}
          </Text>
        </YStack>

        {match.status !== "completed" ? (
          <YStack gap="$3" alignItems="flex-start">
            <Text color="$color10">{t("matches.matchInProgress")}</Text>
            <Button
              theme="active"
              onPress={() =>
                router.push({ pathname: "/matches/[matchId]/live", params: { matchId } })
              }
            >
              {t("matches.resumeMatch")}
            </Button>
          </YStack>
        ) : (
          <Text fontSize="$6" fontWeight="700">
            {t(matchWinner === "us" ? "matches.weWonMatch" : "matches.theyWonMatch")}
          </Text>
        )}

        <YStack gap="$2">
          <Text color="$color10">
            {t("matches.sets")} ({setWins.us}–{setWins.opponent})
          </Text>
          <YStack borderRadius="$4" overflow="hidden">
            {setRows.map((set, index) => (
              <YStack key={set.id}>
                {index > 0 ? <Separator /> : null}
                <XStack justifyContent="space-between" padding="$3">
                  <Text fontWeight={set.winner === "us" ? "700" : "400"}>
                    {t("recording.set", { number: set.setNumber })}
                  </Text>
                  <Text fontWeight={set.winner ? "700" : "400"}>
                    {set.ourScore} – {set.opponentScore}
                  </Text>
                </XStack>
              </YStack>
            ))}
          </YStack>
        </YStack>

        {scored.total > 0 && (
          <YStack gap="$2" padding="$3" borderRadius="$4" backgroundColor="$color2">
            <Text fontWeight="700">{t("stats.howWeScored")}</Text>
            <StatRow label={t("actions.serve")} value={scored.aces} />
            <StatRow label={t("actions.attack")} value={scored.kills} />
            <StatRow label={t("actions.block")} value={scored.blocks} />
            <StatRow label={t("stats.other")} value={scored.other} />
          </YStack>
        )}

        {lost.total > 0 && (
          <YStack gap="$2" padding="$3" borderRadius="$4" backgroundColor="$color2">
            <Text fontWeight="700">{t("stats.howWeLostPoints")}</Text>
            {Object.entries(lost.byAction).map(([actionType, count]) => (
              <StatRow key={actionType} label={t(`actions.${actionType}`)} value={count} />
            ))}
          </YStack>
        )}

        {rosterRows.length > 0 && (
          <YStack gap="$2">
            <Text color="$color10">{t("stats.matchStats")}</Text>
            <YStack borderRadius="$4" overflow="hidden">
              {rosterRows.map((player, index) => (
                <YStack key={player.id}>
                  {index > 0 ? <Separator /> : null}
                  <ListItem
                    title={player.number != null ? `#${player.number} ${player.name}` : player.name}
                    onPress={() =>
                      router.push({
                        pathname: "/matches/[matchId]/players/[playerId]",
                        params: { matchId, playerId: player.id },
                      })
                    }
                  />
                </YStack>
              ))}
            </YStack>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <XStack justifyContent="space-between">
      <Text color="$color10">{label}</Text>
      <Text fontWeight="600">{value}</Text>
    </XStack>
  );
}
