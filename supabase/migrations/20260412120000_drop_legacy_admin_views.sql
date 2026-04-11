-- Legacy admin views replaced by public.admin_get_lotteries() and public.admin_get_lottery_detail(uuid).
-- The admin app reads data only via those RPCs; safe to drop the views.

DROP VIEW IF EXISTS public.admin_lottery_detail;
DROP VIEW IF EXISTS public.admin_lotteries_overview;

COMMENT ON COLUMN public.profiles.is_admin IS
  'When true, the user may use admin RPCs (admin_get_lotteries, admin_get_lottery_detail) and the Winlab admin UI. Only service_role or a direct postgres-class session should change this value.';
