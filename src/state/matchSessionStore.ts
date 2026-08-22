import { create } from "zustand";

import type { ActionType } from "@/src/domain/outcomes";

interface MatchSessionState {
  selectedPlayerId: string | null;
  selectedActionType: ActionType | null;
  recentPlayerId: string | null;
  selectPlayer: (playerId: string) => void;
  selectAction: (actionType: ActionType) => void;
  /** Called after an outcome commits: clears the in-progress selection and remembers the player for quick reselect. */
  commit: (playerId: string) => void;
  /** Back to step 1 (tapping the collapsed player chip): clears both selections. */
  reset: () => void;
  /** Back to step 2 (tapping the collapsed action chip): clears only the action, keeps the player selected. */
  clearAction: () => void;
  /** Full reset including recentPlayerId, used when entering/leaving a match's live screen. */
  hardReset: () => void;
}

export const useMatchSessionStore = create<MatchSessionState>((set) => ({
  selectedPlayerId: null,
  selectedActionType: null,
  recentPlayerId: null,
  selectPlayer: (playerId) => set({ selectedPlayerId: playerId }),
  selectAction: (actionType) => set({ selectedActionType: actionType }),
  commit: (playerId) =>
    set({ selectedPlayerId: null, selectedActionType: null, recentPlayerId: playerId }),
  reset: () => set({ selectedPlayerId: null, selectedActionType: null }),
  clearAction: () => set({ selectedActionType: null }),
  hardReset: () => set({ selectedPlayerId: null, selectedActionType: null, recentPlayerId: null }),
}));
