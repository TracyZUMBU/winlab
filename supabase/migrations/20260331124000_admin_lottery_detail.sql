-- Vue « une ligne par loterie » pour le backoffice admin Winlab : détail + agrégats + gagnants en JSON.
-- Expose des données sensibles (emails profils) : restreindre l’accès (RLS / rôle / auth admin).
-- Dépend des colonnes `lotteries.short_description` et `lotteries.is_featured` (migration 20260331121509).
-- Les RLS des tables sous-jacentes s’appliquent selon le rôle invocateur.

CREATE OR REPLACE VIEW public.admin_lottery_detail AS
SELECT
  l.id AS lottery_id,
  l.title,
  l.description,
  l.short_description,
  l.status,
  l.category,
  l.slug,
  l.is_featured,
  l.ticket_cost,
  l.number_of_winners,
  l.starts_at,
  l.ends_at,
  l.draw_at,
  b.name AS brand_name,
  COALESCE(tc.tickets_count, 0)::bigint AS tickets_count,
  COALESCE(wc.winners_count, 0)::bigint AS winners_count,
  COALESCE(
    wj.winners,
    '[]'::jsonb
  ) AS winners
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
  ON wc.lottery_id = l.id
LEFT JOIN (
  SELECT
    lw.lottery_id,
    jsonb_agg(
      jsonb_build_object(
        'position', lw.position,
        'user_id', lw.user_id,
        'username', p.username,
        'email', p.email,
        'ticket_id', lw.ticket_id,
        'created_at', lw.created_at
      )
      ORDER BY lw.position ASC
    ) AS winners
  FROM public.lottery_winners lw
  LEFT JOIN public.profiles p
    ON p.id = lw.user_id
  GROUP BY lw.lottery_id
) wj
  ON wj.lottery_id = l.id;

ALTER VIEW public.admin_lottery_detail OWNER TO postgres;

COMMENT ON VIEW public.admin_lottery_detail IS
  'Admin Winlab : détail d’une loterie par ligne (infos, marque, comptages, tableau JSON des gagnants trié par position). Données sensibles (email) ; accès réservé au backoffice.';
