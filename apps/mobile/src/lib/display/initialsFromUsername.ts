import i18n from "@/src/i18n";
export function initialsFromUsername(username: string | null): string {
  const t = (username ?? "").trim();
  if (!t) return i18n.t("display.userInitials.fallback");
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}
