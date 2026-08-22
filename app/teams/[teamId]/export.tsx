import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { Button, Spinner, Text, YStack } from "tamagui";

import { db } from "@/src/db/client";
import { actionEvents, matches, players, sets, teams } from "@/src/db/schema";
import { buildActionEventsCsv } from "@/src/export/csvBuilder";
import { shareCsv } from "@/src/export/exportService";
import { mapEventsToCsvRows } from "@/src/export/mapToCsvRows";

export default function TeamExportScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const { data: teamRows } = useLiveQuery(db.select().from(teams).where(eq(teams.id, teamId)));
  const team = teamRows[0];

  const { data: matchRows } = useLiveQuery(db.select().from(matches).where(eq(matches.teamId, teamId)));
  const { data: rosterRows } = useLiveQuery(db.select().from(players).where(eq(players.teamId, teamId)));
  const { data: eventRows } = useLiveQuery(
    db.select().from(actionEvents).where(eq(actionEvents.teamId, teamId))
  );

  if (!team) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner />
      </YStack>
    );
  }

  async function handleExport() {
    setExporting(true);
    try {
      // sets aren't filterable by teamId directly, so pull them per-match instead.
      const setsForTeam = await Promise.all(
        matchRows.map((match) => db.select().from(sets).where(eq(sets.matchId, match.id)))
      );
      const rows = mapEventsToCsvRows(eventRows, {
        matchesById: new Map(matchRows.map((m) => [m.id, m])),
        setsById: new Map(setsForTeam.flat().map((s) => [s.id, s])),
        playersById: new Map(rosterRows.map((p) => [p.id, p])),
      });
      const csv = buildActionEventsCsv(rows);
      const filename = `${team!.name}-all-matches`.replace(/[^\w-]+/g, "_") + ".csv";
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
      <Text color="$color10">{t("export.teamExportDescription")}</Text>
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
