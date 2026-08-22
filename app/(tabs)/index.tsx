import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { eq } from "drizzle-orm";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { Button, Dialog, Input, ListItem, ScrollView, Separator, Text, XStack, YStack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";

import { db } from "@/src/db/client";
import { teams, type Team } from "@/src/db/schema";
import { teamRepository } from "@/src/repositories";
import { useActiveTeamStore } from "@/src/state/activeTeamStore";

export default function TeamsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: teamRows } = useLiveQuery(db.select().from(teams).where(eq(teams.isDeleted, false)));
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  const setActiveTeamId = useActiveTeamStore((s) => s.setActiveTeamId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamNameInput, setTeamNameInput] = useState("");

  function openCreateDialog() {
    setEditingTeam(null);
    setTeamNameInput("");
    setDialogOpen(true);
  }

  function openEditDialog(team: Team) {
    setEditingTeam(team);
    setTeamNameInput(team.name);
    setDialogOpen(true);
  }

  async function handleSaveTeam() {
    const name = teamNameInput.trim();
    if (!name) return;

    if (editingTeam) {
      await teamRepository.update(editingTeam.id, { name });
    } else {
      const team = await teamRepository.create({ name, color: null });
      if (!activeTeamId) setActiveTeamId(team.id);
    }
    setDialogOpen(false);
  }

  function confirmDeleteTeam(teamId: string, name: string) {
    Alert.alert(t("teams.deleteConfirmTitle"), t("teams.deleteConfirmMessage", { name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await teamRepository.softDelete(teamId);
          if (activeTeamId === teamId) setActiveTeamId(null);
        },
      },
    ]);
  }

  return (
    <YStack flex={1} padding="$4" gap="$3">
      <XStack justifyContent="flex-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <Button icon={<Ionicons name="add" size={18} />} onPress={openCreateDialog}>
              {t("teams.addTeam")}
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay
              key="overlay"
              opacity={0.5}
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
            <Dialog.Content key="content" gap="$4" width="90%" maxWidth={420}>
              <Dialog.Title>{editingTeam ? t("common.edit") : t("teams.addTeam")}</Dialog.Title>
              <Input
                autoFocus
                placeholder={t("teams.teamName")}
                value={teamNameInput}
                onChangeText={setTeamNameInput}
              />
              <XStack justifyContent="flex-end" gap="$3">
                <Dialog.Close asChild>
                  <Button>{t("common.cancel")}</Button>
                </Dialog.Close>
                <Button
                  theme="active"
                  disabled={!teamNameInput.trim()}
                  opacity={teamNameInput.trim() ? 1 : 0.5}
                  onPress={handleSaveTeam}
                >
                  {t("common.save")}
                </Button>
              </XStack>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </XStack>

      {teamRows.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text color="$color10">{t("teams.noTeams")}</Text>
        </YStack>
      ) : (
        <ScrollView flex={1}>
          <YStack borderRadius="$4" overflow="hidden">
            {teamRows.map((team, index) => (
              <YStack key={team.id}>
                {index > 0 ? <Separator /> : null}
                <ListItem
                  title={team.name}
                  subTitle={team.id === activeTeamId ? t("teams.active") : undefined}
                  onPress={() =>
                    router.push({ pathname: "/teams/[teamId]", params: { teamId: team.id } })
                  }
                  icon={
                    <Button
                      size="$2"
                      circular
                      chromeless
                      icon={
                        <Ionicons
                          name={team.id === activeTeamId ? "checkmark-circle" : "ellipse-outline"}
                          size={22}
                          color={team.id === activeTeamId ? "#22c55e" : "#999"}
                        />
                      }
                      onPress={() => setActiveTeamId(team.id)}
                    />
                  }
                  iconAfter={
                    <XStack gap="$1">
                      <Button
                        size="$2"
                        circular
                        chromeless
                        icon={<Ionicons name="pencil-outline" size={18} />}
                        onPress={() => openEditDialog(team)}
                      />
                      <Button
                        size="$2"
                        circular
                        chromeless
                        icon={<Ionicons name="trash-outline" size={18} />}
                        onPress={() => confirmDeleteTeam(team.id, team.name)}
                      />
                    </XStack>
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
