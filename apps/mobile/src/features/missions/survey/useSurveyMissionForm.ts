import { useCallback, useEffect, useMemo, useState } from "react";

import type { MissionSurveyAnswerStep } from "../types";
import {
  getCurrentSurveyQuestion,
  parseSurveyDefinition,
  type SurveyDefinition,
} from "./surveyDefinition";

export type SurveyPendingAnswer =
  | { type: "text"; value: string }
  | { type: "single_choice"; value: string | null }
  | { type: "multi_choice"; value: string[] };

export type CommitSurveyAnswerResult =
  | { ok: true }
  | { ok: false; reason: "missing_answer" | "invalid_state" };

const getDefaultPendingAnswerForQuestion = (
  question: ReturnType<typeof getCurrentSurveyQuestion>,
): SurveyPendingAnswer => {
  if (!question) return { type: "text", value: "" };
  if (question.type === "text") return { type: "text", value: "" };
  if (question.type === "single_choice") {
    return { type: "single_choice", value: null };
  }
  return { type: "multi_choice", value: [] };
};

export function useSurveyMissionForm(metadata: unknown) {
  const surveyDefinition = useMemo<SurveyDefinition | null>(
    () => parseSurveyDefinition(metadata),
    [metadata],
  );
  const [answers, setAnswers] = useState<MissionSurveyAnswerStep[]>([]);
  const [pendingAnswer, setPendingAnswer] = useState<SurveyPendingAnswer>({
    type: "text",
    value: "",
  });

  const currentQuestion = useMemo(() => {
    if (!surveyDefinition) return null;
    return getCurrentSurveyQuestion(surveyDefinition, answers);
  }, [answers, surveyDefinition]);

  const isCompleted = Boolean(surveyDefinition) && !currentQuestion;

  const commitCurrentAnswer = useCallback((): CommitSurveyAnswerResult => {
    if (!currentQuestion || !surveyDefinition) {
      return { ok: false, reason: "invalid_state" };
    }

    let value: string | string[] | null = null;
    if (currentQuestion.type === "text") {
      if (pendingAnswer.type !== "text") return { ok: false, reason: "invalid_state" };
      const trimmed = pendingAnswer.value.trim();
      value = trimmed.length > 0 ? trimmed : null;
    } else if (currentQuestion.type === "single_choice") {
      if (pendingAnswer.type !== "single_choice") {
        return { ok: false, reason: "invalid_state" };
      }
      value = pendingAnswer.value;
    } else {
      if (pendingAnswer.type !== "multi_choice") {
        return { ok: false, reason: "invalid_state" };
      }
      value = pendingAnswer.value.length > 0 ? pendingAnswer.value : null;
    }

    if (!value) return { ok: false, reason: "missing_answer" };

    const nextAnswers = [...answers, { questionId: currentQuestion.id, value }];
    setAnswers(nextAnswers);
    const nextQuestion = getCurrentSurveyQuestion(surveyDefinition, nextAnswers);
    setPendingAnswer(getDefaultPendingAnswerForQuestion(nextQuestion));
    return { ok: true };
  }, [answers, currentQuestion, pendingAnswer, surveyDefinition]);

  const back = useCallback(() => {
    if (!surveyDefinition || answers.length === 0) return;
    const previousStep = answers[answers.length - 1];
    if (!previousStep) return;

    const previousQuestion = surveyDefinition.questionsById[previousStep.questionId];
    const nextAnswers = answers.slice(0, -1);
    setAnswers(nextAnswers);

    if (Array.isArray(previousStep.value)) {
      setPendingAnswer({ type: "multi_choice", value: previousStep.value });
      return;
    }

    if (previousQuestion?.type === "single_choice") {
      setPendingAnswer({ type: "single_choice", value: previousStep.value });
      return;
    }
    setPendingAnswer({ type: "text", value: previousStep.value });
  }, [answers, surveyDefinition]);

  useEffect(() => {
    setAnswers([]);
    setPendingAnswer({ type: "text", value: "" });
  }, [surveyDefinition?.startQuestionId]);

  return {
    surveyDefinition,
    answers,
    currentQuestion,
    isCompleted,
    pendingAnswer,
    setPendingAnswer,
    commitCurrentAnswer,
    back,
  };
}
