import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, Label, Switch, XStack, YStack } from "tamagui";

import type { PlayerPosition } from "@/src/domain/outcomes";

import { PositionSelect } from "./PositionSelect";

export interface PlayerFormValues {
  name: string;
  number: number | null;
  positions: PlayerPosition[];
  isActive: boolean;
}

interface PlayerFormProps {
  initialValues?: PlayerFormValues;
  submitLabel: string;
  onSubmit: (values: PlayerFormValues) => void;
}

const DEFAULT_VALUES: PlayerFormValues = {
  name: "",
  number: null,
  positions: ["outside_hitter"],
  isActive: true,
};

export function PlayerForm({
  initialValues,
  submitLabel,
  onSubmit,
}: PlayerFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues?.name ?? DEFAULT_VALUES.name);
  const [numberText, setNumberText] = useState(
    initialValues?.number?.toString() ?? "",
  );
  const [positions, setPositions] = useState<PlayerPosition[]>(
    initialValues?.positions ?? DEFAULT_VALUES.positions,
  );
  const [isActive, setIsActive] = useState(
    initialValues?.isActive ?? DEFAULT_VALUES.isActive,
  );

  const canSubmit = name.trim().length > 0 && positions.length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    const parsedNumber =
      numberText.trim().length > 0 ? Number(numberText) : null;
    onSubmit({
      name: name.trim(),
      number:
        parsedNumber !== null && Number.isFinite(parsedNumber)
          ? parsedNumber
          : null,
      positions,
      isActive,
    });
  }

  return (
    <YStack gap="$4" padding="$4">
      <YStack gap="$2">
        <Label htmlFor="player-name">{t("players.name")}</Label>
        <Input id="player-name" value={name} onChangeText={setName} autoFocus />
      </YStack>

      <YStack gap="$2">
        <Label htmlFor="player-number">{t("players.number")}</Label>
        <Input
          id="player-number"
          value={numberText}
          onChangeText={setNumberText}
          keyboardType="number-pad"
        />
      </YStack>

      <YStack gap="$2">
        <Label>{t("players.position")}</Label>
        <PositionSelect value={positions} onChange={setPositions} />
      </YStack>

      <XStack alignItems="center" gap="$3">
        <Label htmlFor="player-active" flex={1}>
          {isActive ? t("players.active") : t("players.inactive")}
        </Label>
        <Switch
          id="player-active"
          checked={isActive}
          onCheckedChange={setIsActive}
          backgroundColor={isActive ? "$blue8" : undefined}
        >
          <Switch.Thumb backgroundColor="white" />
        </Switch>
      </XStack>

      <Button theme="active" opacity={canSubmit ? 1 : 0.5} onPress={handleSubmit}>
        {submitLabel}
      </Button>
    </YStack>
  );
}
