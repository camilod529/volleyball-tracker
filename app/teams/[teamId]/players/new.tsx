import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform } from "react-native";
import { ScrollView } from "tamagui";

import { PlayerForm, type PlayerFormValues } from "@/src/components/roster/PlayerForm";
import { serializePositions } from "@/src/domain/outcomes";
import { playerRepository } from "@/src/repositories";

export default function NewPlayerScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  async function handleSubmit(values: PlayerFormValues) {
    const { positions, ...rest } = values;
    await playerRepository.create({ teamId, ...rest, positions: serializePositions(positions) });
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: t("players.addPlayer") }} />
        <PlayerForm submitLabel={t("common.save")} onSubmit={handleSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
