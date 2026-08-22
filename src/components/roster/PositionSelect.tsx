import { useTranslation } from "react-i18next";
import { XStack, Button } from "tamagui";

import { PLAYER_POSITIONS, type PlayerPosition } from "@/src/domain/outcomes";

interface PositionSelectProps {
  value: PlayerPosition;
  onChange: (position: PlayerPosition) => void;
}

export function PositionSelect({ value, onChange }: PositionSelectProps) {
  const { t } = useTranslation();

  return (
    <XStack flexWrap="wrap" gap="$2">
      {PLAYER_POSITIONS.map((position) => (
        <Button
          key={position}
          size="$3"
          theme={position === value ? "active" : undefined}
          backgroundColor={position === value ? "$blue8" : undefined}
          onPress={() => onChange(position)}
        >
          {t(`positions.${position}`)}
        </Button>
      ))}
    </XStack>
  );
}
