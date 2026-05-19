import type { SurveyQuestionType } from "../../../lib/parseSurveyDefinition";
import { generateOptionId } from "./surveyDraftIds";
import type { SurveyDraftQuestion } from "./surveyDraft.types";
import { SurveyNextSelect } from "./SurveyNextSelect";

type SurveyNextTarget = { value: string; label: string };

type SurveyQuestionCardProps = {
  index: number;
  question: SurveyDraftQuestion;
  peerTargets: readonly SurveyNextTarget[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  onChange: (next: SurveyDraftQuestion) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddOption: () => void;
  onRemoveOption: (optionIndex: number) => void;
  idPrefix: string;
};

const TYPE_OPTIONS: { value: SurveyQuestionType; label: string }[] = [
  { value: "text", label: "Texte libre" },
  { value: "single_choice", label: "Choix unique (branches)" },
  { value: "multi_choice", label: "Choix multiples" },
];

export function SurveyQuestionCard({
  index,
  question,
  peerTargets,
  canMoveUp,
  canMoveDown,
  canRemove,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddOption,
  onRemoveOption,
  idPrefix,
}: SurveyQuestionCardProps) {
  const base = `${idPrefix}-q${index}`;

  const setType = (type: SurveyQuestionType) => {
    if (type === "text") {
      onChange({
        ...question,
        type: "text",
        options: [],
      });
      return;
    }
    let nextOpts = question.options;
    if (nextOpts.length === 0) {
      const used = new Set<string>();
      const a = generateOptionId(used);
      used.add(a);
      const b = generateOptionId(used);
      used.add(b);
      nextOpts = [
        { id: a, label: "", nextQuestionId: "" },
        { id: b, label: "", nextQuestionId: "" },
      ];
    } else {
      const used = new Set(
        nextOpts.map((o) => o.id.trim()).filter(Boolean),
      );
      nextOpts = nextOpts.map((o) => {
        if (o.id.trim()) return o;
        const id = generateOptionId(used);
        used.add(id);
        return { ...o, id };
      });
    }
    onChange({
      ...question,
      type,
      options: nextOpts,
    });
  };

  const updateOption = (
    optIndex: number,
    patch: Partial<(typeof question.options)[number]>,
  ) => {
    onChange({
      ...question,
      options: question.options.map((o, i) =>
        i === optIndex ? { ...o, ...patch } : o,
      ),
    });
  };

  return (
    <article className="survey-builder__card">
      <header className="survey-builder__card-head">
        <h3 className="survey-builder__card-title">Question {index + 1}</h3>
        <div className="survey-builder__card-actions">
          <button
            type="button"
            className="survey-builder__icon-btn"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label="Monter la question"
          >
            ↑
          </button>
          <button
            type="button"
            className="survey-builder__icon-btn"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label="Descendre la question"
          >
            ↓
          </button>
          <button
            type="button"
            className="survey-builder__icon-btn survey-builder__icon-btn--danger"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label="Supprimer la question"
          >
            Retirer
          </button>
        </div>
      </header>

      <div className="mission-create-form__field mission-create-form__field--full">
        <label className="mission-create-form__label" htmlFor={`${base}-type`}>
          Type
        </label>
        <select
          id={`${base}-type`}
          className="mission-create-form__control"
          value={question.type}
          onChange={(e) => setType(e.target.value as SurveyQuestionType)}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mission-create-form__field mission-create-form__field--full">
        <label className="mission-create-form__label" htmlFor={`${base}-label`}>
          Libellé
        </label>
        <textarea
          id={`${base}-label`}
          className="mission-create-form__textarea"
          rows={2}
          value={question.label}
          onChange={(e) => onChange({ ...question, label: e.target.value })}
        />
      </div>

      {question.type === "text" && (
        <SurveyNextSelect
          id={`${base}-next`}
          label="Ensuite"
          value={question.nextQuestionId}
          onChange={(v) => onChange({ ...question, nextQuestionId: v })}
          targets={peerTargets}
        />
      )}

      {question.type !== "text" && (
        <>
          <div className="survey-builder__options-head">
            <span className="mission-create-form__label">Options</span>
            <button
              type="button"
              className="survey-builder__link-btn"
              onClick={onAddOption}
            >
              + Ajouter une option
            </button>
          </div>
          <ul className="survey-builder__option-list">
            {question.options.map((opt, oi) => (
              <li
                key={opt.id.trim() || `opt-row-${index}-${oi}`}
                className="survey-builder__option-row"
              >
                <div className="survey-builder__option-row-main">
                  <span className="survey-builder__option-badge">
                    Option {oi + 1}
                  </span>
                  <div className="mission-create-form__field mission-create-form__field--full">
                    <label
                      className="mission-create-form__label"
                      htmlFor={`${base}-opt-${oi}-lab`}
                    >
                      Libellé
                    </label>
                    <input
                      id={`${base}-opt-${oi}-lab`}
                      className="mission-create-form__control"
                      type="text"
                      value={opt.label}
                      onChange={(e) =>
                        updateOption(oi, { label: e.target.value })
                      }
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="button"
                    className="survey-builder__icon-btn survey-builder__icon-btn--danger survey-builder__option-remove"
                    onClick={() => onRemoveOption(oi)}
                    disabled={question.options.length <= 1}
                    aria-label="Supprimer l’option"
                  >
                    Retirer
                  </button>
                </div>
                {question.type === "single_choice" && (
                  <SurveyNextSelect
                    id={`${base}-opt-${oi}-next`}
                    label="Suite si cette option est choisie"
                    value={opt.nextQuestionId}
                    onChange={(v) => updateOption(oi, { nextQuestionId: v })}
                    targets={peerTargets}
                  />
                )}
              </li>
            ))}
          </ul>

          {question.type === "single_choice" && (
            <SurveyNextSelect
              id={`${base}-qnext`}
              label="Suite par défaut (si aucune branche d’option)"
              value={question.nextQuestionId}
              onChange={(v) => onChange({ ...question, nextQuestionId: v })}
              targets={peerTargets}
            />
          )}

          {question.type === "multi_choice" && (
            <SurveyNextSelect
              id={`${base}-qnext-m`}
              label="Ensuite (après cette question)"
              value={question.nextQuestionId}
              onChange={(v) => onChange({ ...question, nextQuestionId: v })}
              targets={peerTargets}
            />
          )}
        </>
      )}
    </article>
  );
}
