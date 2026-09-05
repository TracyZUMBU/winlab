/** ISO 3166-1 alpha-2 — aligné sur `profiles.residence_country` (CHECK DB). */
export const RESIDENCE_COUNTRY_FR = "FR" as const;
export const RESIDENCE_COUNTRY_CH = "CH" as const;
export const RESIDENCE_COUNTRY_LU = "LU" as const;

export const RESIDENCE_COUNTRY_CODES = [
  RESIDENCE_COUNTRY_FR,
  RESIDENCE_COUNTRY_CH,
  RESIDENCE_COUNTRY_LU,
] as const;

export type ResidenceCountryCode = (typeof RESIDENCE_COUNTRY_CODES)[number];

export type ResidenceCountryOption = {
  code: ResidenceCountryCode;
  /** Clé i18n (`profile.residenceCountry.*`). */
  labelKey: string;
};

export const RESIDENCE_COUNTRIES: readonly ResidenceCountryOption[] = [
  { code: RESIDENCE_COUNTRY_FR, labelKey: "profile.residenceCountry.fr" },
  { code: RESIDENCE_COUNTRY_CH, labelKey: "profile.residenceCountry.ch" },
  { code: RESIDENCE_COUNTRY_LU, labelKey: "profile.residenceCountry.lu" },
] as const;

export const RESIDENCE_COUNTRY_CODE_SET: ReadonlySet<string> = new Set(
  RESIDENCE_COUNTRY_CODES,
);

/**
 * Countries offered in pickers / create-profile UI.
 * CH and LU stay valid in DB and on existing profiles; add them back here to reopen.
 */
export const SELECTABLE_RESIDENCE_COUNTRY_CODES: readonly ResidenceCountryCode[] =
  [RESIDENCE_COUNTRY_FR];

const SELECTABLE_RESIDENCE_COUNTRY_CODE_SET: ReadonlySet<string> = new Set(
  SELECTABLE_RESIDENCE_COUNTRY_CODES,
);

export function isResidenceCountryCode(
  value: string | null | undefined,
): value is ResidenceCountryCode {
  if (!value?.trim()) return false;
  return RESIDENCE_COUNTRY_CODE_SET.has(value.trim().toUpperCase());
}

export function isSelectableResidenceCountry(
  value: string | null | undefined,
): boolean {
  if (!value?.trim()) return false;
  return SELECTABLE_RESIDENCE_COUNTRY_CODE_SET.has(
    value.trim().toUpperCase(),
  );
}

export function getDefaultSelectableResidenceCountry(): ResidenceCountryCode {
  return SELECTABLE_RESIDENCE_COUNTRY_CODES[0] ?? RESIDENCE_COUNTRY_FR;
}

/** Picker options: launched countries, plus the current profile country if it was hidden. */
export function getResidenceCountriesForPicker(
  currentCode?: string | null,
): ResidenceCountryOption[] {
  const allowed = new Set<string>(SELECTABLE_RESIDENCE_COUNTRY_CODES);
  if (currentCode && isResidenceCountryCode(currentCode)) {
    allowed.add(currentCode.trim().toUpperCase());
  }
  return RESIDENCE_COUNTRIES.filter((option) => allowed.has(option.code));
}

/** Hide the country field when the only launched country is already selected (or unset). */
export function shouldShowResidenceCountryField(
  currentCode?: string | null,
): boolean {
  if (SELECTABLE_RESIDENCE_COUNTRY_CODES.length > 1) return true;
  if (!currentCode?.trim()) return false;
  return (
    isResidenceCountryCode(currentCode) &&
    !isSelectableResidenceCountry(currentCode)
  );
}

export function requiresFrenchDepartment(
  country: ResidenceCountryCode,
): boolean {
  return country === RESIDENCE_COUNTRY_FR;
}

/** Libellé localisé pour un code pays (clés `profile.residenceCountry.*`). */
export function getResidenceCountryLabel(
  code: string | null | undefined,
  translate: (key: string) => string,
): string {
  if (!code?.trim()) return "";
  const upper = code.trim().toUpperCase();
  const option = RESIDENCE_COUNTRIES.find((c) => c.code === upper);
  return option ? translate(option.labelKey) : upper;
}
