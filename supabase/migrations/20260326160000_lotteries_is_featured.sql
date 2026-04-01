ALTER TABLE public.lotteries
ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS lotteries_is_featured_true_idx
ON public.lotteries (is_featured)
WHERE is_featured = true;

