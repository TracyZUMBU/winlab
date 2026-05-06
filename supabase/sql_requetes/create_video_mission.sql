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
  metadata,
  rules_text
)
SELECT
  b.id,
  'Tuto avec Fructose',
  'Fructose, propose un nouveau couteau électrique pour couper les oranges.',
  'video'::public.mission_type,
  20,
  'active'::public.mission_status,
  1,
  'automatic'::public.mission_validation_mode,
  '{
    "video_url": "https://avtshare01.rz.tu-ilmenau.de/avt-vqdb-uhd-1/test_1/segments/cutting_orange_tuil_15000kbps_1080p_59.94fps_h264.mp4",
    "min_watch_duration_seconds": null,
    "title": "Titre de la vidéo",
    "thumbnail_url": "https://example.com/thumbnail.jpg"
  }'::jsonb,
  e'## Règlement\n\nVoir les conditions dans l''application.'
FROM public.brands b
WHERE b.is_active = true
ORDER BY b.created_at ASC
LIMIT 1;
