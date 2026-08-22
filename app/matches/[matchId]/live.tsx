import { and, asc, desc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { Sheet, Spinner, YStack } from "tamagui";

import { EditEventDialog, type EventEditResult } from "@/src/components/recording/EditEventDialog";
import { RecentEventsPanel } from "@/src/components/recording/RecentEventsPanel";
import { Scoreboard } from "@/src/components/recording/Scoreboard";
import { SetCompletePanel } from "@/src/components/recording/SetCompletePanel";
import { StackedAccordionLayout } from "@/src/components/recording/layouts/StackedAccordionLayout";
import { ThreeColumnLayout } from "@/src/components/recording/layouts/ThreeColumnLayout";
import type { RecordingLayoutProps } from "@/src/components/recording/layouts/types";
import { TwoColumnLayout } from "@/src/components/recording/layouts/TwoColumnLayout";
import { db } from "@/src/db/client";
import { actionEvents, matches, players, sets, type ActionEvent } from "@/src/db/schema";
import {
  DECIDING_SET,
  getMatchWinner,
  getSetWinner,
  isDecidingSet,
  STANDARD_SET,
} from "@/src/domain/scoring";
import { useResponsiveLayout, type RecordingLayoutKind } from "@/src/hooks/useResponsiveLayout";
import {
  actionEventRepository,
  matchRepository,
  recalculationService,
  setRepository,
} from "@/src/repositories";
import { useMatchSessionStore } from "@/src/state/matchSessionStore";

export default function LiveRecordingScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const layoutKind = useResponsiveLayout();
  const [finalizing, setFinalizing] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ActionEvent | null>(null);

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

  // Includes inactive players too, so past events referencing a since-deactivated player still display/edit correctly.
  const { data: allTeamPlayers } = useLiveQuery(
    db.select().from(players).where(eq(players.teamId, match?.teamId ?? "")),
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

  // Across the whole match (not just the current set) so a mistake in a
  // set that was just finalized is still reachable from Recent Events.
  const { data: recentMatchEvents } = useLiveQuery(
    db
      .select()
      .from(actionEvents)
      .where(and(eq(actionEvents.matchId, matchId), eq(actionEvents.isDeleted, false)))
      .orderBy(desc(actionEvents.occurredAt))
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

  function isEventInCompletedSet(event: ActionEvent) {
    return allSets.find((s) => s.id === event.setId)?.status === "completed";
  }

  function handleSelectEventForEdit(event: ActionEvent) {
    if (isEventInCompletedSet(event)) {
      Alert.alert(t("recording.editConfirmCompletedSetTitle"), t("recording.editConfirmCompletedSetMessage"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("common.confirm"), onPress: () => setEditingEvent(event) },
      ]);
      return;
    }
    setEditingEvent(event);
  }

  async function handleSaveEditedEvent(eventId: string, changes: EventEditResult) {
    await recalculationService.editEvent(eventId, changes);
    setEditingEvent(null);
  }

  function handleDeleteEditedEvent(eventId: string) {
    Alert.alert(t("recording.deleteEventConfirmTitle"), t("recording.deleteEventConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await recalculationService.deleteEvent(eventId);
          setEditingEvent(null);
        },
      },
    ]);
  }

  async function handleFinalizeSet() {
    if (!setWinner) return;
    setFinalizing(true);
    try {
      await setRepository.update(currentSet!.id, {
        status: "completed",
        winner: setWinner,
        endedAt: new Date().toISOString(),
        ourScore,
        opponentScore,
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
        onOpenHistory={layoutKind === "tablet-landscape" ? undefined : () => setHistorySheetOpen(true)}
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
      ) : (
        <RecordingLayout
          kind={layoutKind}
          players={activePlayers}
          recentPlayerId={recentPlayerId}
          selectedPlayer={selectedPlayer}
          selectedActionType={selectedActionType}
          onSelectPlayer={selectPlayer}
          onSelectAction={selectAction}
          onSelectOutcome={handleSelectOutcome}
          onResetPlayer={resetSelection}
          onClearAction={clearAction}
          recentEventsColumn={
            layoutKind === "tablet-landscape" ? (
              <RecentEventsPanel
                events={recentMatchEvents}
                players={allTeamPlayers}
                onSelectEvent={handleSelectEventForEdit}
              />
            ) : undefined
          }
        />
      )}

      <Sheet
        modal
        open={historySheetOpen}
        onOpenChange={setHistorySheetOpen}
        snapPoints={[75]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay key="overlay" opacity={0.5} enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Sheet.Handle />
        <Sheet.Frame>
          <RecentEventsPanel
            events={recentMatchEvents}
            players={allTeamPlayers}
            onSelectEvent={(event) => {
              setHistorySheetOpen(false);
              handleSelectEventForEdit(event);
            }}
          />
        </Sheet.Frame>
      </Sheet>

      <EditEventDialog
        event={editingEvent}
        players={allTeamPlayers}
        onClose={() => setEditingEvent(null)}
        onSave={handleSaveEditedEvent}
        onDelete={handleDeleteEditedEvent}
      />
    </YStack>
  );
}

function RecordingLayout({
  kind,
  recentEventsColumn,
  ...props
}: RecordingLayoutProps & { kind: RecordingLayoutKind; recentEventsColumn?: ReactNode }) {
  switch (kind) {
    case "phone-landscape":
    case "tablet-landscape":
      return <ThreeColumnLayout {...props} recentEventsColumn={recentEventsColumn} />;
    case "tablet-portrait":
      return <TwoColumnLayout {...props} />;
    case "phone-portrait":
    default:
      return <StackedAccordionLayout {...props} />;
  }
}
