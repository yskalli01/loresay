# Debug auth error feedback

## Goal

Fix the auth screen so account creation and login failures expose a safe, useful reason instead of always showing the generic messages:

- `We could not create that account.`
- `We could not sign you in with those credentials.`

This should make the current signup failure diagnosable in the UI.

## Skills read

- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/supabase-postgres-best-practices/SKILL.md`

Supabase Auth debugging guidance says to rely on Auth error `code` values rather than string matching. Supabase documents relevant codes such as `weak_password`, `email_exists`, `email_not_confirmed`, `signup_disabled`, `email_provider_disabled`, `over_email_send_rate_limit`, and `over_request_rate_limit`.

## Code inspected

- `src/app/auth/actions.ts`
- `src/app/auth/auth-form.tsx`
- `src/infrastructure/supabase/server.ts`
- `src/infrastructure/supabase/admin.ts`
- `src/env.ts`
- `src/infrastructure/db/client.ts`
- `scripts/verify-live-schema.mjs`

## Findings

- `pnpm run db:verify` succeeds with network permission.
- The live schema has all expected tables and RLS policies.
- A disposable Hotmail signup succeeds against the configured Supabase project.
- The two likely email spellings from the screenshots do not exist in Supabase Auth.
- The auth action currently collapses every signup error to the same generic message.
- The likely next failure class is password policy or another Supabase Auth code hidden by the app.

## Decisions and assumptions

- Keep credentials enumeration protections for sign-in. Do not reveal whether an account exists during login unless Supabase returns a state the user must act on, such as email confirmation.
- For signup, show safe remediation-oriented messages for common Auth error codes.
- Use `error.code` and `error.name` where available, not string matching on `error.message`.
- Do not log passwords or secrets.
- Optionally include a server-side `console.warn` with non-sensitive Auth error metadata in development only.
- Keep the implementation in the existing server action layer unless tests reveal a cleaner local pattern.

## Files expected to touch

- `src/app/auth/actions.ts`
- Existing auth tests if present, otherwise a focused new test beside auth actions or within the current app test pattern.

## Requirements

1. Map Supabase signup errors to specific safe messages:
   - `weak_password`: tell the user to use a stronger password with uppercase, lowercase, number, and symbol.
   - `email_exists` or `user_already_exists`: tell the user the account may already exist and to sign in.
   - `email_address_invalid`: tell the user to use a real email address.
   - `signup_disabled` or `email_provider_disabled`: tell the user email signup is disabled.
   - rate limit codes: tell the user to wait and retry.
   - fallback: keep the generic account creation message.
2. Map sign-in errors safely:
   - `email_not_confirmed`: tell the user to confirm their email before signing in.
   - rate limit codes: tell the user to wait and retry.
   - fallback: keep the generic credentials message.
3. Keep successful signup/login behavior unchanged.
4. Do not expose raw provider messages directly to users.
5. Do not change Supabase keys or database schema.

## Security considerations

- Avoid account enumeration on sign-in.
- Never print or return passwords.
- Never expose `SUPABASE_SECRET_KEY`.
- Signup messages may mention duplicate accounts because the user is creating an account, but keep phrasing non-enumerative where possible.

## Acceptance criteria

1. The auth form displays a helpful message for weak passwords.
2. The auth form still displays generic invalid-credentials copy for ordinary failed sign-ins.
3. Email-not-confirmed sign-in failures display a confirmation-specific message.
4. Tests cover the new error mapping.
5. `pnpm run test:core` passes.

## Checks to run

1. `pnpm run test:core`
2. If the auth test is outside `test:core`, also run the focused Vitest command for that file.

## Manual test steps

1. Open `http://localhost:3000/auth`.
2. Switch to Create account.
3. Enter the same email from the screenshot.
4. Try a weak password and confirm the UI explains the password issue.
5. Try a strong password such as one with uppercase, lowercase, number, and symbol.
6. Confirm the app either redirects on success or displays the next specific Supabase Auth message.
