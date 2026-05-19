import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";

import { MISSION_RULES_MD_EDITOR_HEIGHT } from "./missionRulesMarkdownEditor.constants";

type MissionRulesMarkdownEditorPanelProps = {
  value: string;
  onChange: (value: string) => void;
  textareaId: string;
};

/**
 * Éditeur lourd (@uiw/react-md-editor) — chargé uniquement via import dynamique
 * depuis `MissionRulesMarkdownField`.
 */
export function MissionRulesMarkdownEditorPanel({
  value,
  onChange,
  textareaId,
}: MissionRulesMarkdownEditorPanelProps) {
  return (
    <div className="mission-rules-md-editor" data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(v) => onChange(typeof v === "string" ? v : "")}
        preview="edit"
        visibleDragbar={false}
        height={MISSION_RULES_MD_EDITOR_HEIGHT}
        textareaProps={{
          id: textareaId,
          spellCheck: true,
          required: true,
          "aria-required": "true",
        }}
      />
    </div>
  );
}
