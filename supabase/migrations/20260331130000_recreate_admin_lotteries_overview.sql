-- Recrée `admin_lotteries_overview` après suppression involontaire dans
-- `20260331121509_remote_schema.sql` (drop view). Les environnements déjà migrés
-- n’avaient plus la vue ; le backoffice lit cette vue via PostgREST.

CREATE OR REPLACE VIEW public.admin_lotteries_overview AS
SELECT
  l.id AS lottery_id,
  l.title,
  l.status,
  l.starts_at,
  l.ends_at,
  l.draw_at,
  l.ticket_cost,
  l.number_of_winners,
  b.name AS brand_name,
  COALESCE(tc.tickets_count, 0)::bigint AS tickets_count,
  COALESCE(wc.winners_count, 0)::bigint AS winners_count
FROM public.lotteries l
LEFT JOIN public.brands b
  ON b.id = l.brand_id
LEFT JOIN (
  SELECT
    lt.lottery_id,
    COUNT(*)::bigint AS tickets_count
  FROM public.lottery_tickets lt
  GROUP BY lt.lottery_id
) tc
  ON tc.lottery_id = l.id
LEFT JOIN (
  SELECT
    lw.lottery_id,
    COUNT(*)::bigint AS winners_count
  FROM public.lottery_winners lw
  GROUP BY lw.lottery_id
) wc
  ON wc.lottery_id = l.id;

ALTER VIEW public.admin_lotteries_overview OWNER TO postgres;

COMMENT ON VIEW public.admin_lotteries_overview IS
  'Admin Winlab : synthèse par loterie (libellés, dates, coût, marque, nombre de tickets et de gagnants). Ne pas exposer au client grand public sans contrôle d’accès (RLS, rôle service, ou auth admin dédiée).';
