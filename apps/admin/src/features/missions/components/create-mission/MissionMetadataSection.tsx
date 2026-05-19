import type { CreateAdminMissionMissionType } from "../../types/missionAdmin";
import type { SurveyDraft } from "./survey-builder/surveyDraft.types";
import { ExternalActionMissionMetadataFields } from "./ExternalActionMissionMetadataFields";
import { SurveyMissionMetadataFields } from "./SurveyMissionMetadataFields";
import { VideoMissionMetadataFields } from "./VideoMissionMetadataFields";

export type MissionMetadataSectionProps = {
  missionType: CreateAdminMissionMissionType;
  surveyDraft: SurveyDraft;
  onSurveyDraftChange: (draft: SurveyDraft) => void;
  videoUrl: string;
  videoTitle: string;
  videoThumbnailUrl: string;
  onVideoUrlChange: (value: string) => void;
  onVideoTitleChange: (value: string) => void;
  onVideoThumbnailUrlChange: (value: string) => void;
  externalUrl: string;
  externalPlatform: string;
  externalActionLabel: string;
  externalMinSeconds: string;
  onExternalUrlChange: (value: string) => void;
  onExternalPlatformChange: (value: string) => void;
  onExternalActionLabelChange: (value: string) => void;
  onExternalMinSecondsChange: (value: string) => void;
};

export function MissionMetadataSection({
  missionType,
  surveyDraft,
  onSurveyDraftChange,
  videoUrl,
  videoTitle,
  videoThumbnailUrl,
  onVideoUrlChange,
  onVideoTitleChange,
  onVideoThumbnailUrlChange,
  externalUrl,
  externalPlatform,
  externalActionLabel,
  externalMinSeconds,
  onExternalUrlChange,
  onExternalPlatformChange,
  onExternalActionLabelChange,
  onExternalMinSecondsChange,
}: MissionMetadataSectionProps) {
  return (
    <section
      className="mission-create-form__metadata-section"
      aria-label="Métadonnées selon le type de mission"
    >
      {missionType === "survey" && (
        <SurveyMissionMetadataFields
          draft={surveyDraft}
          onDraftChange={onSurveyDraftChange}
        />
      )}
      {missionType === "video" && (
        <VideoMissionMetadataFields
          videoUrl={videoUrl}
          videoTitle={videoTitle}
          videoThumbnailUrl={videoThumbnailUrl}
          onVideoUrlChange={onVideoUrlChange}
          onVideoTitleChange={onVideoTitleChange}
          onVideoThumbnailUrlChange={onVideoThumbnailUrlChange}
        />
      )}
      {missionType === "external_action" && (
        <ExternalActionMissionMetadataFields
          externalUrl={externalUrl}
          platform={externalPlatform}
          actionLabel={externalActionLabel}
          minSeconds={externalMinSeconds}
          onExternalUrlChange={onExternalUrlChange}
          onPlatformChange={onExternalPlatformChange}
          onActionLabelChange={onExternalActionLabelChange}
          onMinSecondsChange={onExternalMinSecondsChange}
        />
      )}
    </section>
  );
}
