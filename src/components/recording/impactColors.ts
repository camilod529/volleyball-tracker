import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

import type { PointImpact } from "@/src/domain/outcomes";

export const IMPACT_COLOR: Record<PointImpact, string> = {
  our_point: "$green8",
  opponent_point: "$red8",
  neutral: "$gray5",
};

/**
 * Point impact is also shown via icon, not just background color — a
 * colorblind coach still needs to tell "our point" from "opponent point"
 * from "neutral" at a glance mid-rally.
 */
export const IMPACT_ICON: Record<PointImpact, ComponentProps<typeof Ionicons>["name"]> = {
  our_point: "add-circle",
  opponent_point: "close-circle",
  neutral: "ellipse-outline",
};
