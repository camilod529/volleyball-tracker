import { and, desc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { ListItem, ScrollView, Separator, Text, YStack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";

import { db } from "@/src/db/client";
import { matches } from "@/src/db/schema";
import { formatMatchDateTime } from "@/src/utils/formatMatchDateTime";

export default function MatchHistoryScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { data: matchRows } = useLiveQuery(
    db
      .select()
      .from(matches)
      .where(and(eq(matches.teamId, teamId), eq(matches.isDeleted, false)))
      .orderBy(desc(matches.matchDate))
  );

  return (
    <YStack flex={1} padding="$4" gap="$3">
      <Stack.Screen
        options={{
          title: t("matches.matchHistory"),
          headerRight: () => (
            <Pressable
              onPress={() => router.push({ pathname: "/teams/[teamId]/export", params: { teamId } })}
              hitSlop={12}
            >
              <Ionicons name="share-outline" size={22} />
            </Pressable>
          ),
        }}
      />

      {matchRows.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text color="$color10">{t("matches.noMatches")}</Text>
        </YStack>
      ) : (
        <ScrollView flex={1}>
          <YStack borderRadius="$4" overflow="hidden">
            {matchRows.map((match, index) => (
              <YStack key={match.id}>
                {index > 0 ? <Separator /> : null}
                <ListItem
                  title={t("matches.vs", { opponent: match.opponentName })}
                  subTitle={`${formatMatchDateTime(match.matchDate, i18n.language)} · ${t(`matches.status.${match.status}`)}`}
                  onPress={() =>
                    router.push(
                      match.status === "completed"
                        ? { pathname: "/matches/[matchId]/summary", params: { matchId: match.id } }
                        : { pathname: "/matches/[matchId]/live", params: { matchId: match.id } }
                    )
                  }
                />
              </YStack>
            ))}
          </YStack>
        </ScrollView>
      )}
    </YStack>
  );
}
