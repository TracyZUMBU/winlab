import type { SurveyNextTarget } from "./surveyDraft.types";

type SurveyNextSelectProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  targets: readonly SurveyNextTarget[];
};

export function SurveyNextSelect({
  id,
  label,
  value,
  onChange,
  targets,
}: SurveyNextSelectProps) {
  const hasValue = value.trim() !== "";
  const valueKnown =
    !hasValue || targets.some((t) => t.value === value.trim());
  const selectValue = !valueKnown
    ? "__end__"
    : hasValue
      ? value.trim()
      : "__end__";

  return (
    <div className="survey-builder__next">
      <label className="mission-create-form__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="mission-create-form__control"
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "__end__" ? "" : v);
        }}
      >
        <option value="__end__">Fin du sondage</option>
        {targets.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
