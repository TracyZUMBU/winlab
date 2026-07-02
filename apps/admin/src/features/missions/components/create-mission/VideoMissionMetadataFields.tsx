type VideoMissionMetadataFieldsProps = {
  videoUrl: string;
  videoTitle: string;
  videoThumbnailUrl: string;
  onVideoUrlChange: (value: string) => void;
  onVideoTitleChange: (value: string) => void;
  onVideoThumbnailUrlChange: (value: string) => void;
};

export function VideoMissionMetadataFields({
  videoUrl,
  videoTitle,
  videoThumbnailUrl,
  onVideoUrlChange,
  onVideoTitleChange,
  onVideoThumbnailUrlChange,
}: VideoMissionMetadataFieldsProps) {
  return (
    <>
      <div className="mission-create-form__field mission-create-form__field--full">
        <label
          className="mission-create-form__label"
          htmlFor="mission-create-video-url"
        >
          URL de la vidéo
        </label>
        <input
          id="mission-create-video-url"
          className="mission-create-form__control"
          type="url"
          inputMode="url"
          placeholder="https://cdn.example.com/mission.mp4"
          value={videoUrl}
          onChange={(e) => onVideoUrlChange(e.target.value)}
          required
        />
        <p className="mission-create-form__hint">
          URL directe vers un fichier vidéo (MP4 ou flux HLS .m3u8), hébergé sur un
          CDN ou un stockage public. Les liens YouTube, Vimeo ou autres pages web
          ne sont pas lus par l’app mobile.
        </p>
      </div>
      <div className="mission-create-form__field mission-create-form__field--full">
        <label
          className="mission-create-form__label"
          htmlFor="mission-create-video-title"
        >
          Titre affiché (optionnel)
        </label>
        <input
          id="mission-create-video-title"
          className="mission-create-form__control"
          type="text"
          placeholder="Par défaut : même texte que l’URL"
          value={videoTitle}
          onChange={(e) => onVideoTitleChange(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="mission-create-form__field mission-create-form__field--full">
        <label
          className="mission-create-form__label"
          htmlFor="mission-create-video-thumb"
        >
          URL vignette (optionnel)
        </label>
        <input
          id="mission-create-video-thumb"
          className="mission-create-form__control"
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={videoThumbnailUrl}
          onChange={(e) => onVideoThumbnailUrlChange(e.target.value)}
        />
      </div>
    </>
  );
}
