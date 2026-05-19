type ExternalActionMissionMetadataFieldsProps = {
  externalUrl: string;
  platform: string;
  actionLabel: string;
  minSeconds: string;
  onExternalUrlChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onActionLabelChange: (value: string) => void;
  onMinSecondsChange: (value: string) => void;
};

export function ExternalActionMissionMetadataFields({
  externalUrl,
  platform,
  actionLabel,
  minSeconds,
  onExternalUrlChange,
  onPlatformChange,
  onActionLabelChange,
  onMinSecondsChange,
}: ExternalActionMissionMetadataFieldsProps) {
  return (
    <>
      <div className="mission-create-form__field mission-create-form__field--full">
        <label
          className="mission-create-form__label"
          htmlFor="mission-create-external-url"
        >
          URL à ouvrir
        </label>
        <input
          id="mission-create-external-url"
          className="mission-create-form__control"
          type="url"
          inputMode="url"
          placeholder="https://instagram.com/…"
          value={externalUrl}
          onChange={(e) => onExternalUrlChange(e.target.value)}
          required
        />
      </div>
      <div className="mission-create-form__field">
        <label
          className="mission-create-form__label"
          htmlFor="mission-create-external-platform"
        >
          Plateforme
        </label>
        <input
          id="mission-create-external-platform"
          className="mission-create-form__control"
          type="text"
          placeholder="instagram, tiktok…"
          value={platform}
          onChange={(e) => onPlatformChange(e.target.value)}
          required
          autoComplete="off"
        />
      </div>
      <div className="mission-create-form__field mission-create-form__field--full">
        <label
          className="mission-create-form__label"
          htmlFor="mission-create-external-label"
        >
          Libellé du bouton
        </label>
        <input
          id="mission-create-external-label"
          className="mission-create-form__control"
          type="text"
          placeholder="Suivre sur Instagram"
          value={actionLabel}
          onChange={(e) => onActionLabelChange(e.target.value)}
          required
          autoComplete="off"
        />
      </div>
      <div className="mission-create-form__field">
        <label
          className="mission-create-form__label"
          htmlFor="mission-create-external-min"
        >
          Délai min. (secondes)
        </label>
        <input
          id="mission-create-external-min"
          className="mission-create-form__control"
          type="number"
          min={0}
          step={1}
          placeholder="vide = pas de délai"
          value={minSeconds}
          onChange={(e) => onMinSecondsChange(e.target.value)}
        />
      </div>
    </>
  );
}
