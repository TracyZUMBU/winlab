function randomSuffix(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  }
  return Math.random().toString(36).slice(2, 12);
}

export function generateQuestionId(existing: ReadonlySet<string>): string {
  let candidate = `q_${randomSuffix()}`;
  let guard = 0;
  while (existing.has(candidate) && guard < 50) {
    candidate = `q_${randomSuffix()}`;
    guard += 1;
  }
  return candidate;
}

export function generateOptionId(existing: ReadonlySet<string>): string {
  let candidate = `opt_${randomSuffix()}`;
  let guard = 0;
  while (existing.has(candidate) && guard < 50) {
    candidate = `opt_${randomSuffix()}`;
    guard += 1;
  }
  return candidate;
}
