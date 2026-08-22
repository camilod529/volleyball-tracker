import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { Button, Input, Label, Spinner, Text, XStack, YStack } from "tamagui";

import { useConnectionStore } from "@/src/sync/connectionStore";
import { runSync } from "@/src/sync/syncEngine";
import { useSyncStatusStore } from "@/src/sync/syncStatusStore";

/**
 * Sync is always user-triggered from here — never automatic/background, so
 * the app stays usable at sites with no signal. See docs/SYNC_PROTOCOL.md.
 */
export function CloudSyncSection() {
  const { t } = useTranslation();
  const apiBaseUrl = useConnectionStore((s) => s.apiBaseUrl);
  const apiKey = useConnectionStore((s) => s.apiKey);
  const setConnection = useConnectionStore((s) => s.setConnection);
  const clearConnection = useConnectionStore((s) => s.clearConnection);

  const phase = useSyncStatusStore((s) => s.phase);
  const lastSyncedAt = useSyncStatusStore((s) => s.lastSyncedAt);
  const lastError = useSyncStatusStore((s) => s.lastError);
  const setSyncing = useSyncStatusStore((s) => s.setSyncing);
  const setSuccess = useSyncStatusStore((s) => s.setSuccess);
  const setError = useSyncStatusStore((s) => s.setError);

  const configured = Boolean(apiBaseUrl && apiKey);
  const [editing, setEditing] = useState(!configured);
  const [urlInput, setUrlInput] = useState(apiBaseUrl ?? "");
  const [keyInput, setKeyInput] = useState(apiKey ?? "");
  const [showApiKey, setShowApiKey] = useState(false);

  const isSyncing = phase === "syncing";

  async function handleSave() {
    const trimmedUrl = urlInput.trim();
    const trimmedKey = keyInput.trim();
    if (!trimmedUrl || !trimmedKey) return;
    await setConnection(trimmedUrl, trimmedKey);
    setEditing(false);
  }

  function handleCancelEdit() {
    setUrlInput(apiBaseUrl ?? "");
    setKeyInput(apiKey ?? "");
    setEditing(false);
  }

  async function handleClear() {
    await clearConnection();
    setUrlInput("");
    setKeyInput("");
    setEditing(true);
  }

  async function handleSyncNow() {
    if (!apiBaseUrl || !apiKey) return;
    setSyncing();
    try {
      const result = await runSync(apiBaseUrl, apiKey, lastSyncedAt);
      setSuccess(result.serverTime);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      Alert.alert(t("settings.syncErrorTitle"), message);
    }
  }

  return (
    <YStack gap="$2">
      <Label>{t("settings.cloudSync")}</Label>
      <Text color="$color10" fontSize="$2">
        {t("settings.cloudSyncDescription")}
      </Text>

      {editing ? (
        <YStack gap="$2">
          <Input
            placeholder={t("settings.apiUrlPlaceholder")}
            value={urlInput}
            onChangeText={setUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <XStack alignItems="center">
            <Input
              flex={1}
              paddingRight="$8"
              placeholder={t("settings.apiKeyPlaceholder")}
              value={keyInput}
              onChangeText={setKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showApiKey}
            />
            <Button
              position="absolute"
              right="$1"
              chromeless
              size="$2"
              circular
              accessibilityLabel={
                showApiKey ? t("settings.hideApiKey") : t("settings.showApiKey")
              }
              icon={<Ionicons name={showApiKey ? "eye-off" : "eye"} size={18} />}
              onPress={() => setShowApiKey((v) => !v)}
            />
          </XStack>
          <XStack gap="$2">
            <Button
              flex={1}
              theme="active"
              disabled={!urlInput.trim() || !keyInput.trim()}
              opacity={!urlInput.trim() || !keyInput.trim() ? 0.5 : 1}
              onPress={handleSave}
            >
              {t("settings.saveConnection")}
            </Button>
            {configured && (
              <Button flex={1} onPress={handleCancelEdit}>
                {t("common.cancel")}
              </Button>
            )}
          </XStack>
        </YStack>
      ) : (
        <YStack gap="$2">
          <Text>{t("settings.connectedTo", { url: apiBaseUrl })}</Text>
          <XStack gap="$2">
            <Button flex={1} onPress={() => setEditing(true)}>
              {t("settings.editConnection")}
            </Button>
            <Button flex={1} onPress={handleClear}>
              {t("settings.clearConnection")}
            </Button>
          </XStack>
          <Button
            theme="active"
            disabled={isSyncing}
            opacity={isSyncing ? 0.5 : 1}
            onPress={handleSyncNow}
            icon={isSyncing ? <Spinner /> : undefined}
          >
            {isSyncing ? t("settings.syncing") : t("settings.syncNow")}
          </Button>
          {lastSyncedAt && (
            <Text color="$color10" fontSize="$2">
              {t("settings.lastSynced", { date: new Date(lastSyncedAt).toLocaleString() })}
            </Text>
          )}
          {phase === "error" && lastError && (
            <Text color="$red10" fontSize="$2">
              {lastError}
            </Text>
          )}
        </YStack>
      )}
    </YStack>
  );
}
