const { getDefaultConfig } = require("expo/metro-config");
const { withTamagui } = require("@tamagui/metro-plugin");
const path = require("path");

const config = getDefaultConfig(__dirname);

// drizzle-kit's generated migrations.js imports .sql files as raw text.
config.resolver.sourceExts.push("sql");

// server/ is a separate NestJS project (its own package.json/node_modules) —
// keep Metro from watching/bundling it entirely.
const serverDir = path.join(__dirname, "server").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
config.resolver.blockList = [new RegExp(`^${serverDir}/.*$`)];

module.exports = withTamagui(config, {
  components: ["tamagui"],
  config: "./src/theme/tamagui.config.ts",
});
