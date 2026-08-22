import { useTranslation } from "react-i18next";
import { Text, XStack, YStack } from "tamagui";

import type { PlayerStats } from "@/src/domain/stats";

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function signed(value: number): string {
  return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}

interface StatRowProps {
  label: string;
  value: string;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <XStack justifyContent="space-between">
      <Text color="$color10">{label}</Text>
      <Text fontWeight="600">{value}</Text>
    </XStack>
  );
}

interface StatSectionProps {
  title: string;
  children: React.ReactNode;
}

function StatSection({ title, children }: StatSectionProps) {
  return (
    <YStack gap="$2" padding="$3" borderRadius="$4" backgroundColor="$color2">
      <Text fontWeight="700">{title}</Text>
      {children}
    </YStack>
  );
}

interface PlayerStatsSummaryProps {
  stats: PlayerStats;
}

/** Renders one card per action type the player actually recorded — a libero with 0 attack attempts doesn't get an empty Attack card. */
export function PlayerStatsSummary({ stats }: PlayerStatsSummaryProps) {
  const { t } = useTranslation();

  return (
    <YStack gap="$3">
      {stats.serve.attempts > 0 && (
        <StatSection title={t("actions.serve")}>
          <StatRow label={t("stats.attempts")} value={String(stats.serve.attempts)} />
          <StatRow label={t("stats.aces")} value={String(stats.serve.aces)} />
          <StatRow label={t("stats.errors")} value={String(stats.serve.errors)} />
          <StatRow label={t("stats.acePct")} value={pct(stats.serve.acePct)} />
          <StatRow label={t("stats.rating")} value={signed(stats.serve.rating)} />
        </StatSection>
      )}

      {stats.serveReceive.attempts > 0 && (
        <StatSection title={t("actions.serve_receive")}>
          <StatRow label={t("stats.attempts")} value={String(stats.serveReceive.attempts)} />
          <StatRow
            label={t("stats.passDistribution")}
            value={`${stats.serveReceive.perfect}/${stats.serveReceive.good}/${stats.serveReceive.poor}/${stats.serveReceive.errors}`}
          />
          <StatRow label={t("stats.passerRating")} value={stats.serveReceive.passerRating.toFixed(2)} />
        </StatSection>
      )}

      {stats.attack.attempts > 0 && (
        <StatSection title={t("actions.attack")}>
          <StatRow label={t("stats.attempts")} value={String(stats.attack.attempts)} />
          <StatRow label={t("stats.kills")} value={String(stats.attack.kills)} />
          <StatRow label={t("stats.errors")} value={String(stats.attack.errors)} />
          <StatRow label={t("stats.killPct")} value={pct(stats.attack.killPct)} />
          <StatRow label={t("stats.efficiency")} value={signed(stats.attack.efficiency)} />
        </StatSection>
      )}

      {stats.block.attempts > 0 && (
        <StatSection title={t("actions.block")}>
          <StatRow label={t("stats.attempts")} value={String(stats.block.attempts)} />
          <StatRow label={t("stats.stuffs")} value={String(stats.block.stuffs)} />
          <StatRow label={t("stats.touches")} value={String(stats.block.touches)} />
          <StatRow label={t("stats.errors")} value={String(stats.block.errors)} />
          <StatRow label={t("stats.blocksPerSet")} value={stats.block.blocksPerSet.toFixed(2)} />
        </StatSection>
      )}

      {stats.dig.attempts > 0 && (
        <StatSection title={t("actions.dig")}>
          <StatRow label={t("stats.attempts")} value={String(stats.dig.attempts)} />
          <StatRow label={t("stats.errors")} value={String(stats.dig.errors)} />
          <StatRow label={t("stats.successRate")} value={pct(stats.dig.successRate)} />
        </StatSection>
      )}

      {(stats.set.attempts > 0 || stats.set.assists > 0) && (
        <StatSection title={t("actions.set")}>
          <StatRow label={t("stats.attempts")} value={String(stats.set.attempts)} />
          <StatRow label={t("stats.errors")} value={String(stats.set.errors)} />
          <StatRow label={t("stats.assists")} value={String(stats.set.assists)} />
        </StatSection>
      )}

      {stats.freeball.attempts > 0 && (
        <StatSection title={t("actions.freeball")}>
          <StatRow label={t("stats.attempts")} value={String(stats.freeball.attempts)} />
          <StatRow label={t("stats.errors")} value={String(stats.freeball.errors)} />
        </StatSection>
      )}

      {stats.serve.attempts === 0 &&
        stats.serveReceive.attempts === 0 &&
        stats.attack.attempts === 0 &&
        stats.block.attempts === 0 &&
        stats.dig.attempts === 0 &&
        stats.set.attempts === 0 &&
        stats.set.assists === 0 &&
        stats.freeball.attempts === 0 && (
          <YStack alignItems="center" padding="$4">
            <Text color="$color8">{t("stats.noData")}</Text>
          </YStack>
        )}
    </YStack>
  );
}
