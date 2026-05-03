import { type FormEvent, useCallback, useState } from "react";

import { pushAdminMvpErrorMessage } from "../pushAdminMvpErrorMessages";
import { sendAdminPushMvp } from "../services/sendAdminPushMvp";

/** Formulaire MVP : un destinataire, titre + corps, envoi immédiat. */
export function PushAdminMvpPage() {
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
    | null
  >(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setFeedback(null);
      setIsSending(true);

      const result = await sendAdminPushMvp({
        userId,
        title,
        body,
      });

      if (!result.success) {
        setFeedback({
          kind: "error",
          message: pushAdminMvpErrorMessage(result.errorCode),
        });
        setIsSending(false);
        return;
      }

      if (result.data.skippedNoToken) {
        setFeedback({
          kind: "success",
          message:
            "Requête acceptée : aucun token push enregistré pour cet utilisateur (ou appareil retiré). Aucune notification affichée.",
        });
      } else {
        setFeedback({
          kind: "success",
          message: "Notification envoyée.",
        });
      }
      setIsSending(false);
    },
    [userId, title, body],
  );

  return (
    <section className="page-push-mvp" aria-labelledby="push-mvp-heading">
      <h2 id="push-mvp-heading" className="page-push-mvp__heading">
        Push (MVP)
      </h2>
      <p className="page-push-mvp__intro">
        Envoi immédiat vers un profil cible (<code className="page-push-mvp__code">profiles.id</code>
        ). Texte en français. Un utilisateur à la fois ; pas d’historique pour cette version.
      </p>

      {feedback?.kind === "error" && (
        <div className="page-push-mvp__alert page-push-mvp__alert--error" role="alert">
          {feedback.message}
        </div>
      )}
      {feedback?.kind === "success" && (
        <div className="page-push-mvp__alert page-push-mvp__alert--success" role="status">
          {feedback.message}
        </div>
      )}

      <form className="page-push-mvp__form" onSubmit={handleSubmit}>
        <div className="page-push-mvp__field">
          <label className="page-push-mvp__label" htmlFor="push-mvp-user-id">
            ID utilisateur (UUID)
          </label>
          <input
            id="push-mvp-user-id"
            className="page-push-mvp__input"
            type="text"
            name="userId"
            autoComplete="off"
            spellCheck={false}
            value={userId}
            onChange={(ev) => setUserId(ev.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            disabled={isSending}
            required
          />
        </div>
        <div className="page-push-mvp__field">
          <label className="page-push-mvp__label" htmlFor="push-mvp-title">
            Titre
          </label>
          <input
            id="push-mvp-title"
            className="page-push-mvp__input"
            type="text"
            name="title"
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
            disabled={isSending}
            required
          />
        </div>
        <div className="page-push-mvp__field">
          <label className="page-push-mvp__label" htmlFor="push-mvp-body">
            Message
          </label>
          <textarea
            id="push-mvp-body"
            className="page-push-mvp__textarea"
            name="body"
            rows={4}
            value={body}
            onChange={(ev) => setBody(ev.target.value)}
            disabled={isSending}
            required
          />
        </div>
        <div className="page-push-mvp__actions">
          <button type="submit" className="page-push-mvp__submit" disabled={isSending}>
            {isSending ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </form>
    </section>
  );
}
