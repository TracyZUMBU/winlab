-- Wallet enums for signup bonus (must be committed before use in a later migration; PG 55P04).

ALTER TYPE public.wallet_transaction_type
ADD VALUE IF NOT EXISTS 'signup_bonus';

ALTER TYPE public.wallet_reference_type
ADD VALUE IF NOT EXISTS 'profile';
