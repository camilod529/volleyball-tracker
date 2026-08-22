import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform } from "react-native";
import { ScrollView, Spinner, YStack } from "tamagui";

import { PlayerForm, type PlayerFormValues } from "@/src/components/roster/PlayerForm";
import { db } from "@/src/db/client";
import { players } from "@/src/db/schema";
import { parsePositions, serializePositions } from "@/src/domain/outcomes";
import { playerRepository } from "@/src/repositories";

export default function EditPlayerScreen() {
  const { playerId } = useLocalSearchParams<{ teamId: string; playerId: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: rows } = useLiveQuery(db.select().from(players).where(eq(players.id, playerId)));
  const player = rows[0];

  async function handleSubmit(values: PlayerFormValues) {
    const { positions, ...rest } = values;
    await playerRepository.update(playerId, { ...rest, positions: serializePositions(positions) });
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: t("players.editPlayer") }} />
        {player ? (
          <PlayerForm
            initialValues={{
              name: player.name,
              number: player.number,
              positions: parsePositions(player.positions),
              isActive: player.isActive,
            }}
            submitLabel={t("common.save")}
            onSubmit={handleSubmit}
          />
        ) : (
          <YStack flex={1} alignItems="center" justifyContent="center" padding="$6">
            <Spinner />
          </YStack>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
