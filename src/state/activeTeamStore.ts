import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ActiveTeamState {
  activeTeamId: string | null;
  setActiveTeamId: (teamId: string | null) => void;
}

export const useActiveTeamStore = create<ActiveTeamState>()(
  persist(
    (set) => ({
      activeTeamId: null,
      setActiveTeamId: (teamId) => set({ activeTeamId: teamId }),
    }),
    {
      name: "active-team",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
