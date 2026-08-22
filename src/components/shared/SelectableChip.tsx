import type { ButtonProps } from "tamagui";
import { Button } from "tamagui";

interface SelectableChipProps extends ButtonProps {
  selected?: boolean;
}

/**
 * A toggle/selection chip (theme picker, format picker, position picker,
 * etc). Deliberately does NOT use Tamagui's `theme="active"` — that theme is
 * tuned for a transient pressed state and renders too dark/high-contrast to
 * live as a persistent "this one is selected" indicator, especially on iOS.
 */
export function SelectableChip({ selected, ...props }: SelectableChipProps) {
  return (
    <Button
      backgroundColor={selected ? "$blue5" : undefined}
      borderColor={selected ? "$blue8" : "$borderColor"}
      borderWidth={2}
      {...props}
    />
  );
}
