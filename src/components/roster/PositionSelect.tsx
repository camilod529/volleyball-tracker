import { useTranslation } from "react-i18next";
import { XStack } from "tamagui";

import { SelectableChip } from "@/src/components/shared/SelectableChip";
import { PLAYER_POSITIONS, type PlayerPosition } from "@/src/domain/outcomes";

interface PositionSelectProps {
  /** A player can play more than one position (e.g. setter and opposite). */
  value: PlayerPosition[];
  onChange: (positions: PlayerPosition[]) => void;
}

export function PositionSelect({ value, onChange }: PositionSelectProps) {
  const { t } = useTranslation();

  function toggle(position: PlayerPosition) {
    if (value.includes(position)) {
      onChange(value.filter((p) => p !== position));
    } else {
      onChange([...value, position]);
    }
  }

  return (
    <XStack flexWrap="wrap" gap="$2">
      {PLAYER_POSITIONS.map((position) => (
        <SelectableChip key={position} size="$3" selected={value.includes(position)} onPress={() => toggle(position)}>
          {t(`positions.${position}`)}
        </SelectableChip>
      ))}
    </XStack>
  );
}
