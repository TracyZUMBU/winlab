import type { SurveyDraft } from "./survey-builder/surveyDraft.types";
import { SurveyBuilderPanel } from "./survey-builder/SurveyBuilderPanel";

type SurveyMissionMetadataFieldsProps = {
  draft: SurveyDraft;
  onDraftChange: (draft: SurveyDraft) => void;
};

export function SurveyMissionMetadataFields({
  draft,
  onDraftChange,
}: SurveyMissionMetadataFieldsProps) {
  return (
    <div className="mission-create-form__field mission-create-form__field--full">
      <span className="mission-create-form__label">Configuration du sondage</span>
      <p className="mission-create-form__hint">
        Définissez les questions, les options (choix) et les enchaînements. Les
        références « Question N » et les listes « Ensuite » sont uniquement
        visuelles : les identifiants techniques sont générés et enregistrés
        automatiquement pour le parcours et les preuves côté app mobile.
      </p>
      <SurveyBuilderPanel draft={draft} onDraftChange={onDraftChange} />
    </div>
  );
}
