import {
  getDefaultSelectableResidenceCountry,
  getResidenceCountriesForPicker,
  RESIDENCE_COUNTRY_CH,
  RESIDENCE_COUNTRY_FR,
  RESIDENCE_COUNTRY_LU,
  shouldShowResidenceCountryField,
} from "./residenceCountries";

describe("residence country launch picker", () => {
  it("defaults new profiles to France", () => {
    expect(getDefaultSelectableResidenceCountry()).toBe(RESIDENCE_COUNTRY_FR);
  });

  it("hides the country field for France and empty values", () => {
    expect(shouldShowResidenceCountryField(undefined)).toBe(false);
    expect(shouldShowResidenceCountryField("")).toBe(false);
    expect(shouldShowResidenceCountryField(RESIDENCE_COUNTRY_FR)).toBe(false);
  });

  it("keeps the country field for an existing hidden-country profile", () => {
    expect(shouldShowResidenceCountryField(RESIDENCE_COUNTRY_CH)).toBe(true);
    expect(shouldShowResidenceCountryField(RESIDENCE_COUNTRY_LU)).toBe(true);
  });

  it("lists only France in the picker unless the current country is hidden", () => {
    expect(getResidenceCountriesForPicker().map((c) => c.code)).toEqual([
      RESIDENCE_COUNTRY_FR,
    ]);
    expect(
      getResidenceCountriesForPicker(RESIDENCE_COUNTRY_CH).map((c) => c.code),
    ).toEqual([RESIDENCE_COUNTRY_FR, RESIDENCE_COUNTRY_CH]);
  });
});
