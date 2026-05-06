-- Profiles: home department code (France only, no DOM-TOM yet).
-- Nullable for legacy rows; app enforces required field in forms.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department_code text;

COMMENT ON COLUMN public.profiles.department_code IS 'French home department code (metropolitan only): 01..95 + 2A/2B. Nullable for legacy accounts.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.conname = 'profiles_department_code_allowed_values_check'
      AND n.nspname = 'public'
      AND t.relname = 'profiles'
  ) THEN
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
          '90','91','92','93','94','95'
        )
      );
  END IF;
END $$;

