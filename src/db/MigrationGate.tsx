import { PropsWithChildren } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import { db } from "./client";
import migrations from "./migrations/migrations";

/**
 * Blocks rendering until pending Drizzle migrations have run against the
 * on-device SQLite database. Renders a loading state while migrating and a
 * plain error message if a migration fails, since there is no server to
 * fall back to for locally stored match data.
 */
export function MigrationGate({ children }: PropsWithChildren) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text>Database migration failed: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}
