import type { PointImpact } from "@/src/domain/outcomes";

export const IMPACT_COLOR: Record<PointImpact, string> = {
  our_point: "$green8",
  opponent_point: "$red8",
  neutral: "$gray5",
};
