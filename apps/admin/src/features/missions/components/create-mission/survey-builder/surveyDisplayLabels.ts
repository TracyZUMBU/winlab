import type { SurveyDraft } from "./surveyDraft.types";

const MAX_SNIPPET = 44;

export function truncateSurveySnippet(text: string): string {
  const t = text.trim();
  if (!t) return "";
  return t.length > MAX_SNIPPET ? `${t.slice(0, MAX_SNIPPET - 1)}…` : t;
}

/** Libellé menu pour une question : référence visuelle uniquement (les ids restent en interne). */
export function formatQuestionMenuLabel(
  draft: SurveyDraft,
  questionId: string,
): string {
  const idx = draft.questions.findIndex(
    (q) => q.id.trim() === questionId.trim(),
  );
  if (idx < 0) return questionId;
  const snip = truncateSurveySnippet(draft.questions[idx]?.label ?? "");
  return snip ? `Question ${idx + 1} — ${snip}` : `Question ${idx + 1}`;
}

export function buildStartQuestionTargets(
  draft: SurveyDraft,
): { value: string; label: string }[] {
  return draft.questions
    .filter((q) => q.id.trim() !== "")
    .map((q) => ({
      value: q.id.trim(),
      label: formatQuestionMenuLabel(draft, q.id.trim()),
    }));
}

/** Cibles « ensuite » : autres questions que `excludeQuestionId`, avec libellés visuels. */
export function buildPeerQuestionTargets(
  draft: SurveyDraft,
  excludeQuestionId: string,
): { value: string; label: string }[] {
  const ex = excludeQuestionId.trim();
  return draft.questions
    .filter((q) => q.id.trim() !== "" && q.id.trim() !== ex)
    .map((q) => ({
      value: q.id.trim(),
      label: formatQuestionMenuLabel(draft, q.id.trim()),
    }));
}
