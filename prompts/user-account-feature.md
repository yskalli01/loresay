# User account feature with profile image

## Goal

Build the approved user account feature for the AI Personal Knowledge Base. The feature adds an account dropdown from the header user icon and a full account page where a signed in user can manage their profile photo, display name, email, password, sign out, and delete the account.

## Skills read

- `/develop`
- `imagegen`
- `supabase`
- `supabase-postgres-best-practices`

## Code inspected

- `AGENTS.md`
- `design.md`
- `src/presentation/app/app-shell.tsx`
- `src/app/settings/page.tsx`
- `src/app/auth/actions.ts`
- `src/infrastructure/auth/session.ts`
- `src/infrastructure/supabase/server.ts`
- `src/infrastructure/db/schema.ts`
- `src/infrastructure/db/knowledge-repository.ts`
- `src/application/knowledge/repositories.ts`
- `src/app/page.test.tsx`
- `drizzle/0000_wild_secret_warriors.sql`
- `src/infrastructure/db/rls-policies.sql`

## Decisions and assumptions

- Profile images are stored in a private Supabase Storage bucket named `avatars`.
- The database stores only the avatar storage path and updated timestamp.
- Avatar object paths are derived from the session user id as `<user-id>/profile.<ext>`.
- Avatar display uses signed URLs generated server side.
- Allowed avatar types are JPEG, PNG, and WebP.
- Maximum avatar upload size is 2 MB.
- The account deletion section is called `Account closure`, not `Danger Zone`.
- Email and password changes use Supabase Auth `updateUser`.
- Account deletion removes the stored avatar, deletes the local profile row for app data cascade, deletes the Supabase Auth user through the admin API, then redirects to `/auth`.
- Server actions always derive the user id from the session and never trust posted owner ids.

## Expected files to touch

- `src/infrastructure/db/schema.ts`
- `src/infrastructure/db/knowledge-repository.ts`
- `src/application/knowledge/repositories.ts`
- `src/infrastructure/supabase/admin.ts`
- `src/infrastructure/supabase/account-storage.ts`
- `src/app/account/actions.ts`
- `src/app/account/page.tsx`
- `src/presentation/app/account-forms.tsx`
- `src/presentation/app/app-shell.tsx`
- `src/app/page.test.tsx`
- `src/infrastructure/db/schema.test.ts`
- `drizzle/0001_account_profiles.sql`

## Requirements

- Generate a preview UI image before code implementation.
- Add a header account dropdown.
- Add `/account` with Profile, Identity, Security, and Account closure sections.
- Show uploaded avatar in the header and account page when present.
- Let users upload and remove avatar images.
- Let users edit display name, email, and password.
- Let users sign out.
- Let users delete their account without a `Danger Zone` label or treatment.

## Security considerations

- Keep `SUPABASE_SECRET_KEY` server only.
- Use the Supabase admin client only in server files.
- Keep the avatar bucket private.
- Generate signed avatar URLs server side.
- Validate upload MIME type and size on the server.
- Remove old avatar objects when replacing or deleting an avatar.
- Use current session user id for every mutation.

## Acceptance criteria

- The generated UI preview is visible in the conversation.
- Header avatar menu renders from the shared app shell.
- `/account` renders account controls and signed in identity details.
- Avatar upload and removal update profile state.
- Email and password updates call Supabase Auth through server actions.
- Account deletion removes avatar, local profile data, and Auth user.
- The phrase `Danger Zone` is not introduced in the account UI.

## Checks to run

- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test:core`
- `pnpm run quality:deadline`

## Manual test steps

1. Visit `http://localhost:3000`.
2. Click the header user icon.
3. Confirm the account dropdown shows identity details, Account settings, Sign out, and Delete account.
4. Open `/account`.
5. Upload a JPEG, PNG, or WebP under 2 MB and confirm the avatar updates.
6. Remove the avatar and confirm the fallback avatar returns.
7. Change display name and confirm the page and header reflect it.
8. Change email and password with valid values and confirm status messages appear.
9. Submit Account closure with the required confirmation and confirm the session redirects to `/auth`.
