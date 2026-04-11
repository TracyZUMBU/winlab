import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import type { MissionDetailState } from "../hooks/useMissionAdminDetail";
import { useMissionAdminDetail } from "../hooks/useMissionAdminDetail";
import { MissionDetailContent } from "./MissionDetailContent";

type MissionDetailPanelProps = {
  missionId: string;
  onClose: () => void;
};

function panelTitle(state: MissionDetailState): string {
  if (state.kind === "ok") {
    return state.detail.title;
  }
  if (state.kind === "loading") {
    return "Chargement…";
  }
  return "Détail mission";
}

/** Panneau latéral : overlay, fermeture clic extérieur, Escape, bouton fermer. */
export function MissionDetailPanel({ missionId, onClose }: MissionDetailPanelProps) {
  const state = useMissionAdminDetail(missionId);
  const title = panelTitle(state);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [missionId, onClose]);

  return createPortal(
    <div className="lottery-detail-panel">
      <button
        type="button"
        className="lottery-detail-panel__backdrop"
        aria-label="Fermer le panneau"
        onClick={onClose}
      />
      <div
        className="lottery-detail-panel__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="lottery-detail-panel__header">
          <h2 id={titleId} className="lottery-detail-panel__title">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="lottery-detail-panel__close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>
        <div className="lottery-detail-panel__body">
          <MissionDetailContent
            state={state}
            headingId="mission-detail-panel-heading"
            hideTitleWhenOk
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
