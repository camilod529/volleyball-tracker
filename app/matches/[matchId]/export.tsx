import { and, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { Button, Spinner, Text, YStack } from "tamagui";

import { db } from "@/src/db/client";
import { actionEvents, matches, players, sets } from "@/src/db/schema";
import { buildActionEventsCsv } from "@/src/export/csvBuilder";
import { shareCsv } from "@/src/export/exportService";
import { mapEventsToCsvRows } from "@/src/export/mapToCsvRows";

export default function MatchExportScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const { data: matchRows } = useLiveQuery(db.select().from(matches).where(eq(matches.id, matchId)));
  const match = matchRows[0];

  const { data: setRows } = useLiveQuery(db.select().from(sets).where(eq(sets.matchId, matchId)));

  const { data: eventRows } = useLiveQuery(
    db
      .select()
      .from(actionEvents)
      .where(and(eq(actionEvents.matchId, matchId), eq(actionEvents.isDeleted, false)))
  );

  const { data: rosterRows } = useLiveQuery(
    db.select().from(players).where(eq(players.teamId, match?.teamId ?? "")),
    [match?.teamId]
  );

  if (!match) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner />
      </YStack>
    );
  }

  async function handleExport() {
    setExporting(true);
    try {
      const rows = mapEventsToCsvRows(eventRows, {
        matchesById: new Map([[match!.id, match!]]),
        setsById: new Map(setRows.map((s) => [s.id, s])),
        playersById: new Map(rosterRows.map((p) => [p.id, p])),
      });
      const csv = buildActionEventsCsv(rows);
      const filename = `${match!.matchDate}-vs-${match!.opponentName}`.replace(/[^\w-]+/g, "_") + ".csv";
      await shareCsv(filename, csv);
    } catch {
      Alert.alert(t("export.exportError"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <YStack flex={1} padding="$4" gap="$4">
      <Stack.Screen options={{ title: t("export.title") }} />
      <Text color="$color10">{t("export.matchExportDescription")}</Text>
      <Text fontWeight="600">{t("export.eventCount", { count: eventRows.length })}</Text>
      <Button
        theme="active"
        size="$5"
        disabled={exporting || eventRows.length === 0}
        opacity={exporting || eventRows.length === 0 ? 0.5 : 1}
        onPress={handleExport}
      >
        {t("export.exportButton")}
      </Button>
    </YStack>
  );
}
