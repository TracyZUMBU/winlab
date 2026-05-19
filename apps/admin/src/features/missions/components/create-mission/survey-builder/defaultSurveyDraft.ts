import { generateQuestionId } from "./surveyDraftIds";
import type { SurveyDraft } from "./surveyDraft.types";

export function createDefaultSurveyDraft(): SurveyDraft {
  const id = generateQuestionId(new Set());
  return {
    startQuestionId: id,
    questions: [
      {
        id,
        label: "Votre question",
        type: "text",
        options: [],
        nextQuestionId: "",
      },
    ],
  };
}
