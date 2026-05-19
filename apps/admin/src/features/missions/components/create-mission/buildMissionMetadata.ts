import type { CreateAdminMissionMissionType } from "../../types/missionAdmin";
import type { SurveyDraft } from "./survey-builder/surveyDraft.types";
import { serializeSurveyDraftToMetadata } from "./survey-builder/surveyDraftSerialization";

export type MissionMetadataFormInput = {
  missionType: CreateAdminMissionMissionType;
  surveyDraft: SurveyDraft;
  videoUrl: string;
  videoTitle: string;
  videoThumbnailUrl: string;
  externalUrl: string;
  externalPlatform: string;
  externalActionLabel: string;
  externalMinSeconds: string;
};

export type BuildMissionMetadataResult =
  | { ok: true; metadata: Record<string, unknown> }
  | { ok: false; message: string };

function buildVideoMetadata(input: MissionMetadataFormInput): BuildMissionMetadataResult {
  const video_url = input.videoUrl.trim();
  if (!video_url) {
    return { ok: false, message: "URL de la vidéo obligatoire." };
  }
  const metadata: Record<string, unknown> = { video_url };
  const title = input.videoTitle.trim();
  if (title.length > 0) {
    metadata.title = title;
  }
  const thumbnail = input.videoThumbnailUrl.trim();
  if (thumbnail.length > 0) {
    metadata.thumbnail_url = thumbnail;
  }
  return { ok: true, metadata };
}

function buildExternalMetadata(
  input: MissionMetadataFormInput,
): BuildMissionMetadataResult {
  const external_url = input.externalUrl.trim();
  const platform = input.externalPlatform.trim();
  const action_label = input.externalActionLabel.trim();
  if (!external_url) {
    return { ok: false, message: "URL externe obligatoire." };
  }
  if (!platform) {
    return { ok: false, message: "Plateforme obligatoire (ex. instagram, tiktok)." };
  }
  if (!action_label) {
    return { ok: false, message: "Libellé du bouton / action obligatoire." };
  }

  const metadata: Record<string, unknown> = {
    external_url,
    platform: platform.toLowerCase(),
    action_label,
  };

  const rawMin = input.externalMinSeconds.trim();
  if (rawMin !== "") {
    const n = Number.parseInt(rawMin, 10);
    if (Number.isNaN(n) || n < 0) {
      return {
        ok: false,
        message: "Délai minimum (secondes) : entier positif ou vide.",
      };
    }
    metadata.min_external_duration_seconds = n;
  }

  return { ok: true, metadata };
}

function buildSurveyMetadata(input: MissionMetadataFormInput): BuildMissionMetadataResult {
  return serializeSurveyDraftToMetadata(input.surveyDraft);
}

export function buildMissionMetadata(
  input: MissionMetadataFormInput,
): BuildMissionMetadataResult {
  switch (input.missionType) {
    case "video":
      return buildVideoMetadata(input);
    case "external_action":
      return buildExternalMetadata(input);
    case "survey":
      return buildSurveyMetadata(input);
    default:
      return {
        ok: false,
        message: `Type de mission non géré : ${String(input.missionType)}`,
      };
  }
}
