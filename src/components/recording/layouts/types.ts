import type { Player } from "@/src/db/schema";
import type { ActionType } from "@/src/domain/outcomes";

export interface RecordingLayoutProps {
  players: Player[];
  recentPlayerId: string | null;
  selectedPlayer: Player | undefined;
  selectedActionType: ActionType | null;
  onSelectPlayer: (playerId: string) => void;
  onSelectAction: (actionType: ActionType) => void;
  onSelectOutcome: (outcomeCode: string) => void;
  onResetPlayer: () => void;
  onClearAction: () => void;
}
