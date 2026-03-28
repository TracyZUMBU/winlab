CREATE OR REPLACE FUNCTION public.get_wallet_transactions_enriched()
RETURNS TABLE (
  id uuid,
  amount integer,
  direction public.wallet_direction,
  transaction_type public.wallet_transaction_type,
  reference_type public.wallet_reference_type,
  reference_id uuid,
  created_at timestamptz,
  context_title text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    wt.id,
    wt.amount,
    wt.direction,
    wt.transaction_type,
    wt.reference_type,
    wt.reference_id,
    wt.created_at,
    COALESCE(
      m.title,
      lo.title,
      ref.referral_code,
      (
        SELECT m2.title
        FROM public.mission_completions mc2
        INNER JOIN public.missions m2 ON m2.id = mc2.mission_id
        WHERE mc2.reward_transaction_id = wt.id
        LIMIT 1
      ),
      (
        SELECT l2.title
        FROM public.lottery_tickets ltx
        INNER JOIN public.lotteries l2 ON l2.id = ltx.lottery_id
        WHERE ltx.wallet_transaction_id = wt.id
        LIMIT 1
      )
    ) AS context_title
  FROM public.wallet_transactions wt
  LEFT JOIN public.mission_completions mc
    ON wt.reference_type = 'mission_completion'::public.wallet_reference_type
    AND wt.reference_id = mc.id
  LEFT JOIN public.missions m
    ON m.id = mc.mission_id
  LEFT JOIN public.lottery_tickets lt
    ON wt.reference_type = 'lottery_ticket'::public.wallet_reference_type
    AND wt.reference_id = lt.id
  LEFT JOIN public.lotteries lo
    ON lo.id = lt.lottery_id
  LEFT JOIN public.referrals ref
    ON wt.reference_type = 'referral'::public.wallet_reference_type
    AND wt.reference_id = ref.id
    AND ref.referrer_user_id = wt.user_id
  WHERE wt.user_id = auth.uid()
  ORDER BY wt.created_at DESC;
END;
$$;

ALTER FUNCTION public.get_wallet_transactions_enriched() OWNER TO postgres;

COMMENT ON FUNCTION public.get_wallet_transactions_enriched() IS
  'Wallet ledger + context_title: primary joins on reference_id; fallbacks via reward_transaction_id / wallet_transaction_id for legacy or inconsistent reference_id.';

REVOKE ALL ON FUNCTION public.get_wallet_transactions_enriched() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_wallet_transactions_enriched() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_wallet_transactions_enriched() TO service_role;
