import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { useCreateAdminMissionMutation } from "../hooks/useCreateAdminMissionMutation";
import { missionServiceErrorMessage } from "../missionErrorMessages";
import {
  MISSION_ADMIN_STATUSES,
  MISSION_ADMIN_VALIDATION_MODES,
  MISSION_CREATE_TYPES,
  type CreateAdminMissionInput,
  type CreateAdminMissionMissionType,
  type MissionAdminKnownStatus,
  type MissionAdminKnownValidationMode,
} from "../types/missionAdmin";
import { buildMissionMetadata } from "./create-mission/buildMissionMetadata";
import type { RulesTab } from "./create-mission/createMissionFormTypes";
import { getHevcVideoUrlError } from "../lib/videoCodecSupport";
import { MissionMetadataSection } from "./create-mission/MissionMetadataSection";
import { MissionRulesMarkdownField } from "./create-mission/missionRulesMarkdownField";
import { createDefaultSurveyDraft } from "./create-mission/survey-builder/defaultSurveyDraft";
import type { SurveyDraft } from "./create-mission/survey-builder/surveyDraft.types";

type BrandOption = { id: string; name: string };

type FormState = {
  brand_id: string;
  title: string;
  description: string;
  rules_text: string;
  mission_type: CreateAdminMissionMissionType;
  token_reward: string;
  validation_mode: MissionAdminKnownValidationMode;
  status: MissionAdminKnownStatus;
  starts_at: string;
  ends_at: string;
  max_completions_total: string;
  max_completions_per_user: string;
  survey_draft: SurveyDraft;
  video_metadata_url: string;
  video_metadata_title: string;
  video_metadata_thumbnail_url: string;
  external_metadata_url: string;
  external_metadata_platform: string;
  external_metadata_action_label: string;
  external_metadata_min_seconds: string;
  image_url: string;
  rulesTab: RulesTab;
};

function getInitialFormState(): FormState {
  return {
    brand_id: "",
    title: "",
    description: "",
    rules_text: "## Règlement\n\n",
    mission_type: "survey",
    token_reward: "20",
    validation_mode: "automatic",
    status: "draft",
    starts_at: "",
    ends_at: "",
    max_completions_total: "",
    max_completions_per_user: "",
    survey_draft: createDefaultSurveyDraft(),
    video_metadata_url: "",
    video_metadata_title: "",
    video_metadata_thumbnail_url: "",
    external_metadata_url: "",
    external_metadata_platform: "",
    external_metadata_action_label: "",
    external_metadata_min_seconds: "",
    image_url: "",
    rulesTab: "edit",
  };
}

function serializeForDirty(f: FormState): string {
  const { rulesTab: _t, ...rest } = f;
  return JSON.stringify(rest);
}

