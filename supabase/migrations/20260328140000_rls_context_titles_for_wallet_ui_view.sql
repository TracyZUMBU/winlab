-- wallet_transactions_ui uses security_invoker: joins respect RLS on lotteries/missions.
-- Default policies hide draft lotteries and non-"available" missions, so context_title was NULL
-- for ticket purchases / mission rewards tied to those rows.
-- These policies OR with existing ones so holders / participants can still read titles for their own ledger context.

CREATE POLICY "Users can view lotteries they hold tickets for"
ON public.lotteries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.lottery_tickets lt
    WHERE lt.lottery_id = lotteries.id
      AND lt.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view missions they have a completion for"
ON public.missions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.mission_completions mc
    WHERE mc.mission_id = missions.id
      AND mc.user_id = auth.uid()
  )
);
