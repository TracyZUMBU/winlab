/**
 * Identité de l’éditeur / responsable du traitement.
 * Les textes juridiques importent ces valeurs — à faire valider par un professionnel du droit.
 */
export type LegalEntityInfo = {
  tradeName: string;
  legalName: string;
  registeredAddress: string;
  contactEmail: string;
  siret?: string;
  dpoEmail?: string;
  hostingSummary: string;
  lastUpdatedFr: string;
  lastUpdatedEn: string;
};

export const legalEntityInfo: LegalEntityInfo = {
  tradeName: "Winlab",
  /** La forme juridique pourra évoluer (ex. vers une SAS) : mettre à jour ce champ et les documents. */
  legalName: "Tracy ZUMBU-GARCIA, auto-entrepreneur (France)",
  registeredAddress: "1 allée du Furet\n77186 Noisiel\nFrance",
  contactEmail: "contact@book-n-glow.fr",
  siret: "83307726600025",
  hostingSummary:
    "Données applicatives et compte : Supabase (https://supabase.com). " +
    "Notifications push : Expo et services associés (https://expo.dev). " +
    "Supervision d’exploitation (alertes techniques, sans profilage marketing à partir de ces seuls messages) : Slack (https://slack.com), via une fonction Edge hébergée chez Supabase. " +
    "Les sous-traitants publient leurs propres politiques et engagements contractuels types.",
  lastUpdatedFr: "4 mai 2026",
  lastUpdatedEn: "May 4, 2026",
};
