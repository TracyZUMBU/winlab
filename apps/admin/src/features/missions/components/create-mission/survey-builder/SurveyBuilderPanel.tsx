import { useId } from "react";

import type { SurveyDraft, SurveyDraftQuestion } from "./surveyDraft.types";
import { buildPeerQuestionTargets, buildStartQuestionTargets } from "./surveyDisplayLabels";
import { generateOptionId, generateQuestionId } from "./surveyDraftIds";
import { SurveyQuestionCard } from "./SurveyQuestionCard";

type SurveyBuilderPanelProps = {
  draft: SurveyDraft;
  onDraftChange: (draft: SurveyDraft) => void;
};

function stripRefsToId(draft: SurveyDraft, removedId: string): SurveyDraft {
  const cleanNext = (s: string) => (s.trim() === removedId ? "" : s);
  return {
    ...draft,
    startQuestionId: cleanNext(draft.startQuestionId),
    questions: draft.questions.map((q) => ({
      ...q,
      nextQuestionId: cleanNext(q.nextQuestionId),
      options: q.options.map((o) => ({
        ...o,
        nextQuestionId: cleanNext(o.nextQuestionId),
      })),
    })),
  };
}

export function SurveyBuilderPanel({
  draft,
  onDraftChange,
}: SurveyBuilderPanelProps) {
  const idPrefix = useId().replace(/:/g, "");
  const allIds = draft.questions.map((q) => q.id.trim()).filter(Boolean);

  const replaceQuestions = (questions: SurveyDraftQuestion[]) => {
    onDraftChange({ ...draft, questions });
  };

  const setQuestion = (index: number, next: SurveyDraftQuestion) => {
    replaceQuestions(
      draft.questions.map((q, i) => (i === index ? next : q)),
    );
  };

  const addQuestion = () => {
    const idSet = new Set(
      draft.questions.map((q) => q.id.trim()).filter(Boolean),
    );
    const newId = generateQuestionId(idSet);
    const newQ: SurveyDraftQuestion = {
      id: newId,
      label: "",
      type: "text",
      options: [],
      nextQuestionId: "",
    };

    const updated = [...draft.questions];
    const prevIndex = updated.length - 1;
    if (prevIndex >= 0) {
      const prev = updated[prevIndex];
      if (prev && prev.nextQuestionId.trim() === "") {
        updated[prevIndex] = { ...prev, nextQuestionId: newId };
      }
    }

    const nextQuestions = [...updated, newQ];
    let start = draft.startQuestionId.trim();
    if (start === "" && nextQuestions.length > 0) {
      start = nextQuestions[0].id.trim();
    }
    onDraftChange({ startQuestionId: start, questions: nextQuestions });
  };

  const removeQuestion = (index: number) => {
    const removedId = draft.questions[index]?.id.trim() ?? "";
    const filtered = draft.questions.filter((_, i) => i !== index);
    let nextDraft: SurveyDraft = { ...draft, questions: filtered };
    if (removedId) {
      nextDraft = stripRefsToId(nextDraft, removedId);
    }
    let start = nextDraft.startQuestionId.trim();
    if (start === "" || !filtered.some((q) => q.id.trim() === start)) {
      start = filtered[0]?.id.trim() ?? "";
    }
    onDraftChange({ ...nextDraft, startQuestionId: start });
  };

  const moveQuestion = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= draft.questions.length) return;
    const copy = [...draft.questions];
    const a = copy[index];
    const b = copy[j];
    if (!a || !b) return;
    copy[index] = b;
    copy[j] = a;
    onDraftChange({ ...draft, questions: copy });
  };

  const addOption = (qIndex: number) => {
    const q = draft.questions[qIndex];
    if (!q) return;
    const optIds = new Set(q.options.map((o) => o.id.trim()).filter(Boolean));
    const oid = generateOptionId(optIds);
    setQuestion(qIndex, {
      ...q,
      options: [...q.options, { id: oid, label: "", nextQuestionId: "" }],
    });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const q = draft.questions[qIndex];
    if (!q || q.options.length <= 1) return;
    setQuestion(qIndex, {
      ...q,
      options: q.options.filter((_, i) => i !== oIndex),
    });
  };

  const resolvedStart =
    allIds.length === 0
      ? ""
      : allIds.includes(draft.startQuestionId.trim())
        ? draft.startQuestionId.trim()
        : (allIds[0] ?? "");

  const startTargets = buildStartQuestionTargets(draft);

  return (
    <div className="survey-builder">
      <div className="survey-builder__toolbar">
        <div className="mission-create-form__field mission-create-form__field--full">
          <label
            className="mission-create-form__label"
            htmlFor={`${idPrefix}-start`}
          >
            Question de départ
          </label>
          {allIds.length === 0 ? (
            <p className="survey-builder__empty">
              Ajoutez une question pour définir le point d’entrée du sondage.
            </p>
          ) : (
            <select
              id={`${idPrefix}-start`}
              className="mission-create-form__control"
              value={resolvedStart}
              onChange={(e) =>
                onDraftChange({ ...draft, startQuestionId: e.target.value })
              }
            >
              {startTargets.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          type="button"
          className="survey-builder__btn-primary"
          onClick={addQuestion}
        >
          + Ajouter une question
        </button>
      </div>

      <div className="survey-builder__list">
        {draft.questions.map((q, index) => (
          <SurveyQuestionCard
            key={q.id.trim() || `q-${index}`}
            index={index}
            question={q}
            peerTargets={buildPeerQuestionTargets(draft, q.id)}
            canMoveUp={index > 0}
            canMoveDown={index < draft.questions.length - 1}
            canRemove={draft.questions.length > 1}
            onChange={(next) => setQuestion(index, next)}
            onRemove={() => removeQuestion(index)}
            onMoveUp={() => moveQuestion(index, -1)}
            onMoveDown={() => moveQuestion(index, 1)}
            onAddOption={() => addOption(index)}
            onRemoveOption={(oi) => removeOption(index, oi)}
            idPrefix={idPrefix}
          />
        ))}
      </div>
    </div>
  );
}
