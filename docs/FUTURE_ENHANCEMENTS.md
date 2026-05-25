# Future Enhancements

## Multi-bank support

Additional parsers beyond BAC (e.g. BCR, Scotiabank Costa Rica). Each bank gets its own
directory under `app/internal/parser/parsers/` following the existing BAC pattern.

## Supabase auth middleware

Forward the user's JWT from the `Authorization` header to PostgREST so Row Level Security
policies enforce per-user data isolation. Required before the frontend can call the API
directly on behalf of a logged-in user.

## Drop HS256 JWT support

The auth middleware currently accepts both ES256 (Supabase's asymmetric signing, used by
all real user sessions) and HS256 (legacy symmetric secret, only used by manually generated
dev tokens). Once the legacy test tokens are no longer needed, remove the `case
*jwt.SigningMethodHMAC` branch in `app/internal/http/middleware/auth.go` and the
`JWTSecret` config field to harden the middleware to ES256-only.

## Transfer reconciliation UI

Expose `TransferService` results through the API so the frontend can review and confirm
auto-detected transfers between accounts.

## BCCR exchange rate integration

Fetch official Banco Central de Costa Rica rates for the transaction date when recording
cross-currency transfers, populating `transfers.exchange_rate` and setting
`exchange_source = 'bccr'`.
