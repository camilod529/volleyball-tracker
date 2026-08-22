import { useTranslation } from "react-i18next";
import { Button, Text, XStack, YStack } from "tamagui";

import type { Player } from "@/src/db/schema";
import { PLAYER_POSITIONS } from "@/src/domain/outcomes";

interface PlayerGridProps {
  players: Player[];
  recentPlayerId: string | null;
  onSelect: (playerId: string) => void;
  /** Renders players in per-position sections instead of pinning the recent player first. Used by the tablet-portrait layout, which has room for a grouped roster view. */
  groupByPosition?: boolean;
}

export function PlayerGrid({ players, recentPlayerId, onSelect, groupByPosition }: PlayerGridProps) {
  const { t } = useTranslation();

  if (groupByPosition) {
    const groups = PLAYER_POSITIONS.map((position) => ({
      position,
      players: players.filter((p) => p.position === position),
    })).filter((group) => group.players.length > 0);

    return (
      <YStack gap="$4" padding="$3" flex={1}>
        <Text color="$color10">{t("recording.selectPlayer")}</Text>
        {groups.map((group) => (
          <YStack key={group.position} gap="$2">
            <Text fontSize="$2" color="$color10">
              {t(`positions.${group.position}`)}
            </Text>
            <XStack flexWrap="wrap" gap="$2">
              {group.players.map((player) => (
                <PlayerButton
                  key={player.id}
                  player={player}
                  isRecent={player.id === recentPlayerId}
                  onSelect={onSelect}
                />
              ))}
            </XStack>
          </YStack>
        ))}
      </YStack>
    );
  }

  const recentPlayer = players.find((p) => p.id === recentPlayerId);
  const rest = players.filter((p) => p.id !== recentPlayerId);
  const ordered = recentPlayer ? [recentPlayer, ...rest] : players;

  return (
    <YStack gap="$3" padding="$3" flex={1}>
      <Text color="$color10">{t("recording.selectPlayer")}</Text>
      <XStack flexWrap="wrap" gap="$2">
        {ordered.map((player) => (
          <PlayerButton
            key={player.id}
            player={player}
            isRecent={player.id === recentPlayerId}
            onSelect={onSelect}
          />
        ))}
      </XStack>
    </YStack>
  );
}

function PlayerButton({
  player,
  isRecent,
  onSelect,
}: {
  player: Player;
  isRecent: boolean;
  onSelect: (playerId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Button
      size="$5"
      minWidth="30%"
      flexGrow={1}
      theme={isRecent ? "active" : undefined}
      onPress={() => onSelect(player.id)}
    >
      <YStack alignItems="center">
        <Text fontWeight="700" fontSize="$5">
          {player.number != null ? `#${player.number}` : ""}
        </Text>
        <Text numberOfLines={1}>{player.name}</Text>
        {isRecent ? (
          <Text fontSize="$1" color="$color10">
            {t("recording.recent")}
          </Text>
        ) : null}
      </YStack>
    </Button>
  );
}
