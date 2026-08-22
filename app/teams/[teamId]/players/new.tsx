import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView } from "tamagui";

import { PlayerForm, type PlayerFormValues } from "@/src/components/roster/PlayerForm";
import { playerRepository } from "@/src/repositories";

export default function NewPlayerScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  async function handleSubmit(values: PlayerFormValues) {
    await playerRepository.create({ teamId, ...values });
    router.back();
  }

  return (
    <ScrollView>
      <Stack.Screen options={{ title: t("players.addPlayer") }} />
      <PlayerForm submitLabel={t("common.save")} onSubmit={handleSubmit} />
    </ScrollView>
  );
}
