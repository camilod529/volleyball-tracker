import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, ScrollView, Text, XStack, YStack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";

import { SelectableChip } from "@/src/components/shared/SelectableChip";
import type { ActionEvent, Player } from "@/src/db/schema";
import { ACTION_OUTCOMES, RECORDABLE_ACTION_TYPES, type ActionType } from "@/src/domain/outcomes";

import { IMPACT_COLOR, IMPACT_ICON } from "./impactColors";

export interface EventEditResult {
  playerId: string | null;
  actionType: ActionType;
  outcomeCode: string;
}

interface EditEventDialogProps {
  event: ActionEvent | null;
  players: Player[];
  onClose: () => void;
  onSave: (eventId: string, changes: EventEditResult) => void;
  onDelete: (eventId: string) => void;
}

export function EditEventDialog({ event, players, onClose, onSave, onDelete }: EditEventDialogProps) {
  return (
    <Dialog open={Boolean(event)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" opacity={0.5} enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content key="content" gap="$4" width="92%" maxWidth={480} maxHeight="85%">
          {event ? (
            // Keyed on the event id so switching which event is being edited
            // remounts the form with fresh initial state, instead of syncing
            // props into state via an effect.
            <EditEventForm
              key={event.id}
              event={event}
              players={players}
              onClose={onClose}
              onSave={onSave}
              onDelete={onDelete}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

function EditEventForm({
  event,
  players,
  onClose,
  onSave,
  onDelete,
}: {
  event: ActionEvent;
  players: Player[];
  onClose: () => void;
  onSave: (eventId: string, changes: EventEditResult) => void;
  onDelete: (eventId: string) => void;
}) {
  const { t } = useTranslation();
  const [playerId, setPlayerId] = useState<string | null>(event.playerId);
  const [actionType, setActionType] = useState<ActionType>(event.actionType as ActionType);
  const [outcomeCode, setOutcomeCode] = useState(event.outcomeCode);

  const isTeamAdjustment = event.playerId === null;

  return (
    <ScrollView>
      <YStack gap="$4">
        <Dialog.Title>{t("recording.editEvent")}</Dialog.Title>

        {!isTeamAdjustment && (
          <YStack gap="$2">
            <Text color="$color10">{t("recording.selectPlayer")}</Text>
            <XStack flexWrap="wrap" gap="$2">
              {players.map((player) => (
                <SelectableChip
                  key={player.id}
                  size="$3"
                  selected={player.id === playerId}
                  onPress={() => setPlayerId(player.id)}
                >
                  {player.number != null ? `#${player.number} ` : ""}
                  {player.name}
                </SelectableChip>
              ))}
            </XStack>
          </YStack>
        )}

        {!isTeamAdjustment && (
          <YStack gap="$2">
            <Text color="$color10">{t("recording.selectAction")}</Text>
            <XStack flexWrap="wrap" gap="$2">
              {RECORDABLE_ACTION_TYPES.map((type) => (
                <SelectableChip
                  key={type}
                  size="$3"
                  selected={type === actionType}
                  onPress={() => {
                    setActionType(type);
                    setOutcomeCode("");
                  }}
                >
                  {t(`actions.${type}`)}
                </SelectableChip>
              ))}
            </XStack>
          </YStack>
        )}

        <YStack gap="$2">
          <Text color="$color10">{t("recording.selectOutcome")}</Text>
          <XStack flexWrap="wrap" gap="$2">
            {ACTION_OUTCOMES[actionType].map((outcome) => (
              <Button
                key={outcome.code}
                size="$3"
                backgroundColor={IMPACT_COLOR[outcome.pointImpact]}
                icon={<Ionicons name={IMPACT_ICON[outcome.pointImpact]} size={16} />}
                borderWidth={outcome.code === outcomeCode ? 3 : 0}
                borderColor="$color12"
                onPress={() => setOutcomeCode(outcome.code)}
              >
                {t(outcome.labelKey)}
              </Button>
            ))}
          </XStack>
        </YStack>

        <XStack justifyContent="space-between" gap="$3">
          <Button theme="red" onPress={() => onDelete(event.id)}>
            {t("common.delete")}
          </Button>
          <XStack gap="$3">
            <Button onPress={onClose}>{t("common.cancel")}</Button>
            <Button
              theme="active"
              disabled={!outcomeCode || (!isTeamAdjustment && !playerId)}
              opacity={outcomeCode && (isTeamAdjustment || playerId) ? 1 : 0.5}
              onPress={() => onSave(event.id, { playerId, actionType, outcomeCode })}
            >
              {t("common.save")}
            </Button>
          </XStack>
        </XStack>
      </YStack>
    </ScrollView>
  );
}
