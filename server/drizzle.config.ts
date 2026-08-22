import "dotenv/config";
import type { Config } from "drizzle-kit";

import { resolveDbConnectionConfig } from "./src/db/connection-config";

const config = resolveDbConnectionConfig((key) => process.env[key]);

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "mysql",
  dbCredentials: typeof config === "string" ? { url: config } : config,
} satisfies Config;
