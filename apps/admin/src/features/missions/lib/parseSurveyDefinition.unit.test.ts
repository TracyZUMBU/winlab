import { parseSurveyDefinition } from "./parseSurveyDefinition";

const validSurvey = {
  survey: {
    startQuestionId: "q1",
    questions: [
      {
        id: "q1",
        label: "Question 1",
        type: "single_choice",
        options: [{ id: "o1", label: "Option 1", nextQuestionId: "q2" }],
        nextQuestionId: null,
      },
      {
        id: "q2",
        label: "Question 2",
        type: "text",
        options: [],
        nextQuestionId: null,
      },
    ],
  },
};

describe("parseSurveyDefinition", () => {
  it("accepts a valid survey definition", () => {
    expect(parseSurveyDefinition(validSurvey)).not.toBeNull();
  });

  it("rejects duplicate question ids", () => {
    const result = parseSurveyDefinition({
      survey: {
        startQuestionId: "q1",
        questions: [
          { id: "q1", label: "A", type: "text", options: [] },
          { id: "q1", label: "B", type: "text", options: [] },
        ],
      },
    });
    expect(result).toBeNull();
  });

  it("rejects dangling question.nextQuestionId", () => {
    const result = parseSurveyDefinition({
      survey: {
        startQuestionId: "q1",
        questions: [
          {
            id: "q1",
            label: "Question 1",
            type: "text",
            options: [],
            nextQuestionId: "missing",
          },
        ],
      },
    });
    expect(result).toBeNull();
  });

  it("rejects dangling option.nextQuestionId", () => {
    const result = parseSurveyDefinition({
      survey: {
        startQuestionId: "q1",
        questions: [
          {
            id: "q1",
            label: "Question 1",
            type: "single_choice",
            options: [{ id: "o1", label: "Option 1", nextQuestionId: "missing" }],
          },
        ],
      },
    });
    expect(result).toBeNull();
  });
});
