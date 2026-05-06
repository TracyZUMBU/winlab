-- Exemples de missions `external_action` (à coller dans le SQL Editor).
--
-- Prérequis : la valeur d’enum `external_action` doit déjà exister (migration
-- `20260510100100_mission_type_add_external_action.sql` appliquée, ou exécuter
-- dans une requête séparée puis valider avant ce script) :
--   ALTER TYPE public.mission_type ADD VALUE IF NOT EXISTS 'external_action';
--
-- Ne pas exécuter l’ALTER et les INSERT dans la même transaction : Postgres
-- refuse d’utiliser une nouvelle valeur d’enum avant commit (erreur 55P04).
--
-- Idempotence : chaque INSERT ne s’exécute que si aucune mission équivalente
-- (même brand, titre, mission_type) n’existe déjà — réexécuter le script ne
-- duplique pas les lignes.

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
  'Suivre Winlab sur Instagram',
  'Ouvre le profil Instagram, suis la page, puis reviens valider dans l’app.',
  'external_action'::public.mission_type,
  15,
  'active'::public.mission_status,
  1,
  'automatic'::public.mission_validation_mode,
  '{
    "external_url": "https://instagram.com/winlab",
    "platform": "instagram",
    "action_label": "Suivre sur Instagram",
    "min_external_duration_seconds": 5
  }'::jsonb,
  e'## Règlement\n\nVoir les conditions dans l''application.'
FROM public.brands b
WHERE b.is_active = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.missions m
    WHERE m.brand_id = b.id
      AND m.title = 'Suivre Winlab sur Instagram'
      AND m.mission_type = 'external_action'::public.mission_type
  )
ORDER BY b.created_at ASC
LIMIT 1;

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
  'Liker le post TikTok Winlab',
  'Ouvre la vidéo TikTok, like le post, puis reviens valider.',
  'external_action'::public.mission_type,
  15,
  'active'::public.mission_status,
  1,
  'automatic'::public.mission_validation_mode,
  '{
    "external_url": "https://tiktok.com/@winlab/video/123",
    "platform": "tiktok",
    "action_label": "Liker le post TikTok",
    "min_external_duration_seconds": 10
  }'::jsonb,
  e'## Règlement\n\nVoir les conditions dans l''application.'
FROM public.brands b
WHERE b.is_active = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.missions m
    WHERE m.brand_id = b.id
      AND m.title = 'Liker le post TikTok Winlab'
      AND m.mission_type = 'external_action'::public.mission_type
  )
ORDER BY b.created_at ASC
LIMIT 1;

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
  'Visiter le site vitrine',
  'Ouvre le site de la marque, reste quelques secondes, puis valide ici.',
  'external_action'::public.mission_type,
  15,
  'active'::public.mission_status,
  1,
  'automatic'::public.mission_validation_mode,
  '{
    "external_url": "https://example-brand.com",
    "platform": "website",
    "action_label": "Visiter le site",
    "min_external_duration_seconds": 15
  }'::jsonb,
  e'## Règlement\n\nVoir les conditions dans l''application.'
FROM public.brands b
WHERE b.is_active = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.missions m
    WHERE m.brand_id = b.id
      AND m.title = 'Visiter le site vitrine'
      AND m.mission_type = 'external_action'::public.mission_type
  )
ORDER BY b.created_at ASC
LIMIT 1;
