module.exports = {
  preset: "jest-expo",
  // server/ is a separate NestJS project with its own Jest setup — never
  // let this project's jest-expo config pick up its test files.
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/server/"],
  // jest-expo's default pattern doesn't allow-list `uuid`, which ships ESM
  // in the installed version; widen just that one pattern rather than
  // replacing the whole (carefully tuned) preset list.
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|uuid))",
    "/node_modules/react-native-reanimated/plugin/",
    "/node_modules/@react-native/babel-preset/",
  ],
};
