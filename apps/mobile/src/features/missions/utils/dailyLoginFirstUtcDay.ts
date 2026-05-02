/**
 * daily_login is only allowed from the first UTC calendar day **after** `profiles.created_at`.
 * Matches `submit_mission_completion` guard: `(now() AT TIME ZONE 'UTC')::date > (created_at AT TIME ZONE 'UTC')::date`.
 */
export function isDailyLoginIneligibleFirstUtcDay(
  profileCreatedAt: string | null | undefined,
  referenceUtc: Date = new Date(),
): boolean {
  if (profileCreatedAt == null || String(profileCreatedAt).trim() === "") {
    return false;
  }
  const created = new Date(profileCreatedAt);
  if (Number.isNaN(created.getTime())) {
    return false;
  }
  const signupUtcDay = created.toISOString().slice(0, 10);
  const todayUtcDay = referenceUtc.toISOString().slice(0, 10);
  return todayUtcDay <= signupUtcDay;
}
