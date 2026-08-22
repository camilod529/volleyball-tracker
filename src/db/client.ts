import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";

import * as schema from "./schema";

const sqliteDb = SQLite.openDatabaseSync("volleyball-tracker.db", { enableChangeListener: true });

export const db = drizzle(sqliteDb, { schema });

export { sqliteDb };
