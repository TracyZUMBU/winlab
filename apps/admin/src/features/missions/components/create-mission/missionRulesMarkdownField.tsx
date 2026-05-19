import DOMPurify from "dompurify";
import { marked } from "marked";
import { lazy, Suspense, useMemo } from "react";

import type { RulesTab } from "./createMissionFormTypes";
import { MISSION_RULES_MD_EDITOR_HEIGHT } from "./missionRulesMarkdownEditor.constants";

marked.setOptions({ gfm: true, breaks: true });

const MissionRulesMarkdownEditorPanel = lazy(() =>
  import("./MissionRulesMarkdownEditorPanel").then((m) => ({
    default: m.MissionRulesMarkdownEditorPanel,
  })),
);

type MissionRulesMarkdownFieldProps = {
  rulesText: string;
  rulesTab: RulesTab;
  onRulesTextChange: (value: string) => void;
  onRulesTabChange: (tab: RulesTab) => void;
  textareaId?: string;
};

function MarkdownEditorFallback() {
  return (
    <div
      className="mission-rules-md-editor mission-rules-md-editor--fallback"
      data-color-mode="light"
      style={{ minHeight: MISSION_RULES_MD_EDITOR_HEIGHT }}
      role="status"
      aria-live="polite"
    >
      Chargement de l’éditeur…
    </div>
  );
}

export function MissionRulesMarkdownField({
  rulesText,
  rulesTab,
  onRulesTextChange,
  onRulesTabChange,
  textareaId = "mission-create-rules",
}: MissionRulesMarkdownFieldProps) {
  const previewHtml = useMemo(() => {
    const raw = marked.parse(rulesText || "") as string;
    return DOMPurify.sanitize(raw);
  }, [rulesText]);

  return (
    <div className="mission-create-form__field mission-create-form__field--full">
      <div className="mission-create-form__label-row">
        <span className="mission-create-form__label">Règlement</span>
        <div
          className="mission-create-form__tabs"
          role="tablist"
          aria-label="Règlement"
        >
          <button
            type="button"
            role="tab"
            aria-selected={rulesTab === "edit"}
            className={
              rulesTab === "edit"
                ? "mission-create-form__tab mission-create-form__tab--active"
                : "mission-create-form__tab"
            }
            onClick={() => onRulesTabChange("edit")}
          >
            Éditer
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={rulesTab === "preview"}
            className={
              rulesTab === "preview"
                ? "mission-create-form__tab mission-create-form__tab--active"
                : "mission-create-form__tab"
            }
            onClick={() => onRulesTabChange("preview")}
          >
            Aperçu
          </button>
        </div>
      </div>
      {rulesTab === "edit" ? (
        <Suspense fallback={<MarkdownEditorFallback />}>
          <MissionRulesMarkdownEditorPanel
            value={rulesText}
            onChange={onRulesTextChange}
            textareaId={textareaId}
          />
        </Suspense>
      ) : (
        <div
          className="mission-create-markdown-preview"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}
    </div>
  );
}
