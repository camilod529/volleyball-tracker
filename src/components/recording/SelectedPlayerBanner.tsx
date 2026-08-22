import { useTranslation } from "react-i18next";
import { Button, Text, XStack, YStack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";

import type { Player } from "@/src/db/schema";

interface SelectedPlayerBannerProps {
  player: Player;
  onChangePlayer: () => void;
}

/**
 * Prominent "who am I recording for right now" banner — the small
 * chromeless text chip this replaced was easy to miss mid-game, per
 * real-device testing feedback.
 */
export function SelectedPlayerBanner({ player, onChangePlayer }: SelectedPlayerBannerProps) {
  const { t } = useTranslation();

  return (
    <XStack
      alignItems="center"
      gap="$3"
      padding="$3"
      backgroundColor="$blue4"
      borderBottomWidth={2}
      borderBottomColor="$blue8"
    >
      <YStack
        width={44}
        height={44}
        borderRadius={22}
        backgroundColor="$blue8"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="white" fontWeight="800" fontSize={player.number != null ? "$5" : "$7"}>
          {player.number != null ? `#${player.number}` : player.name.charAt(0).toUpperCase()}
        </Text>
      </YStack>
      <Text flex={1} fontSize="$6" fontWeight="700" numberOfLines={1}>
        {player.name}
      </Text>
      <Button
        size="$3"
        chromeless
        icon={<Ionicons name="swap-horizontal" size={18} />}
        onPress={onChangePlayer}
      >
        {t("recording.changePlayer")}
      </Button>
    </XStack>
  );
}
