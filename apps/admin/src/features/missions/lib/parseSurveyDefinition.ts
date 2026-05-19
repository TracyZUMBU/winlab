/**
 * Aligné sur `apps/mobile/src/features/missions/survey/surveyDefinition.ts` :
 * valider la forme stockée `metadata.survey` avant création / enregistrement admin.
 */

export type SurveyQuestionType = "text" | "single_choice" | "multi_choice";

export type SurveyOption = {
  id: string;
  label: string;
  nextQuestionId: string | null;
};

export type SurveyQuestion = {
  id: string;
  label: string;
  type: SurveyQuestionType;
  options: SurveyOption[];
  nextQuestionId: string | null;
};

export type SurveyDefinition = {
  startQuestionId: string;
  questionsById: Record<string, SurveyQuestion>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const parseSurveyDefinition = (metadata: unknown): SurveyDefinition | null => {
  if (!isRecord(metadata)) return null;
  const survey = metadata.survey;
  if (!isRecord(survey)) return null;

  const startQuestionId = asNonEmptyString(survey.startQuestionId);
  const questions = survey.questions;
  if (!startQuestionId || !Array.isArray(questions) || questions.length === 0) {
    return null;
  }

  const questionsById: Record<string, SurveyQuestion> = {};
  for (const rawQuestion of questions) {
    if (!isRecord(rawQuestion)) return null;
    const id = asNonEmptyString(rawQuestion.id);
    const label = asNonEmptyString(rawQuestion.label);
    const type = rawQuestion.type;
    if (!id || !label) return null;
    if (questionsById[id]) return null;
    if (type !== "text" && type !== "single_choice" && type !== "multi_choice") {
      return null;
    }

    const optionsRaw = Array.isArray(rawQuestion.options) ? rawQuestion.options : [];
    const options: SurveyOption[] = [];
    for (const rawOption of optionsRaw) {
      if (!isRecord(rawOption)) return null;
      const optionId = asNonEmptyString(rawOption.id);
      const optionLabel = asNonEmptyString(rawOption.label);
      if (!optionId || !optionLabel) return null;
      options.push({
        id: optionId,
        label: optionLabel,
        nextQuestionId: asNonEmptyString(rawOption.nextQuestionId),
      });
    }

    if (type !== "text" && options.length === 0) return null;

    questionsById[id] = {
      id,
      label,
      type,
      options,
      nextQuestionId: asNonEmptyString(rawQuestion.nextQuestionId),
    };
  }

  for (const question of Object.values(questionsById)) {
    if (question.nextQuestionId && !questionsById[question.nextQuestionId]) {
      return null;
    }
    for (const option of question.options) {
      if (option.nextQuestionId && !questionsById[option.nextQuestionId]) {
        return null;
      }
    }
  }

  if (!questionsById[startQuestionId]) return null;
  return { startQuestionId, questionsById };
};
