import i18n from "./index";

describe("i18n scaffolding", () => {
  it("registers en and es resource bundles", () => {
    expect(i18n.hasResourceBundle("en", "translation")).toBe(true);
    expect(i18n.hasResourceBundle("es", "translation")).toBe(true);
  });

  it("translates a shared key in both languages", () => {
    expect(i18n.t("tabs.teams", { lng: "en" })).toBe("Teams");
    expect(i18n.t("tabs.teams", { lng: "es" })).toBe("Equipos");
  });
});
