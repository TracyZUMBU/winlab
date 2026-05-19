function randomSuffix(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  }
  return Math.random().toString(36).slice(2, 12);
}

function generateUniqueDraftId(
  prefix: string,
  existing: ReadonlySet<string>,
): string {
  let candidate = `${prefix}${randomSuffix()}`;
  let guard = 0;
  while (existing.has(candidate) && guard < 50) {
    candidate = `${prefix}${randomSuffix()}`;
    guard += 1;
  }
  const base = candidate;
  let counter = 1;
  while (existing.has(candidate)) {
    candidate = `${base}_${counter}`;
    counter += 1;
  }
  return candidate;
}

export function generateQuestionId(existing: ReadonlySet<string>): string {
  return generateUniqueDraftId("q_", existing);
}

export function generateOptionId(existing: ReadonlySet<string>): string {
  return generateUniqueDraftId("opt_", existing);
}
