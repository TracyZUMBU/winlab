import { parseSurveyDefinition } from "../../../lib/parseSurveyDefinition";
import { normalizeSurveyDraftIds } from "./normalizeSurveyDraftIds";
import type { SurveyDraft, SurveyDraftQuestion } from "./surveyDraft.types";

function nn(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

function questionToStorage(q: SurveyDraftQuestion): Record<string, unknown> {
  const id = q.id.trim();
  const label = q.label.trim();
  const next = nn(q.nextQuestionId);

  if (q.type === "text") {
    return {
      id,
      label,
      type: "text",
      nextQuestionId: next,
    };
  }

  const options = q.options.map((o) => ({
    id: o.id.trim(),
    label: o.label.trim(),
    nextQuestionId: nn(o.nextQuestionId),
  }));

  return {
    id,
    label,
    type: q.type,
    options,
    nextQuestionId: next,
  };
}

export type SerializeSurveyDraftResult =
  | { ok: true; metadata: Record<string, unknown> }
  | { ok: false; message: string };

export function serializeSurveyDraftToMetadata(
  draft: SurveyDraft,
): SerializeSurveyDraftResult {
  if (draft.questions.length === 0) {
    return { ok: false, message: "Ajoutez au moins une question." };
  }

  draft = normalizeSurveyDraftIds(draft);

  const seenQ = new Set<string>();
  for (const q of draft.questions) {
    const id = q.id.trim();
    if (!id) {
      return { ok: false, message: "Chaque question doit avoir un identifiant non vide." };
    }
    if (seenQ.has(id)) {
      return {
        ok: false,
        message: `Identifiant de question dupliqué : « ${id} ».`,
      };
    }
    seenQ.add(id);

    if (!q.label.trim()) {
      return {
        ok: false,
        message: `Libellé manquant pour la question « ${id} ».`,
      };
    }

    if (q.type !== "text") {
      if (q.options.length === 0) {
        return {
          ok: false,
          message: `La question « ${id} » doit avoir au moins une option.`,
        };
      }
      const seenOpt = new Set<string>();
      for (const o of q.options) {
        const oid = o.id.trim();
        const olab = o.label.trim();
        if (!oid || !olab) {
          return {
            ok: false,
            message: `Option invalide (id / libellé) pour la question « ${id} ».`,
          };
        }
        if (seenOpt.has(oid)) {
          return {
            ok: false,
            message: `Identifiant d’option dupliqué « ${oid} » dans la question « ${id} ».`,
          };
        }
        seenOpt.add(oid);
      }
    }
  }

  const start = draft.startQuestionId.trim();
  if (!start) {
    return { ok: false, message: "Choisissez la question de départ." };
  }
  if (!seenQ.has(start)) {
    return {
      ok: false,
      message: "La question de départ doit correspondre à l’identifiant d’une question.",
    };
  }

  for (const q of draft.questions) {
    const qNext = q.nextQuestionId.trim();
    if (qNext !== "" && !seenQ.has(qNext)) {
      return {
        ok: false,
        message: `Suite invalide après « ${q.id.trim()} » : la question « ${qNext} » n’existe pas.`,
      };
    }
    for (const o of q.options) {
      const oNext = o.nextQuestionId.trim();
      if (oNext !== "" && !seenQ.has(oNext)) {
        return {
          ok: false,
          message: `Branche invalide sur une option de « ${q.id.trim()} » : « ${oNext} » n’existe pas.`,
        };
      }
    }
  }

  const questions = draft.questions.map((q) => questionToStorage(q));
  const survey = { startQuestionId: start, questions };

  if (parseSurveyDefinition({ survey }) === null) {
    return {
      ok: false,
      message:
        "Parcours du sondage invalide (vérifiez les enchaînements : chaque « suite » doit pointer vers une question existante ou vers la fin).",
    };
  }

  return { ok: true, metadata: { survey } };
}
