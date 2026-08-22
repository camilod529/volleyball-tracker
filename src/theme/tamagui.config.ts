import { createTamagui } from "tamagui";
import { config as defaultConfig } from "@tamagui/config/v3";

const config = createTamagui(defaultConfig);

export type AppTamaguiConfig = typeof config;

declare module "tamagui" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- required shape for Tamagui's module augmentation
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default config;
