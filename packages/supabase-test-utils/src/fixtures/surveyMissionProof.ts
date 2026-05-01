import type { Json } from "../../../../apps/mobile/src/types/json";

/** Minimal linear survey (single `text` terminal question) for RPC integration tests. */
export const testLinearSurveyMetadata = (): Json =>
  ({
    survey: {
      startQuestionId: "q1",
      questions: [
        {
          id: "q1",
          label: "Réponse test",
          type: "text",
          nextQuestionId: null,
        },
      ],
    },
  }) as Json;

export const testLinearSurveyProofData = (): Json =>
  ({
    surveyId: "",
    answers: [{ questionId: "q1", value: "integration-test answer" }],
  }) as Json;
