/**
 * Dates ISO en libellé court pour l’admin (fuseau local du navigateur).
 */
export function formatDateTimeForDev(iso: string | null): string {
  if (iso == null || iso === "") {
    return "—";
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
