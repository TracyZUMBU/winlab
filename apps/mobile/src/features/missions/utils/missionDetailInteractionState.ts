import type { MissionDetailCompletion } from "../services/getMissionById";

export type MissionDetailInteractionState =
  | { kind: "active" }
  | {
      kind: "active_after_rejection";
      latestCompletion: MissionDetailCompletion;
    }
  | {
      kind: "readonly_approved";
      latestCompletion: MissionDetailCompletion;
    }
  | {
      kind: "readonly_pending";
      latestCompletion: MissionDetailCompletion;
    };

function compareCompletionRecency(
  a: MissionDetailCompletion,
  b: MissionDetailCompletion,
): number {
  const tb = Date.parse(b.created_at);
  const ta = Date.parse(a.created_at);
  if (tb !== ta) return tb - ta;
  return b.id.localeCompare(a.id);
}

/**
 * Dernière soumission (par `created_at` desc) détermine l’interaction sur l’écran détail.
 */
export function resolveMissionDetailInteractionState(
  completions: MissionDetailCompletion[],
): MissionDetailInteractionState {
  if (completions.length === 0) {
    return { kind: "active" };
  }
  const sorted = [...completions].sort(compareCompletionRecency);
  const latest = sorted[0]!;

  switch (latest.status) {
    case "approved":
      return { kind: "readonly_approved", latestCompletion: latest };
    case "pending":
      return { kind: "readonly_pending", latestCompletion: latest };
    case "rejected":
      return { kind: "active_after_rejection", latestCompletion: latest };
    default:
      return { kind: "active" };
  }
}

export function isMissionDetailReadonlyOutcome(
  state: MissionDetailInteractionState,
): boolean {
  return state.kind === "readonly_approved" || state.kind === "readonly_pending";
}
