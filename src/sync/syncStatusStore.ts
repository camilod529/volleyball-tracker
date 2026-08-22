import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SyncPhase = "idle" | "syncing" | "success" | "error";

interface SyncStatusState {
  /** The server's clock at the end of the last successful sync — the watermark for the next pull. Not a preference, but not sensitive either, so plain AsyncStorage (unlike connectionStore's credentials) is fine. */
  lastSyncedAt: string | null;
  phase: SyncPhase;
  lastError: string | null;
  setSyncing: () => void;
  setSuccess: (serverTime: string) => void;
  setError: (message: string) => void;
}

export const useSyncStatusStore = create<SyncStatusState>()(
  persist(
    (set) => ({
      lastSyncedAt: null,
      phase: "idle",
      lastError: null,
      setSyncing: () => set({ phase: "syncing", lastError: null }),
      setSuccess: (serverTime) => set({ phase: "success", lastSyncedAt: serverTime, lastError: null }),
      setError: (message) => set({ phase: "error", lastError: message }),
    }),
    {
      name: "sync-status",
      storage: createJSONStorage(() => AsyncStorage),
      // Never persist a screen mid-render as "syncing" from a killed app.
      partialize: (state) => ({ lastSyncedAt: state.lastSyncedAt }),
    }
  )
);
