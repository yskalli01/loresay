"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn, Mail, UserPlus } from "lucide-react";

import { Button, Card, CardBody, Input, Label } from "@/presentation/ui";

import {
  type AuthActionState,
  requestPasswordReset,
  signInWithPassword,
  signUpWithPassword,
} from "./actions";

const initialState: AuthActionState = {};

type AuthMode = "reset" | "sign-in" | "sign-up";

function AuthFields({
  mode,
  onResetPassword,
}: {
  mode: AuthMode;
  onResetPassword: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const action =
    mode === "reset"
      ? requestPasswordReset
      : mode === "sign-in"
        ? signInWithPassword
        : signUpWithPassword;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4 lg:space-y-5">
      {mode === "sign-up" ? (
        <div className="space-y-1.5 lg:space-y-2">
          <Label htmlFor="display-name">Name</Label>
          <Input
            autoComplete="name"
            id="display-name"
            maxLength={80}
            name="displayName"
            placeholder="Your name"
            required
          />
        </div>
      ) : null}
      <div className="space-y-1.5 lg:space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          autoComplete="email"
          id="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </div>
      {mode !== "reset" ? (
        <div className="space-y-1.5 lg:space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="password">Password</Label>
            {mode === "sign-in" ? (
              <button
                className="min-h-11 text-sm font-medium text-accent underline-offset-4 hover:underline"
                onClick={onResetPassword}
                type="button"
              >
                Forgot password?
              </button>
            ) : null}
          </div>
          <div className="relative">
            <Input
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              className="pr-12"
              id="password"
              minLength={8}
              name="password"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-controls="password"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-sm text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      ) : null}
      {state.error ? (
        <p
          className="rounded-md border border-error/40 bg-error-soft px-3 py-2 text-sm text-error"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p
          className="rounded-md border border-success/20 bg-success-tint px-3 py-2 text-sm font-medium text-success-strong"
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <Button
        className="w-full"
        disabled={pending}
        icon={
          mode === "reset" ? (
            <Mail className="h-4 w-4" />
          ) : mode === "sign-in" ? (
            <LogIn className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )
        }
        type="submit"
      >
        {pending
          ? "Working..."
          : mode === "reset"
            ? "Send reset link"
            : mode === "sign-in"
              ? "Sign in"
              : "Create account"}
      </Button>
    </form>
  );
}

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("sign-in");

  return (
    <Card
      className="w-full border-border-subtle shadow-panel"
      data-testid="auth-card"
    >
      <CardBody className="space-y-4 p-6 sm:px-9 lg:space-y-6 lg:py-9">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-ink text-balance">
            {mode === "sign-in"
              ? "Sign in to your knowledge"
              : mode === "sign-up"
                ? "Create your workspace"
                : "Reset your password"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-body">
            {mode === "reset"
              ? "Enter your account email and we will send you a secure reset link."
              : "Save private notes, ask grounded questions, and keep every answer tied to its source."}
          </p>
        </div>

        <AuthFields
          key={mode}
          mode={mode}
          onResetPassword={() => setMode("reset")}
        />

        <div className="border-t border-border-subtle pt-2 text-center lg:pt-5">
          <p className="text-sm text-body">
            {mode === "sign-in"
              ? "New to Loresay?"
              : mode === "sign-up"
                ? "Already use Loresay?"
                : "Remember your password?"}{" "}
            <button
              className="min-h-11 font-medium text-accent underline-offset-4 hover:underline"
              onClick={() =>
                setMode(mode === "sign-in" ? "sign-up" : "sign-in")
              }
              type="button"
            >
              {mode === "sign-in" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
