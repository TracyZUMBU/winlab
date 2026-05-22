import {
  isResidenceCountryCode,
  requiresFrenchDepartment,
  type ResidenceCountryCode,
} from "../constants/residenceCountries";

export function normalizeProfileLocation(
  residenceCountry: ResidenceCountryCode,
  departmentCode: string | null | undefined,
): {
  residence_country: ResidenceCountryCode;
  department_code: string | null;
} {
  if (!requiresFrenchDepartment(residenceCountry)) {
    return { residence_country: residenceCountry, department_code: null };
  }

  const trimmed = departmentCode?.trim().toUpperCase();
  return {
    residence_country: residenceCountry,
    department_code: trimmed ? trimmed : null,
  };
}

export function parseResidenceCountryFromForm(
  value: string | undefined,
): ResidenceCountryCode | undefined {
  if (!value?.trim()) return undefined;
  const upper = value.trim().toUpperCase();
  return isResidenceCountryCode(upper) ? upper : undefined;
}
