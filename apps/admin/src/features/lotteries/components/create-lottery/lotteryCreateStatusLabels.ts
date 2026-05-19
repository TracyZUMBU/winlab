import type { LotteryCreateStatus } from "../../types/lotteryAdmin";

export const LOTTERY_CREATE_STATUS_LABELS: Record<LotteryCreateStatus, string> =
  {
    draft: "Brouillon",
    active: "Active",
    closed: "Fermée",
    drawn: "Tirée",
  };

export const LOTTERY_CREATE_STATUS_HINTS: Record<LotteryCreateStatus, string> =
  {
    draft: "Non visible dans l’application.",
    active:
      "Visible : les utilisateurs peuvent acheter des tickets pendant la période d’ouverture.",
    closed:
      "Ventes terminées ; le tirage se fait depuis le détail de la loterie.",
    drawn: "Réservé aux loteries déjà tirées (reprise de données).",
  };
