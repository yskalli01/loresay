/* eslint-disable @next/next/no-img-element */
"use client";

import { Camera, Mail, Shield, Trash2, UserRound, X } from "lucide-react";
import { useActionState, type ReactNode } from "react";

import {
  type AccountActionState,
  deleteAccountAction,
  removeProfileImageAction,
  updateEmailAction,
  updatePasswordAction,
  updateProfileAction,
  uploadProfileImageAction,
} from "@/app/account/actions";
import { Button, FileUploadField, Input } from "@/presentation/ui";

const initialState: AccountActionState = {};

type AccountFormsProps = {
  avatarUrl: string | null;
  displayName: string;
  email: string;
};

function ActionMessage({ state }: { state: AccountActionState }) {
  if (state.error) {
    return <p className="text-sm font-medium text-error">{state.error}</p>;
  }

  if (state.message) {
    return (
      <p className="text-sm font-medium text-success-strong">{state.message}</p>
    );
  }

  return null;
}

function AccountSection({
  children,
  description,
  icon,
  id,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: ReactNode;
  id: string;
  title: string;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="scroll-mt-20 border-t border-border-subtle px-4 py-6 first:border-t-0 sm:px-6 lg:px-8 lg:py-8"
      id={id}
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-tint text-accent">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-bold text-ink" id={`${id}-title`}>
            {title}
          </h2>
          <p className="mt-1 text-sm text-body">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function AccountForms({
  avatarUrl,
  displayName,
  email,
}: AccountFormsProps) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const [avatarState, avatarAction, avatarPending] = useActionState(
    uploadProfileImageAction,
    initialState,
  );
  const [removeAvatarState, removeAvatarAction, removeAvatarPending] =
    useActionState(removeProfileImageAction, initialState);
  const [emailState, emailAction, emailPending] = useActionState(
    updateEmailAction,
    initialState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updatePasswordAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAccountAction,
    initialState,
  );

  const initials = (displayName || email || "U")
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const accountAvatar = (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-accent-tint text-base font-bold text-accent shadow-control">
      {avatarUrl ? (
        <img
          alt="Profile avatar"
          className="h-full w-full object-cover"
          src={avatarUrl}
        />
      ) : (
        initials || <Camera className="h-6 w-6" aria-hidden="true" />
      )}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-card">
      <div className="grid border-b border-border-subtle md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex min-w-0 items-center gap-3 border-b border-border-subtle px-4 py-4 md:border-b-0 md:border-r sm:px-5">
          {accountAvatar}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{displayName}</p>
            <p className="truncate text-xs text-body">{email}</p>
          </div>
        </div>
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-normal text-ink">
            Account
          </h1>
          <p className="mt-1 text-sm text-body">
            Manage your identity, security, and profile photo.
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <AccountSection
          description="Update the name and image shown across your private workspace."
          icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
          id="profile"
          title="Profile"
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
            <div>
              <p className="text-sm font-semibold text-ink">Profile photo</p>
              <div className="mt-3 flex flex-col gap-4 rounded-md bg-surface-subtle p-4 sm:flex-row sm:items-center">
                {accountAvatar}
                <div className="min-w-0 flex-1 space-y-3">
                  <form action={avatarAction} className="space-y-3">
                    <FileUploadField
                      accept="image/jpeg,image/png,image/webp"
                      description="JPEG, PNG, or WebP up to 4 MB"
                      kind="image"
                      label="Choose profile photo"
                      name="avatar"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={avatarPending} size="sm" type="submit">
                        {avatarPending ? "Uploading..." : "Upload photo"}
                      </Button>
                    </div>
                  </form>
                  <form action={removeAvatarAction}>
                    <Button
                      disabled={removeAvatarPending || !avatarUrl}
                      icon={<X className="h-4 w-4" />}
                      size="sm"
                      type="submit"
                      variant="secondary"
                    >
                      Remove photo
                    </Button>
                  </form>
                </div>
              </div>
              <div className="mt-3" role="status">
                <ActionMessage state={avatarState} />
                <ActionMessage state={removeAvatarState} />
              </div>
            </div>
            <form action={profileAction} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">
                  Display name
                </span>
                <Input
                  defaultValue={displayName}
                  maxLength={80}
                  name="displayName"
                  placeholder="Your name"
                />
              </label>
              <Button disabled={profilePending} type="submit">
                {profilePending ? "Saving..." : "Save profile"}
              </Button>
              <div role="status">
                <ActionMessage state={profileState} />
              </div>
            </form>
          </div>
        </AccountSection>

        <AccountSection
          description="Change the email address you use to sign in."
          icon={<Mail className="h-4 w-4" aria-hidden="true" />}
          id="identity"
          title="Identity"
        >
          <form
            action={emailAction}
            className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
          >
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">Email</span>
              <Input defaultValue={email} name="email" type="email" />
            </label>
            <Button disabled={emailPending} type="submit">
              {emailPending ? "Updating..." : "Update email"}
            </Button>
            <div className="lg:col-span-2" role="status">
              <ActionMessage state={emailState} />
            </div>
          </form>
        </AccountSection>

        <AccountSection
          description="Use at least eight characters for your new password."
          icon={<Shield className="h-4 w-4" aria-hidden="true" />}
          id="security"
          title="Password"
        >
          <form
            action={passwordAction}
            className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
          >
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">
                New password
              </span>
              <Input
                autoComplete="new-password"
                minLength={8}
                name="password"
                placeholder="At least 8 characters"
                type="password"
              />
            </label>
            <Button disabled={passwordPending} type="submit">
              {passwordPending ? "Updating..." : "Update password"}
            </Button>
            <div className="lg:col-span-2" role="status">
              <ActionMessage state={passwordState} />
            </div>
          </form>
        </AccountSection>

        <AccountSection
          description="Permanently remove your account and all of its saved data."
          icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
          id="account-closure"
          title="Account closure"
        >
          <div className="rounded-md border border-error/30 bg-error-tint/40 p-4">
            <form
              action={deleteAction}
              className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
            >
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">
                  Type DELETE to confirm
                </span>
                <Input name="confirmation" placeholder="DELETE" />
              </label>
              <Button disabled={deletePending} type="submit" variant="danger">
                {deletePending ? "Deleting..." : "Delete account"}
              </Button>
              <div className="lg:col-span-2" role="status">
                <ActionMessage state={deleteState} />
              </div>
            </form>
          </div>
        </AccountSection>
      </div>
    </div>
  );
}
