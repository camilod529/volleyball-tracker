import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemePreference = "system" | "light" | "dark";
export type LanguagePreference = "system" | "en" | "es";

interface SettingsState {
  themePreference: ThemePreference;
  languagePreference: LanguagePreference;
  /** False until AsyncStorage's persisted value has loaded — the theme
   * default ("system") would otherwise briefly override a saved light/dark
   * preference on every cold start, flashing the wrong theme before this
   * resolves. Callers should delay rendering themed content until true. */
  hasHydrated: boolean;
  setThemePreference: (preference: ThemePreference) => void;
  setLanguagePreference: (preference: LanguagePreference) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themePreference: "system",
      languagePreference: "system",
      hasHydrated: false,
      setThemePreference: (themePreference) => set({ themePreference }),
      setLanguagePreference: (languagePreference) => set({ languagePreference }),
    }),
    {
      name: "settings",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useSettingsStore.setState({ hasHydrated: true });
      },
      partialize: (state) => ({
        themePreference: state.themePreference,
        languagePreference: state.languagePreference,
      }),
    }
  )
);
