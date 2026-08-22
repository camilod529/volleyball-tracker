const { getDefaultConfig } = require("expo/metro-config");
const { withTamagui } = require("@tamagui/metro-plugin");

const config = getDefaultConfig(__dirname);

// drizzle-kit's generated migrations.js imports .sql files as raw text.
config.resolver.sourceExts.push("sql");

module.exports = withTamagui(config, {
  components: ["tamagui"],
  config: "./src/theme/tamagui.config.ts",
});
