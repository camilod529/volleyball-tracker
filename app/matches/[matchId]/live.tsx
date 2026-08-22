import { and, asc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Spinner, Text, XStack, YStack } from "tamagui";

import { ActionTypeRow } from "@/src/components/recording/ActionTypeRow";
import { OutcomePicker } from "@/src/components/recording/OutcomePicker";
import { PlayerGrid } from "@/src/components/recording/PlayerGrid";
import { Scoreboard } from "@/src/components/recording/Scoreboard";
import { SetCompletePanel } from "@/src/components/recording/SetCompletePanel";
import { db } from "@/src/db/client";
import { actionEvents, matches, players, sets } from "@/src/db/schema";
import {
  DECIDING_SET,
  getMatchWinner,
  getSetWinner,
  isDecidingSet,
  STANDARD_SET,
} from "@/src/domain/scoring";
import { actionEventRepository, matchRepository, setRepository } from "@/src/repositories";
import { useMatchSessionStore } from "@/src/state/matchSessionStore";

export default function LiveRecordingScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [finalizing, setFinalizing] = useState(false);

  const { data: matchRows } = useLiveQuery(db.select().from(matches).where(eq(matches.id, matchId)));
  const match = matchRows[0];

  const { data: allSets } = useLiveQuery(db.select().from(sets).where(eq(sets.matchId, matchId)));
  const currentSet = allSets.find((s) => s.status === "in_progress");

  const { data: activePlayers } = useLiveQuery(
    db
      .select()
      .from(players)
      .where(
        and(
          eq(players.teamId, match?.teamId ?? ""),
          eq(players.isActive, true),
          eq(players.isDeleted, false)
        )
      ),
    [match?.teamId]
  );

  const { data: events } = useLiveQuery(
    db
      .select()
      .from(actionEvents)
      .where(and(eq(actionEvents.setId, currentSet?.id ?? ""), eq(actionEvents.isDeleted, false)))
      .orderBy(asc(actionEvents.sequenceInSet)),
    [currentSet?.id]
  );

  const selectedPlayerId = useMatchSessionStore((s) => s.selectedPlayerId);
  const selectedActionType = useMatchSessionStore((s) => s.selectedActionType);
  const recentPlayerId = useMatchSessionStore((s) => s.recentPlayerId);
  const selectPlayer = useMatchSessionStore((s) => s.selectPlayer);
  const selectAction = useMatchSessionStore((s) => s.selectAction);
  const commit = useMatchSessionStore((s) => s.commit);
  const resetSelection = useMatchSessionStore((s) => s.reset);
  const clearAction = useMatchSessionStore((s) => s.clearAction);
  const hardReset = useMatchSessionStore((s) => s.hardReset);

  useEffect(() => {
    return () => hardReset();
  }, [matchId, hardReset]);

  useEffect(() => {
    if (match && allSets.length > 0 && !currentSet) {
      router.replace({ pathname: "/matches/[matchId]/summary", params: { matchId } });
    }
  }, [match, allSets.length, currentSet, matchId, router]);

  if (!match || !currentSet) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner />
      </YStack>
    );
  }

  const lastEvent = events[events.length - 1];
  const ourScore = lastEvent?.ourScoreAfter ?? 0;
  const opponentScore = lastEvent?.opponentScoreAfter ?? 0;
  const rallyNumber = 1 + events.filter((e) => e.pointImpact !== "neutral").length;
  const selectedPlayer = activePlayers.find((p) => p.id === selectedPlayerId);

  const format = match.format as "best_of_3" | "best_of_5";
  const winCondition = isDecidingSet(currentSet.setNumber, format) ? DECIDING_SET : STANDARD_SET;
  const setWinner = getSetWinner(ourScore, opponentScore, winCondition);

  const completedSets = allSets.filter((s) => s.status === "completed");
  const setWinsSoFar = {
    us: completedSets.filter((s) => s.winner === "us").length,
    opponent: completedSets.filter((s) => s.winner === "opponent").length,
  };
  const projectedSetWins = {
    us: setWinsSoFar.us + (setWinner === "us" ? 1 : 0),
    opponent: setWinsSoFar.opponent + (setWinner === "opponent" ? 1 : 0),
  };
  const wouldCompleteMatch = getMatchWinner(projectedSetWins, format) !== null;

  async function logEvent(actionType: string, outcomeCode: string, playerId: string | null) {
    await actionEventRepository.create({
      matchId,
      setId: currentSet!.id,
      teamId: match!.teamId,
      playerId,
      actionType: actionType as never,
      outcomeCode,
      rallyNumber,
      notes: null,
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function handleSelectOutcome(outcomeCode: string) {
    if (!selectedActionType || !selectedPlayerId) return;
    await logEvent(selectedActionType, outcomeCode, selectedPlayerId);
    commit(selectedPlayerId);
  }

  async function handlePlusUs() {
    await logEvent("team_point_adjustment", "manual_plus_us", null);
  }

  async function handlePlusOpponent() {
    await logEvent("team_point_adjustment", "manual_plus_opponent", null);
  }

  async function handleUndoLast() {
    if (!lastEvent) return;
    await actionEventRepository.softDelete(lastEvent.id);
  }

  async function handleFinalizeSet() {
    if (!setWinner) return;
    setFinalizing(true);
    try {
      await setRepository.update(currentSet!.id, {
        status: "completed",
        winner: setWinner,
        endedAt: new Date().toISOString(),
      });
      if (wouldCompleteMatch) {
        await matchRepository.update(matchId, { status: "completed" });
        router.replace({ pathname: "/matches/[matchId]/summary", params: { matchId } });
      } else {
        await setRepository.create({ matchId, setNumber: currentSet!.setNumber + 1 });
      }
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <YStack flex={1}>
      <Stack.Screen options={{ title: match.opponentName, headerBackVisible: true }} />

      <Scoreboard
        setNumber={currentSet.setNumber}
        ourScore={ourScore}
        opponentScore={opponentScore}
        opponentName={match.opponentName}
        canUndo={Boolean(lastEvent)}
        onUndoLast={handleUndoLast}
        onPlusUs={handlePlusUs}
        onPlusOpponent={handlePlusOpponent}
      />

      {setWinner ? (
        <SetCompletePanel
          setNumber={currentSet.setNumber}
          ourScore={ourScore}
          opponentScore={opponentScore}
          winner={setWinner}
          isMatchComplete={wouldCompleteMatch}
          submitting={finalizing}
          onContinue={handleFinalizeSet}
        />
      ) : !selectedPlayer ? (
        <PlayerGrid players={activePlayers} recentPlayerId={recentPlayerId} onSelect={selectPlayer} />
      ) : (
        <YStack flex={1}>
          <XStack padding="$3" alignItems="center" gap="$2">
            <Button size="$2" chromeless onPress={resetSelection}>
              {selectedPlayer.number != null ? `#${selectedPlayer.number} ` : ""}
              {selectedPlayer.name}
            </Button>
            <Text color="$color10">›</Text>
          </XStack>

          {!selectedActionType ? (
            <ActionTypeRow onSelect={selectAction} />
          ) : (
            <YStack flex={1}>
              <XStack paddingHorizontal="$3" alignItems="center" gap="$2">
                <Button size="$2" chromeless onPress={clearAction}>
                  {t(`actions.${selectedActionType}`)}
                </Button>
              </XStack>
              <OutcomePicker actionType={selectedActionType} onSelect={handleSelectOutcome} />
            </YStack>
          )}
        </YStack>
      )}
    </YStack>
  );
}
