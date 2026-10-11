/* eslint-disable @next/next/no-img-element */
"use client";

import { Camera, Mail, Shield, Trash2, Upload, UserRound, X } from "lucide-react";
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
import { Button, Card, CardBody, CardHeader, Input } from "@/presentation/ui";

const initialState: AccountActionState = {};

type AccountFormsProps = {
  avatarUrl: string | null;
  displayName: string;
  email: string;
  userId: string;
};

function ActionMessage({ state }: { state: AccountActionState }) {
  if (state.error) {
    return <p className="text-sm font-medium text-error">{state.error}</p>;
  }

  if (state.message) {
    return <p className="text-sm font-medium text-success-strong">{state.message}</p>;
  }

  return null;
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-tint text-accent">
        {icon}
      </span>
      <h2 className="text-base font-bold text-ink">{title}</h2>
    </div>
  );
}

export function AccountForms({
  avatarUrl,
  displayName,
  email,
  userId,
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

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <SectionTitle icon={<UserRound className="h-4 w-4" />} title="Profile" />
        </CardHeader>
        <CardBody className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink">Profile photo</p>
              <p className="mt-1 text-sm text-body">
                Upload a private image for your account menu and profile.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-accent-tint text-xl font-bold text-accent shadow-control">
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
              <div className="min-w-0 space-y-3">
                <form action={avatarAction} className="space-y-3">
                  <Input
                    accept="image/jpeg,image/png,image/webp"
                    name="avatar"
                    type="file"
                  />
                  <Button
                    disabled={avatarPending}
                    icon={<Upload className="h-4 w-4" />}
                    type="submit"
                  >
                    {avatarPending ? "Uploading..." : "Upload image"}
                  </Button>
                </form>
                <form action={removeAvatarAction}>
                  <Button
                    disabled={removeAvatarPending || !avatarUrl}
                    icon={<X className="h-4 w-4" />}
                    type="submit"
                    variant="secondary"
                  >
                    Remove photo
                  </Button>
                </form>
              </div>
            </div>
            <ActionMessage state={avatarState} />
            <ActionMessage state={removeAvatarState} />
          </div>

          <form action={profileAction} className="space-y-4">
            <div>
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
            </div>
            <Button disabled={profilePending} type="submit">
              {profilePending ? "Saving..." : "Save profile"}
            </Button>
            <ActionMessage state={profileState} />
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <SectionTitle icon={<Mail className="h-4 w-4" />} title="Identity" />
        </CardHeader>
        <CardBody className="grid gap-5 lg:grid-cols-2">
          <form action={emailAction} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">Email</span>
              <Input defaultValue={email} name="email" type="email" />
            </label>
            <Button disabled={emailPending} type="submit">
              {emailPending ? "Updating..." : "Update email"}
            </Button>
            <ActionMessage state={emailState} />
          </form>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">User id</p>
            <p className="break-all rounded-md border border-border-subtle bg-surface-raised px-3 py-3 font-mono text-xs text-body shadow-control">
              {userId}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <SectionTitle icon={<Shield className="h-4 w-4" />} title="Security" />
        </CardHeader>
        <CardBody>
          <form action={passwordAction} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">New password</span>
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
            <div className="lg:col-span-2">
              <ActionMessage state={passwordState} />
            </div>
          </form>
        </CardBody>
      </Card>

      <Card id="account-closure">
        <CardHeader>
          <SectionTitle icon={<Trash2 className="h-4 w-4" />} title="Account closure" />
        </CardHeader>
        <CardBody>
          <form action={deleteAction} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">
                Type DELETE to permanently delete your account and data.
              </span>
              <Input name="confirmation" placeholder="DELETE" />
            </label>
            <Button disabled={deletePending} type="submit" variant="danger">
              {deletePending ? "Deleting..." : "Delete account"}
            </Button>
            <div className="lg:col-span-2">
              <ActionMessage state={deleteState} />
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}


