-- Seed: sample "video" mission (watch-to-end flow uses metadata + client proof).
-- Requires at least one row in public.brands with is_active = true; otherwise this INSERT affects 0 rows.

INSERT INTO public.missions (
  brand_id,
  title,
  description,
  mission_type,
  token_reward,
  status,
  max_completions_per_user,
  validation_mode,
  metadata
)
SELECT
  b.id,
  'Titre de la vidéo',
  'Regardez la vidéo jusqu''à la fin pour valider la mission.',
  'video'::public.mission_type,
  20,
  'active'::public.mission_status,
  1,
  'automatic'::public.mission_validation_mode,
  '{
    "video_url": "https://example.com/video.mp4",
    "min_watch_duration_seconds": null,
    "title": "Titre de la vidéo",
    "thumbnail_url": "https://example.com/thumbnail.jpg"
  }'::jsonb
FROM public.brands b
WHERE b.is_active = true
ORDER BY b.created_at ASC
LIMIT 1;
