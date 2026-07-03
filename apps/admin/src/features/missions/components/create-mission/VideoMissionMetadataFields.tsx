import { getHevcVideoUrlError } from "../../lib/videoCodecSupport";

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
  const hevcError = getHevcVideoUrlError(videoUrl);

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
          placeholder="https://cdn.example.com/mission-h264.mp4"
          value={videoUrl}
          onChange={(e) => onVideoUrlChange(e.target.value)}
          required
          aria-invalid={hevcError != null}
          aria-describedby="mission-create-video-url-hint mission-create-video-url-ios-hint"
        />
        <p
          id="mission-create-video-url-hint"
          className="mission-create-form__hint"
        >
          URL directe vers un fichier vidéo (MP4 ou flux HLS .m3u8), hébergé sur un
          CDN ou un stockage public. Les liens YouTube, Vimeo ou autres pages web
          ne sont pas lus par l’app mobile.
        </p>
        <p
          id="mission-create-video-url-ios-hint"
          className="mission-create-form__hint mission-create-form__hint--warning"
        >
          Compatibilité iOS : utilisez une vidéo encodée en{" "}
          <strong>H.264 (AVC)</strong>. Le format <strong>H.265 (HEVC)</strong>{" "}
          n’est pas lisible sur iPhone dans l’app (lecture OK sur Android
          uniquement).
        </p>
        {hevcError ? (
          <p className="mission-create-form__hint mission-create-form__field-error" role="alert">
            {hevcError}
          </p>
        ) : null}
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
          placeholder="Titre affiché dans l’app"
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
