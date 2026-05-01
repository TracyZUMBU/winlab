/**
 * Contract for `proof_data` on `mission_completions` when `missions.mission_type === 'survey'`.
 * The RPC `submit_mission_completion` already persists `p_proof_data` into that column.
 *
 * `answers` is ordered: each step must match the question reached when walking from
 * `metadata.survey.startQuestionId` using branching rules. That ordering makes server
 * validation a straight sequential loop (no extra key-set reconciliation).
 *
 * `questionId` values come from `missions.metadata.survey.questions[].id`.
 * - `text` / `single_choice`: `value` is a string (prefer option `id` for single_choice).
 * - `multi_choice`: `value` is string[] (option ids).
 */
export type MissionSurveyAnswerValue = string | string[];

export type MissionSurveyAnswerStep = {
  questionId: string;
  value: MissionSurveyAnswerValue;
};

export type MissionSurveyProofPayload = {
  /** Reserved for future backoffice survey definitions; may be `""` until used. */
  surveyId: string;
  /** Ordered path through the survey; length and ids must match server replay from start. */
  answers: MissionSurveyAnswerStep[];
};
