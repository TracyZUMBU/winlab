import type { MissionSurveyAnswerStep } from "../types";

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

  if (!questionsById[startQuestionId]) return null;
  return { startQuestionId, questionsById };
};

const getNextQuestionId = (
  question: SurveyQuestion,
  value: string | string[],
): string | null => {
  if (question.type === "single_choice") {
    const selected = question.options.find(
      (option) => option.id === value || option.label === value,
    );
    if (selected?.nextQuestionId) return selected.nextQuestionId;
  }
  return question.nextQuestionId;
};

export const getCurrentSurveyQuestion = (
  survey: SurveyDefinition,
  answers: MissionSurveyAnswerStep[],
): SurveyQuestion | null => {
  let currentId: string | null = survey.startQuestionId;
  for (const step of answers) {
    if (!currentId || step.questionId !== currentId) return null;
    const question = survey.questionsById[currentId];
    if (!question) return null;
    currentId = getNextQuestionId(question, step.value);
  }
  if (!currentId) return null;
  return survey.questionsById[currentId] ?? null;
};
