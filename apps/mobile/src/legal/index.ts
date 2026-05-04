import type { LegalEntityInfo } from "./entityInfo";
import { legalEntityInfo } from "./entityInfo";
import { buildLotteryRegulationStandaloneDraftFr } from "./lotteryRegulationStandaloneDraftFr";
import { buildPrivacyPolicyEn, buildPrivacyPolicyFr } from "./privacyBodies";
import { buildTermsOfServiceEn, buildTermsOfServiceFr } from "./termsBodies";

export type { LegalEntityInfo } from "./entityInfo";
export { legalEntityInfo } from "./entityInfo";

export type LegalDocumentId = "privacy" | "terms" | "lotteryRules";

export function getLegalDocumentBody(
  id: LegalDocumentId,
  language: string | undefined,
  entity: LegalEntityInfo = legalEntityInfo,
): string {
  if (id === "lotteryRules") {
    return buildLotteryRegulationStandaloneDraftFr(entity);
  }
  const lang = (language ?? "fr").toLowerCase();
  const isFr = lang.startsWith("fr");
  if (id === "privacy") {
    return isFr ? buildPrivacyPolicyFr(entity) : buildPrivacyPolicyEn(entity);
  }
  return isFr ? buildTermsOfServiceFr(entity) : buildTermsOfServiceEn(entity);
}

/** Texte à copier vers un PDF ou une page web (FR uniquement pour l’instant). */
export function getLotteryRegulationStandaloneDraftFr(
  entity: LegalEntityInfo = legalEntityInfo,
): string {
  return buildLotteryRegulationStandaloneDraftFr(entity);
}
