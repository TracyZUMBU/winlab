import { useQuery } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { getAppLocale } from "../../../lib/appLocale";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { getLotteryCategoryOptionsList } from "../lib/lotteryCategories";
import {
  LOTTERY_CREATE_FORM_DEFAULTS,
  getDefaultLotteryCreateDateFields,
} from "../lib/lotteryCreateFormDefaults";
import { LOTTERY_FORM_TIMEZONE } from "../lib/lotteryFormParisTime";
import { getLotterySlugCollisionWarning } from "../lib/getLotterySlugCollisionWarning";
import { lotterySlugFromTitle } from "../lib/lotterySlugFromTitle";
import { validateCreateLotteryForm } from "../lib/validateCreateLotteryForm";
import { resolveDefaultLotteryBrandId } from "../lib/resolveDefaultLotteryBrandId";
import { lotteryServiceErrorMessage } from "../lotteryErrorMessages";
import { useCreateAdminLotteryMutation } from "../hooks/useCreateAdminLotteryMutation";
import { LOTTERY_CREATE_STATUSES } from "../types/lotteryAdmin";
import { adminLotteriesListOptions } from "../queries/admin-lotteries-list.query";
import {
  adminLotteryFormBrandsQuery,
} from "../queries/lottery-create-form-support.query";
import type { LotteryCreateStatus, LotteryFormBrandOption } from "../types/lotteryAdmin";
import {
  LOTTERY_CREATE_STATUS_HINTS,
  LOTTERY_CREATE_STATUS_LABELS,
} from "./create-lottery/lotteryCreateStatusLabels";

type FormState = {
  brand_id: string;
  title: string;
  description: string;
  short_description: string;
  category: string;
  image_url: string;
  ticket_cost: string;
  number_of_winners: string;
  status: LotteryCreateStatus;
  is_featured: boolean;
  starts_at_local: string;
  ends_at_local: string;
  draw_at_local: string;
};

function buildInitialFormState(defaultBrandId: string): FormState {
  const dates = getDefaultLotteryCreateDateFields();
  return {
    brand_id: defaultBrandId,
    title: "",
    description: "",
    short_description: "",
    category: "",
    image_url: "",
    ticket_cost: LOTTERY_CREATE_FORM_DEFAULTS.ticket_cost,
    number_of_winners: LOTTERY_CREATE_FORM_DEFAULTS.number_of_winners,
    status: LOTTERY_CREATE_FORM_DEFAULTS.status,
    is_featured: LOTTERY_CREATE_FORM_DEFAULTS.is_featured,
    ...dates,
  };
}

function serializeForDirty(form: FormState): string {
  return JSON.stringify(form);
}

type CreateLotteryPanelProps = {
  open: boolean;
  onClose: () => void;
  /** Appelé après création réussie (avant fermeture du panneau). */
  onCreated: (lotteryId: string) => void;
};

type FieldLabelProps = {
  htmlFor: string;
  children: ReactNode;
  hint?: string;
};

function FieldLabel({ htmlFor, children, hint }: FieldLabelProps) {
  return (
    <>
      <label className="mission-create-form__label" htmlFor={htmlFor}>
        {children}
      </label>
      {hint ? <p className="mission-create-form__hint">{hint}</p> : null}
    </>
  );
}

