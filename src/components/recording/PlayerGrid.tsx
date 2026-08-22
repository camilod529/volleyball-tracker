import { useTranslation } from "react-i18next";
import { Button, Text, XStack, YStack } from "tamagui";

import type { Player } from "@/src/db/schema";

interface PlayerGridProps {
  players: Player[];
  recentPlayerId: string | null;
  onSelect: (playerId: string) => void;
}

export function PlayerGrid({ players, recentPlayerId, onSelect }: PlayerGridProps) {
  const { t } = useTranslation();

  const recentPlayer = players.find((p) => p.id === recentPlayerId);
  const rest = players.filter((p) => p.id !== recentPlayerId);
  const ordered = recentPlayer ? [recentPlayer, ...rest] : players;

  return (
    <YStack gap="$3" padding="$3" flex={1}>
      <Text color="$color10">{t("recording.selectPlayer")}</Text>
      <XStack flexWrap="wrap" gap="$2">
        {ordered.map((player) => (
          <Button
            key={player.id}
            size="$5"
            minWidth="30%"
            flexGrow={1}
            theme={player.id === recentPlayerId ? "active" : undefined}
            onPress={() => onSelect(player.id)}
          >
            <YStack alignItems="center">
              <Text fontWeight="700" fontSize="$5">
                {player.number != null ? `#${player.number}` : ""}
              </Text>
              <Text numberOfLines={1}>{player.name}</Text>
              {player.id === recentPlayerId ? (
                <Text fontSize="$1" color="$color10">
                  {t("recording.recent")}
                </Text>
              ) : null}
            </YStack>
          </Button>
        ))}
      </XStack>
    </YStack>
  );
}
