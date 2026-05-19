import { generateOptionId, generateQuestionId } from "./surveyDraftIds";
import type { SurveyDraft } from "./surveyDraft.types";

/**
 * Renseigne les ids manquants (questions / options) avant sérialisation.
 * Les ids techniques ne sont pas édités dans l’interface.
 */
export function normalizeSurveyDraftIds(draft: SurveyDraft): SurveyDraft {
  const questionIdPool = new Set(
    draft.questions.map((q) => q.id.trim()).filter(Boolean),
  );

  const questions = draft.questions.map((q) => {
    let id = q.id.trim();
    if (!id) {
      id = generateQuestionId(questionIdPool);
      questionIdPool.add(id);
    }

    const optionIdPool = new Set(
      q.options.map((o) => o.id.trim()).filter(Boolean),
    );
    const options = q.options.map((o) => {
      let oid = o.id.trim();
      if (!oid) {
        oid = generateOptionId(optionIdPool);
        optionIdPool.add(oid);
      }
      return { ...o, id: oid };
    });

    return { ...q, id, options };
  });

  let startQuestionId = draft.startQuestionId.trim();
  const validIds = new Set(questions.map((q) => q.id.trim()));
  if (!startQuestionId || !validIds.has(startQuestionId)) {
    startQuestionId = questions[0]?.id.trim() ?? "";
  }

  return { startQuestionId, questions };
}