export function CreateLotteryPanel({
  open,
  onClose,
  onCreated,
}: CreateLotteryPanelProps) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const requestCloseRef = useRef<(() => void) | null>(null);

  const brandsQuery = useQuery({
    ...adminLotteryFormBrandsQuery(),
    enabled: open && isSupabaseConfigured(),
  });
  const lotteriesListQuery = useQuery({
    ...adminLotteriesListOptions(),
    enabled: open && isSupabaseConfigured(),
  });

  const brands: LotteryFormBrandOption[] = brandsQuery.isSuccess
    ? brandsQuery.data
    : [];
  const categories = useMemo(
    () => getLotteryCategoryOptionsList(getAppLocale()),
    [open],
  );

  const [form, setForm] = useState<FormState>(() => buildInitialFormState(""));
  const baselineRef = useRef(serializeForDirty(buildInitialFormState("")));
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreateAdminLotteryMutation();

  const existingDerivedSlugs = useMemo(() => {
    const rows = lotteriesListQuery.data ?? [];
    const slugs: string[] = [];
    for (const row of rows) {
      const slug = lotterySlugFromTitle(row.title);
      if (slug) {
        slugs.push(slug);
      }
    }
    return slugs;
  }, [lotteriesListQuery.data]);

  const slugCollisionWarning = useMemo(
    () => getLotterySlugCollisionWarning(form.title, existingDerivedSlugs),
    [form.title, existingDerivedSlugs],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const initial = buildInitialFormState("");
    setForm(initial);
    baselineRef.current = serializeForDirty(initial);
    setFieldError(null);
    setSubmitError(null);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const defaultBrandId = resolveDefaultLotteryBrandId(brands);
    if (!defaultBrandId) {
      return;
    }
    setForm((prev) => {
      if (prev.brand_id.trim() !== "") {
        return prev;
      }
      const next = { ...prev, brand_id: defaultBrandId };
      baselineRef.current = serializeForDirty(next);
      return next;
    });
  }, [open, brands]);

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
        'button:not([disabled]):not([tabindex="-1"])',
        'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
        'select:not([disabled]):not([tabindex="-1"])',
        'textarea:not([disabled]):not([tabindex="-1"])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(",");

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((el) => {
        if (el.getAttribute("aria-hidden") === "true") return false;
        const style = window.getComputedStyle(el);
        return style.visibility !== "hidden" && style.display !== "none";
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
      } else if (!active || active === last || !container.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const prevActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const focusableSelector = [
      'a[href]:not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const initialFocusable =
      sheetRef.current?.querySelector<HTMLElement>(focusableSelector) ??
      closeRef.current;
    initialFocusable?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      prevActiveElement?.focus?.();
    };
  }, [open]);

  const update =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setSubmitError(null);

    const validated = validateCreateLotteryForm(form);
    if (!validated.ok) {
      setFieldError(validated.message);
      return;
    }

    try {
      const created = await createMutation.mutateAsync(validated.payload);
      onCreated(created.id);
      onClose();
    } catch (err) {
      if (err instanceof ServiceFailureError) {
        setSubmitError(lotteryServiceErrorMessage(err.errorCode));
      } else {
        setSubmitError(lotteryServiceErrorMessage("UNKNOWN"));
      }
    }
  };

  if (!open) {
    return null;
  }

  const brandsLoading = brandsQuery.isPending;
  const supportQueryError = brandsQuery.isError
    ? lotteryServiceErrorMessage(
        brandsQuery.error instanceof ServiceFailureError
          ? brandsQuery.error.errorCode
          : "UNKNOWN",
      )
    : null;

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
            Créer une loterie
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
            {(fieldError || submitError || supportQueryError) && (
              <div
                className="page-lotteries__alert mission-create-form__alert"
                role="alert"
              >
                {fieldError ?? submitError ?? supportQueryError}
              </div>
            )}

            {slugCollisionWarning ? (
              <p
                className="mission-create-form__hint mission-create-form__hint--warning"
                role="status"
              >
                {slugCollisionWarning}
              </p>
            ) : null}

            <div className="mission-create-form__grid">
              <div className="mission-create-form__field mission-create-form__field--full">
                <FieldLabel htmlFor="lottery-create-brand" hint="Marque affichée avec la loterie.">
                  Marque
                </FieldLabel>
                <select
                  id="lottery-create-brand"
                  className="mission-create-form__control"
                  value={form.brand_id}
                  onChange={(e) => update("brand_id")(e.target.value)}
                  required
                  disabled={brandsLoading || brands.length === 0}
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
                <FieldLabel htmlFor="lottery-create-title">Titre</FieldLabel>
                <input
                  id="lottery-create-title"
                  className="mission-create-form__control"
                  type="text"
                  value={form.title}
                  onChange={(e) => update("title")(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="mission-create-form__field mission-create-form__field--full">
                <FieldLabel
                  htmlFor="lottery-create-short-description"
                  hint="Message court affiché sur la carte dans l’application."
                >
                  Résumé
                </FieldLabel>
                <input
                  id="lottery-create-short-description"
                  className="mission-create-form__control"
                  type="text"
                  value={form.short_description}
                  onChange={(e) => update("short_description")(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="mission-create-form__field mission-create-form__field--full">
                <FieldLabel htmlFor="lottery-create-description">Description</FieldLabel>
                <textarea
                  id="lottery-create-description"
                  className="mission-create-form__textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => update("description")(e.target.value)}
                />
              </div>

              <div className="mission-create-form__field">
                <FieldLabel htmlFor="lottery-create-category">Catégorie</FieldLabel>
                <select
                  id="lottery-create-category"
                  className="mission-create-form__control"
                  value={form.category}
                  onChange={(e) => update("category")(e.target.value)}
                  required
                >
                  <option value="">— Sélectionner —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mission-create-form__field">
                <FieldLabel htmlFor="lottery-create-status">Statut</FieldLabel>
                <select
                  id="lottery-create-status"
                  className="mission-create-form__control"
                  value={form.status}
                  onChange={(e) =>
                    update("status")(e.target.value as LotteryCreateStatus)
                  }
                >
                  {LOTTERY_CREATE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {LOTTERY_CREATE_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <p className="mission-create-form__hint">
                  {LOTTERY_CREATE_STATUS_HINTS[form.status]}
                </p>
              </div>

              <div className="mission-create-form__field mission-create-form__field--full">
                <p className="mission-create-form__hint">
                  Dates et heures en fuseau {LOTTERY_FORM_TIMEZONE.replace("_", " ")}.
                </p>
              </div>

              <div className="mission-create-form__field">
                <FieldLabel htmlFor="lottery-create-starts">Ouverture</FieldLabel>
                <input
                  id="lottery-create-starts"
                  className="mission-create-form__control"
                  type="datetime-local"
                  value={form.starts_at_local}
                  onChange={(e) => update("starts_at_local")(e.target.value)}
                  required
                />
              </div>

              <div className="mission-create-form__field">
                <FieldLabel htmlFor="lottery-create-ends">Fin</FieldLabel>
                <input
                  id="lottery-create-ends"
                  className="mission-create-form__control"
                  type="datetime-local"
                  value={form.ends_at_local}
                  onChange={(e) => update("ends_at_local")(e.target.value)}
                  required
                />
              </div>

              <div className="mission-create-form__field">
                <FieldLabel htmlFor="lottery-create-draw">Tirage</FieldLabel>
                <input
                  id="lottery-create-draw"
                  className="mission-create-form__control"
                  type="datetime-local"
                  value={form.draw_at_local}
                  onChange={(e) => update("draw_at_local")(e.target.value)}
                  required
                />
              </div>

              <div className="mission-create-form__field">
                <FieldLabel htmlFor="lottery-create-ticket-cost">
                  Prix d’un ticket (jetons)
                </FieldLabel>
                <input
                  id="lottery-create-ticket-cost"
                  className="mission-create-form__control"
                  type="number"
                  min={1}
                  step={1}
                  value={form.ticket_cost}
                  onChange={(e) => update("ticket_cost")(e.target.value)}
                  required
                />
              </div>

              <div className="mission-create-form__field">
                <FieldLabel htmlFor="lottery-create-winners">
                  Nombre de gagnants
                </FieldLabel>
                <input
                  id="lottery-create-winners"
                  className="mission-create-form__control"
                  type="number"
                  min={1}
                  step={1}
                  value={form.number_of_winners}
                  onChange={(e) => update("number_of_winners")(e.target.value)}
                  required
                />
              </div>

              <div className="mission-create-form__field mission-create-form__field--full">
                <FieldLabel
                  htmlFor="lottery-create-image"
                  hint="Lien vers l’image. L’envoi de fichier depuis l’admin sera ajouté plus tard."
                >
                  Image (URL)
                </FieldLabel>
                <input
                  id="lottery-create-image"
                  className="mission-create-form__control"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={form.image_url}
                  onChange={(e) => update("image_url")(e.target.value)}
                />
              </div>

              <div className="mission-create-form__field mission-create-form__field--full">
                <label className="mission-create-form__label mission-create-form__label--checkbox">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => update("is_featured")(e.target.checked)}
                  />
                  Mise en avant
                </label>
              </div>
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
                disabled={
                  createMutation.isPending || brandsLoading || brands.length === 0
                }
              >
                {createMutation.isPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
