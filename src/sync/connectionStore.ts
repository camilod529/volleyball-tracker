import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const API_URL_KEY = "sync_api_base_url";
const API_KEY_KEY = "sync_api_key";
const CLEARED_KEY = "sync_explicitly_cleared";

/**
 * Compiled into the bundle at build time (see .env.example) — the app's
 * default cloud connection. Not secret: it's the shared static API key
 * documented in docs/SYNC_PROTOCOL.md, not a database credential.
 */
const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? null;
const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? null;

interface ConnectionState {
  apiBaseUrl: string | null;
  apiKey: string | null;
  /** True once the initial SecureStore read has completed — avoids a flash of "not configured" on cold boot. */
  loaded: boolean;
  load: () => Promise<void>;
  setConnection: (apiBaseUrl: string, apiKey: string) => Promise<void>;
  /** "Possible to have none" — clears the connection entirely, back to fully local. */
  clearConnection: () => Promise<void>;
}

/**
 * API base URL + key are real credentials, not preferences — stored via
 * expo-secure-store (Keychain/Keystore), not AsyncStorage. Zustand here is
 * just a reactive in-memory mirror so screens re-render on change; it's
 * never the source of truth by itself.
 *
 * "One as a default, but possible to have none": if nothing has ever been
 * stored, load() falls back to the compiled-in default connection (if any).
 * clearConnection() writes an explicit tombstone so that fallback doesn't
 * resurrect itself on the next cold start.
 */
export const useConnectionStore = create<ConnectionState>((set) => ({
  apiBaseUrl: null,
  apiKey: null,
  loaded: false,

  async load() {
    const [apiBaseUrl, apiKey, clearedFlag] = await Promise.all([
      SecureStore.getItemAsync(API_URL_KEY),
      SecureStore.getItemAsync(API_KEY_KEY),
      SecureStore.getItemAsync(CLEARED_KEY),
    ]);

    if (apiBaseUrl && apiKey) {
      set({ apiBaseUrl, apiKey, loaded: true });
      return;
    }

    if (!clearedFlag && DEFAULT_API_BASE_URL && DEFAULT_API_KEY) {
      set({ apiBaseUrl: DEFAULT_API_BASE_URL, apiKey: DEFAULT_API_KEY, loaded: true });
      return;
    }

    set({ apiBaseUrl: null, apiKey: null, loaded: true });
  },

  async setConnection(apiBaseUrl, apiKey) {
    await Promise.all([
      SecureStore.setItemAsync(API_URL_KEY, apiBaseUrl),
      SecureStore.setItemAsync(API_KEY_KEY, apiKey),
      SecureStore.deleteItemAsync(CLEARED_KEY),
    ]);
    set({ apiBaseUrl, apiKey });
  },

  async clearConnection() {
    await Promise.all([
      SecureStore.deleteItemAsync(API_URL_KEY),
      SecureStore.deleteItemAsync(API_KEY_KEY),
      SecureStore.setItemAsync(CLEARED_KEY, "true"),
    ]);
    set({ apiBaseUrl: null, apiKey: null });
  },
}));
