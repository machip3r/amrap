-- Harden gym_payment_accounts secrets.
-- OAuth access_token / refresh_token / token_expires_at must not be readable via the
-- Data API as authenticated gym staff (RLS alone still returned full rows).

-- ---------------------------------------------------------------------------
-- Privileges: authenticated may only SELECT non-secret columns.
-- Mutations (connect / refresh / disconnect) stay service-role only.
-- ---------------------------------------------------------------------------
revoke all on table public.gym_payment_accounts from anon;
revoke all on table public.gym_payment_accounts from authenticated;

grant select (
  id,
  gym_id,
  provider,
  status,
  external_user_id,
  public_key,
  live_mode,
  connected_at,
  disconnected_at,
  last_error,
  created_at,
  updated_at
) on table public.gym_payment_accounts to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: only gym managers (and platform admin) may read the public columns.
-- Drop authenticated write policies — grants already block DML.
-- ---------------------------------------------------------------------------
drop policy if exists gym_payment_accounts_select on public.gym_payment_accounts;
create policy gym_payment_accounts_select on public.gym_payment_accounts for
select using (
  private.is_platform_admin ()
  or private.can_manage_gym (gym_id)
);

drop policy if exists gym_payment_accounts_write on public.gym_payment_accounts;

comment on table public.gym_payment_accounts is
  'Per-gym connected payment providers (OAuth). access_token / refresh_token / token_expires_at are service-role only; authenticated may SELECT status columns for managers.';

comment on column public.gym_payment_accounts.access_token is
  'OAuth access token — service role only (no grant to authenticated).';

comment on column public.gym_payment_accounts.refresh_token is
  'OAuth refresh token — service role only (no grant to authenticated).';

comment on column public.gym_payment_accounts.token_expires_at is
  'Access token expiry — service role only (no grant to authenticated).';
