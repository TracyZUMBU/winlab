-- Profiles: country of residence (FR, CH, LU) and department rules.
-- FR: department_code required (metropolitan + Corse + DOM INSEE codes).
-- CH / LU: department_code must be NULL.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS residence_country text;

UPDATE public.profiles
SET residence_country = 'FR'
WHERE residence_country IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN residence_country SET NOT NULL;

COMMENT ON COLUMN public.profiles.residence_country IS
  'ISO 3166-1 alpha-2 country of residence: FR (France incl. DOM), CH, LU.';

COMMENT ON COLUMN public.profiles.department_code IS
  'French home department code when residence_country = FR: 01..95, 2A/2B, 971..976 (DOM). NULL for CH/LU.';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_department_code_allowed_values_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_department_code_allowed_values_check
  CHECK (
    department_code IS NULL OR department_code IN (
      '01','02','03','04','05','06','07','08','09',
      '10','11','12','13','14','15','16','17','18','19',
      '2A','2B',
      '21','22','23','24','25','26','27','28','29',
      '30','31','32','33','34','35','36','37','38','39',
      '40','41','42','43','44','45','46','47','48','49',
      '50','51','52','53','54','55','56','57','58','59',
      '60','61','62','63','64','65','66','67','68','69',
      '70','71','72','73','74','75','76','77','78','79',
      '80','81','82','83','84','85','86','87','88','89',
      '90','91','92','93','94','95',
      '971','972','973','974','976'
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.conname = 'profiles_residence_country_allowed_values_check'
      AND n.nspname = 'public'
      AND t.relname = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_residence_country_allowed_values_check
      CHECK (residence_country IN ('FR', 'CH', 'LU'));
  END IF;
END $$;

-- Legacy rows may have residence_country = FR (backfill) but department_code still NULL
-- (accounts created before the field was enforced in DB). NOT VALID: existing rows are
-- grandfathered until updated; INSERT/UPDATE must satisfy the rule.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.conname = 'profiles_residence_country_department_consistency_check'
      AND n.nspname = 'public'
      AND t.relname = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_residence_country_department_consistency_check
      CHECK (
        (
          residence_country = 'FR'
          AND department_code IS NOT NULL
        )
        OR (
          residence_country IN ('CH', 'LU')
          AND department_code IS NULL
        )
      ) NOT VALID;
  END IF;
END $$;
