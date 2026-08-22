import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Pressable } from "react-native";
import { Button, ListItem, Separator, Text, XStack, YStack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";

import { db } from "@/src/db/client";
import { players, teams } from "@/src/db/schema";
import { playerRepository } from "@/src/repositories";

export default function RosterScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: teamRows } = useLiveQuery(db.select().from(teams).where(eq(teams.id, teamId)));
  const team = teamRows[0];

  const { data: playerRows } = useLiveQuery(
    db.select().from(players).where(eq(players.teamId, teamId))
  );
  const activePlayers = playerRows.filter((p) => !p.isDeleted);
  const hasActiveRosterPlayers = activePlayers.some((p) => p.isActive);

  function confirmDeletePlayer(playerId: string, name: string) {
    Alert.alert(t("players.deleteConfirmTitle"), t("players.deleteConfirmMessage", { name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => playerRepository.softDelete(playerId),
      },
    ]);
  }

  return (
    <YStack flex={1} padding="$4" gap="$3">
      <Stack.Screen
        options={{
          title: team?.name ?? t("players.title"),
          headerRight: () => (
            <Pressable
              onPress={() => router.push({ pathname: "/teams/[teamId]/matches", params: { teamId } })}
              hitSlop={12}
            >
              <Ionicons name="time-outline" size={22} />
            </Pressable>
          ),
        }}
      />

      <XStack justifyContent="space-between" gap="$2">
        <Button
          theme="active"
          disabled={!hasActiveRosterPlayers}
          opacity={hasActiveRosterPlayers ? 1 : 0.5}
          icon={<Ionicons name="play" size={16} />}
          onPress={() => router.push({ pathname: "/matches/new", params: { teamId } })}
        >
          {t("matches.startMatch")}
        </Button>
        <Button
          icon={<Ionicons name="add" size={18} />}
          onPress={() =>
            router.push({ pathname: "/teams/[teamId]/players/new", params: { teamId } })
          }
        >
          {t("players.addPlayer")}
        </Button>
      </XStack>

      {activePlayers.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text color="$color10">{t("players.noPlayers")}</Text>
        </YStack>
      ) : (
        <YStack borderRadius="$4" overflow="hidden">
          {activePlayers.map((player, index) => (
            <YStack key={player.id}>
              {index > 0 ? <Separator /> : null}
              <ListItem
                title={player.number != null ? `#${player.number} ${player.name}` : player.name}
                subTitle={`${t(`positions.${player.position}`)}${
                  player.isActive ? "" : ` · ${t("players.inactive")}`
                }`}
                onPress={() =>
                  router.push({
                    pathname: "/teams/[teamId]/players/[playerId]/edit",
                    params: { teamId, playerId: player.id },
                  })
                }
                iconAfter={
                  <Button
                    size="$2"
                    circular
                    chromeless
                    icon={<Ionicons name="trash-outline" size={18} />}
                    onPress={() => confirmDeletePlayer(player.id, player.name)}
                  />
                }
              />
            </YStack>
          ))}
        </YStack>
      )}
    </YStack>
  );
}
