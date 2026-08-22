import en from "../../locales/en.json";
import es from "../../locales/es.json";
import { ACTION_OUTCOMES, ACTION_TYPES, PLAYER_POSITIONS } from "../domain/outcomes";

function get(obj: unknown, path: string[]): unknown {
  return path.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

describe("locale glossary coverage", () => {
  const locales: Record<string, unknown> = { en, es };

  it("has a translation for every action type, in both languages", () => {
    for (const [lang, resource] of Object.entries(locales)) {
      for (const actionType of ACTION_TYPES) {
        const value = get(resource, ["actions", actionType]);
        expect(typeof value === "string" && value.length > 0).toBe(true);
        if (!(typeof value === "string" && value.length > 0)) {
          throw new Error(`Missing actions.${actionType} in locales/${lang}.json`);
        }
      }
    }
  });

  it("has a translation for every outcome code, in both languages", () => {
    for (const [lang, resource] of Object.entries(locales)) {
      for (const actionType of ACTION_TYPES) {
        for (const outcome of ACTION_OUTCOMES[actionType]) {
          const [, action, code] = outcome.labelKey.split(".");
          const value = get(resource, ["outcomes", action, code]);
          if (!(typeof value === "string" && value.length > 0)) {
            throw new Error(`Missing ${outcome.labelKey} in locales/${lang}.json`);
          }
        }
      }
    }
  });

  it("has a translation for every player position, in both languages", () => {
    for (const [lang, resource] of Object.entries(locales)) {
      for (const position of PLAYER_POSITIONS) {
        const value = get(resource, ["positions", position]);
        if (!(typeof value === "string" && value.length > 0)) {
          throw new Error(`Missing positions.${position} in locales/${lang}.json`);
        }
      }
    }
  });
});
