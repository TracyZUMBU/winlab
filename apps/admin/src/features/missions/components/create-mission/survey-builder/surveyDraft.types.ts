import type { SurveyQuestionType } from "../../../lib/parseSurveyDefinition";

export type SurveyDraftOption = {
  id: string;
  label: string;
  /** ID de la question suivante, ou chaîne vide pour terminer le sondage. */
  nextQuestionId: string;
};

export type SurveyDraftQuestion = {
  id: string;
  label: string;
  type: SurveyQuestionType;
  options: SurveyDraftOption[];
  /**
   * Suite après cette question (texte / multi).
   * Pour `single_choice`, suite par défaut si aucune option ne redirige.
   */
  nextQuestionId: string;
};

export type SurveyDraft = {
  startQuestionId: string;
  questions: SurveyDraftQuestion[];
};
