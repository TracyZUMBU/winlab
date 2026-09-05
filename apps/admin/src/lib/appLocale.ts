export type AppLocale = "fr" | "en";

export function getAppLocale(): AppLocale {
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang?.slice(0, 2).toLowerCase();
    if (htmlLang === "en") return "en";
    if (htmlLang === "fr") return "fr";
  }
  if (typeof navigator !== "undefined") {
    const nav = navigator.language?.slice(0, 2).toLowerCase();
    if (nav === "en") return "en";
  }
  return "fr";
}
