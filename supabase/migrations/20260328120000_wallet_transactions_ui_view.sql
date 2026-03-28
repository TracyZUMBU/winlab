-- Enriched wallet transactions for mobile / UI: resolves a human context title from
-- reference_type + reference_id (mission title, lottery title, referral code).
-- security_invoker: RLS on underlying tables applies as the querying role (authenticated).

CREATE OR REPLACE VIEW public.wallet_transactions_ui
WITH (security_invoker = true) AS
SELECT
  wt.id,
  wt.user_id,
  wt.amount,
  wt.direction,
  wt.transaction_type,
  wt.reference_type,
  wt.reference_id,
  wt.description,
  wt.created_at,
  COALESCE(m.title, lo.title, ref.referral_code) AS context_title
FROM public.wallet_transactions wt
LEFT JOIN public.mission_completions mc
  ON wt.reference_type = 'mission_completion'::public.wallet_reference_type
  AND wt.reference_id = mc.id
  AND mc.user_id = wt.user_id
LEFT JOIN public.missions m
  ON m.id = mc.mission_id
LEFT JOIN public.lottery_tickets lt
  ON wt.reference_type = 'lottery_ticket'::public.wallet_reference_type
  AND wt.reference_id = lt.id
  AND lt.user_id = wt.user_id
LEFT JOIN public.lotteries lo
  ON lo.id = lt.lottery_id
LEFT JOIN public.referrals ref
  ON wt.reference_type = 'referral'::public.wallet_reference_type
  AND wt.reference_id = ref.id
  AND ref.referrer_user_id = wt.user_id;

COMMENT ON VIEW public.wallet_transactions_ui IS
  'Wallet ledger rows with context_title: mission title (mission_completion), lottery title (lottery_ticket), or referral_code (referral). May be NULL if reference is missing, RLS hides the joined row (e.g. expired mission listing policy), or type is purchase/admin.';

GRANT SELECT ON public.wallet_transactions_ui TO anon;
GRANT SELECT ON public.wallet_transactions_ui TO authenticated;
GRANT SELECT ON public.wallet_transactions_ui TO service_role;
