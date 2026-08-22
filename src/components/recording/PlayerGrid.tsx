import { useTranslation } from "react-i18next";
import { Text, XStack, YStack } from "tamagui";

import { SelectableChip } from "@/src/components/shared/SelectableChip";
import type { Player } from "@/src/db/schema";

interface PlayerGridProps {
  /** Rendered in the order given — callers should pass a stable, sortOrder-based query so the grid never reshuffles mid-game. Reordering (e.g. starters first) is done from the roster screen, not derived here. */
  players: Player[];
  recentPlayerId: string | null;
  onSelect: (playerId: string) => void;
  /** How many buttons per row — every button gets the same fixed size regardless of how many end up in the last row. Defaults to 3 (comfortable on a phone-width column). */
  columns?: number;
}

// Small buffer subtracted from the even split so `columns` buttons plus the
// gaps between them never wrap early inside their row.
function columnBasis(columns: number): `${number}%` {
  return `${100 / columns - 3}%`;
}

export function PlayerGrid({ players, recentPlayerId, onSelect, columns = 3 }: PlayerGridProps) {
  const { t } = useTranslation();
  const basis = columnBasis(columns);

  return (
    <YStack gap="$3" padding="$3" flex={1}>
      <Text color="$color10">{t("recording.selectPlayer")}</Text>
      <XStack flexWrap="wrap" gap="$2">
        {players.map((player) => (
          <PlayerButton
            key={player.id}
            player={player}
            isRecent={player.id === recentPlayerId}
            basis={basis}
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
  basis,
  onSelect,
}: {
  player: Player;
  isRecent: boolean;
  basis: `${number}%`;
  onSelect: (playerId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <SelectableChip
      size="$5"
      flexBasis={basis}
      flexGrow={0}
      flexShrink={0}
      selected={isRecent}
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
    </SelectableChip>
  );
}