function toIsoOrNull(local: string): string | null {
  const t = local.trim();
  if (!t) {
    return null;
  }
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

type CreateMissionModalProps = {
  open: boolean;
  onClose: () => void;
  brands: BrandOption[];
  brandsLoading?: boolean;
};

export function CreateMissionModal({
  open,
  onClose,
  brands,
  brandsLoading,
}: CreateMissionModalProps) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const requestCloseRef = useRef<(() => void) | null>(null);
  const [form, setForm] = useState<FormState>(getInitialFormState);
  const baselineRef = useRef(serializeForDirty(getInitialFormState()));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const createMutation = useCreateAdminMissionMutation();

  const videoHevcBlocked =
    form.mission_type === "video" &&
    getHevcVideoUrlError(form.video_metadata_url) != null;

  useEffect(() => {
    if (!open) {
      return;
    }
    const initial = getInitialFormState();
    setForm(initial);
    baselineRef.current = serializeForDirty(initial);
    setSubmitError(null);
    setFieldError(null);
  }, [open]);

  const isDirty = useCallback(() => {
    return serializeForDirty(form) !== baselineRef.current;
  }, [form]);

  const requestClose = useCallback(() => {
    if (isDirty()) {
      const ok = window.confirm(
        "Abandonner la saisie ? Les modifications non enregistrées seront perdues.",
      );
      if (!ok) {
        return;
      }
    }
    onClose();
  }, [isDirty, onClose]);

  useEffect(() => {
    requestCloseRef.current = requestClose;
  }, [requestClose]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestCloseRef.current?.();
        return;
      }

      if (e.key !== "Tab") {
        return;
      }

      const container = sheetRef.current;
      if (!container) {
        return;
      }

      const focusableSelector = [
        'a[href]:not([tabindex="-1"])',
        'area[href]:not([tabindex="-1"])',
        'button:not([disabled]):not([tabindex="-1"])',
        'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
        'select:not([disabled]):not([tabindex="-1"])',
        'textarea:not([disabled]):not([tabindex="-1"])',
        'iframe:not([tabindex="-1"])',
        'object:not([tabindex="-1"])',
        'embed:not([tabindex="-1"])',
        '[contenteditable="true"]:not([tabindex="-1"])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(",");

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((el) => {
        if (el.getAttribute("aria-hidden") === "true") return false;
        if (el.hasAttribute("disabled")) return false;
        const style = window.getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none")
          return false;
        // offsetParent is null for display:none and some fixed elements; keep style checks above.
        return true;
      });

      if (focusables.length === 0) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      if (e.shiftKey) {
        if (!active || active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (!active || active === last || !container.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    const prevActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const container = sheetRef.current;
    const focusableSelector = [
      'a[href]:not([tabindex="-1"])',
      'area[href]:not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      'iframe:not([tabindex="-1"])',
      'object:not([tabindex="-1"])',
      'embed:not([tabindex="-1"])',
      '[contenteditable="true"]:not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const initialFocusable =
      container?.querySelector<HTMLElement>(focusableSelector) ??
      closeRef.current;
    initialFocusable?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      prevActiveElement?.focus?.();
    };
  }, [open]);

  const setMissionType = useCallback(
    (nextType: CreateAdminMissionMissionType) => {
      setForm((prev) => ({ ...prev, mission_type: nextType }));
    },
    [],
  );

  const update =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldError(null);

    if (!form.brand_id.trim()) {
      setFieldError("Choisissez une marque.");
      return;
    }
    const tokenReward = Number(form.token_reward);
    if (!Number.isFinite(tokenReward) || tokenReward <= 0) {
      setFieldError(
        "La récompense (jetons) doit être un nombre strictement positif.",
      );
      return;
    }
    if (form.rules_text.trim() === "") {
      setFieldError("Saisissez le règlement de la mission.");
      return;
    }

    const built = buildMissionMetadata({
      missionType: form.mission_type,
      surveyDraft: form.survey_draft,
      videoUrl: form.video_metadata_url,
      videoTitle: form.video_metadata_title,
      videoThumbnailUrl: form.video_metadata_thumbnail_url,
      externalUrl: form.external_metadata_url,
      externalPlatform: form.external_metadata_platform,
      externalActionLabel: form.external_metadata_action_label,
      externalMinSeconds: form.external_metadata_min_seconds,
    });
    if (!built.ok) {
      setFieldError(built.message);
      return;
    }
    const metadata = built.metadata;

    const starts = toIsoOrNull(form.starts_at);
    const ends = toIsoOrNull(form.ends_at);
    if (starts && ends) {
      if (new Date(starts).getTime() >= new Date(ends).getTime()) {
        setFieldError(
          "La date de fin doit être postérieure à la date de début.",
        );
        return;
      }
    }

    let maxTotal: number | null | undefined;
    if (form.max_completions_total.trim() !== "") {
      const n = Number(form.max_completions_total);
      if (!Number.isFinite(n) || n <= 0) {
        setFieldError("Quota total : nombre positif ou champ vide.");
        return;
      }
      maxTotal = n;
    } else {
      maxTotal = undefined;
    }

    let maxPerUser: number | null | undefined;
    if (form.max_completions_per_user.trim() !== "") {
      const n = Number(form.max_completions_per_user);
      if (!Number.isFinite(n) || n <= 0) {
        setFieldError(
          "Quota par utilisateur : nombre positif ou champ vide (défaut : 1).",
        );
        return;
      }
      maxPerUser = n;
    } else {
      maxPerUser = undefined;
    }

    const imageUrl = form.image_url.trim();
    const description = form.description.trim();

    const payload: CreateAdminMissionInput = {
      brand_id: form.brand_id.trim(),
      title: form.title.trim(),
      rules_text: form.rules_text.trim(),
      mission_type: form.mission_type,
      token_reward: tokenReward,
      validation_mode: form.validation_mode,
      status: form.status,
      description: description === "" ? null : description,
      starts_at: starts,
      ends_at: ends,
      max_completions_total: maxTotal === undefined ? undefined : maxTotal,
      max_completions_per_user: maxPerUser,
      metadata,
      image_url: imageUrl === "" ? null : imageUrl,
    };

    try {
      await createMutation.mutateAsync(payload);
      onClose();
    } catch (err) {
      if (err instanceof ServiceFailureError) {
        setSubmitError(missionServiceErrorMessage(err.errorCode));
      } else {
        setSubmitError(missionServiceErrorMessage("UNKNOWN"));
      }
    }
  };

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="lottery-detail-panel">
      <button
        type="button"
        className="lottery-detail-panel__backdrop"
        aria-label="Fermer la fenêtre"
        onClick={requestClose}
      />
      <div
        className="lottery-detail-panel__sheet mission-create-modal__sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="lottery-detail-panel__header">
          <h2 id={titleId} className="lottery-detail-panel__title">
            Créer une mission
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="lottery-detail-panel__close"
            onClick={requestClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>
        <div className="lottery-detail-panel__body">
          <form className="mission-create-form" onSubmit={handleSubmit}>
            {(fieldError || submitError) && (
              <div
                className="page-lotteries__alert mission-create-form__alert"
                role="alert"
              >
                {fieldError ?? submitError}
              </div>
            )}

            <div className="mission-create-form__grid">
              <div className="mission-create-form__field mission-create-form__field--full">
                <label
                  className="mission-create-form__label"
                  htmlFor="mission-create-brand"
                >
                  Marque
                </label>
                <select
                  id="mission-create-brand"
                  className="mission-create-form__control"
                  value={form.brand_id}
                  onChange={(e) => update("brand_id")(e.target.value)}
                  required
                  disabled={Boolean(brandsLoading) || brands.length === 0}
                >
                  <option value="">— Sélectionner —</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mission-create-form__field mission-create-form__field--full">
                <label
                  className="mission-create-form__label"
                  htmlFor="mission-create-title"
                >
                  Titre
                </label>
                <input
                  id="mission-create-title"
                  className="mission-create-form__control"
                  type="text"
                  value={form.title}
                  onChange={(e) => update("title")(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="mission-create-form__field mission-create-form__field--full">
                <label
                  className="mission-create-form__label"
                  htmlFor="mission-create-description"
                >
                  Description
                </label>
                <textarea
                  id="mission-create-description"
                  className="mission-create-form__textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => update("description")(e.target.value)}
                />
              </div>

              <div className="mission-create-form__field">
                <label
                  className="mission-create-form__label"
                  htmlFor="mission-create-type"
                >
                  Type
                </label>
                <select
                  id="mission-create-type"
                  className="mission-create-form__control"
                  value={form.mission_type}
                  onChange={(e) =>
                    setMissionType(
                      e.target.value as CreateAdminMissionMissionType,
                    )
                  }
                >
                  {MISSION_CREATE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mission-create-form__field">
                <label
                  className="mission-create-form__label"
                  htmlFor="mission-create-status"
                >
                  Statut
                </label>
                <select
                  id="mission-create-status"
                  className="mission-create-form__control"
                  value={form.status}
                  onChange={(e) =>
                    update("status")(e.target.value as MissionAdminKnownStatus)
                  }
                >
                  {MISSION_ADMIN_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mission-create-form__field">
                <label
                  className="mission-create-form__label"
                  htmlFor="mission-create-tokens"
                >
                  Récompense (jetons)
                </label>
                <input
                  id="mission-create-tokens"
                  className="mission-create-form__control"
                  type="number"
                  min={1}
                  step={1}
                  value={form.token_reward}
                  onChange={(e) => update("token_reward")(e.target.value)}
                  required
                />
              </div>

              <div className="mission-create-form__field">
                <label
                  className="mission-create-form__label"
                  htmlFor="mission-create-validation"
                >
                  Mode validation
                </label>
                <select
                  id="mission-create-validation"
                  className="mission-create-form__control"
                  value={form.validation_mode}
                  onChange={(e) =>
                    update("validation_mode")(
                      e.target.value as MissionAdminKnownValidationMode,
                    )
                  }
                >
                  {MISSION_ADMIN_VALIDATION_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mission-create-form__field">
                <label
                  className="mission-create-form__label"
                  htmlFor="mission-create-starts"
                >
                  Début
                </label>
                <input
                  id="mission-create-starts"
                  className="mission-create-form__control"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => update("starts_at")(e.target.value)}
                />
              </div>

              <div className="mission-create-form__field">
                <label
                  className="mission-create-form__label"
                  htmlFor="mission-create-ends"
                >
                  Fin
                </label>
                <input
                  id="mission-create-ends"
                  className="mission-create-form__control"
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => update("ends_at")(e.target.value)}
                />
              </div>

              <div className="mission-create-form__field">
                <label
                  className="mission-create-form__label"
                  htmlFor="mission-create-max-total"
                >
                  Quota total complétions
                </label>
                <input
                  id="mission-create-max-total"
                  className="mission-create-form__control"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="vide = illimité"
                  value={form.max_completions_total}
                  onChange={(e) =>
                    update("max_completions_total")(e.target.value)
                  }
                />
              </div>

              <div className="mission-create-form__field">
                <label
                  className="mission-create-form__label"
                  htmlFor="mission-create-max-user"
                >
                  Quota / utilisateur
                </label>
                <input
                  id="mission-create-max-user"
                  className="mission-create-form__control"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="vide = 1"
                  value={form.max_completions_per_user}
                  onChange={(e) =>
                    update("max_completions_per_user")(e.target.value)
                  }
                />
              </div>

              <div className="mission-create-form__field mission-create-form__field--full">
                <label
                  className="mission-create-form__label"
                  htmlFor="mission-create-image"
                >
                  URL image (optionnel)
                </label>
                <input
                  id="mission-create-image"
                  className="mission-create-form__control"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={form.image_url}
                  onChange={(e) => update("image_url")(e.target.value)}
                />
              </div>
              <hr style={{ margin: "24px 0" }} />
              <MissionMetadataSection
                missionType={form.mission_type}
                surveyDraft={form.survey_draft}
                onSurveyDraftChange={update("survey_draft")}
                videoUrl={form.video_metadata_url}
                videoTitle={form.video_metadata_title}
                videoThumbnailUrl={form.video_metadata_thumbnail_url}
                onVideoUrlChange={update("video_metadata_url")}
                onVideoTitleChange={update("video_metadata_title")}
                onVideoThumbnailUrlChange={update(
                  "video_metadata_thumbnail_url",
                )}
                externalUrl={form.external_metadata_url}
                externalPlatform={form.external_metadata_platform}
                externalActionLabel={form.external_metadata_action_label}
                externalMinSeconds={form.external_metadata_min_seconds}
                onExternalUrlChange={update("external_metadata_url")}
                onExternalPlatformChange={update("external_metadata_platform")}
                onExternalActionLabelChange={update(
                  "external_metadata_action_label",
                )}
                onExternalMinSecondsChange={update(
                  "external_metadata_min_seconds",
                )}
              />

              <hr style={{ margin: "24px 0" }} />
              <MissionRulesMarkdownField
                rulesText={form.rules_text}
                rulesTab={form.rulesTab}
                onRulesTextChange={update("rules_text")}
                onRulesTabChange={update("rulesTab")}
              />
            </div>

            <div className="mission-create-form__actions">
              <button
                type="button"
                className="mission-create-form__btn mission-create-form__btn--secondary"
                onClick={requestClose}
                disabled={createMutation.isPending}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="mission-create-form__btn mission-create-form__btn--primary"
                disabled={createMutation.isPending || brands.length === 0 || videoHevcBlocked}
              >
                {createMutation.isPending
                  ? "Enregistrement…"
                  : "Créer la mission"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
