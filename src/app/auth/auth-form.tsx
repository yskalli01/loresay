"use client";

import { useActionState, useState } from "react";
import { KeyRound, LogIn, UserPlus } from "lucide-react";

import { Button, Card, CardBody, Input, Label } from "@/presentation/ui";

import {
  type AuthActionState,
  signInWithPassword,
  signUpWithPassword,
} from "./actions";

const initialState: AuthActionState = {};

export function AuthForm() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const action = mode === "sign-in" ? signInWithPassword : signUpWithPassword;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardBody className="space-y-5 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent text-on-accent">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {mode === "sign-in"
              ? "Sign in to your knowledge"
              : "Create your workspace"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-body">
            Save private notes, ask grounded questions, and keep every answer
            tied to its source.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              autoComplete="email"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              id="password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </div>
          {state.error ? (
            <p className="rounded-md border border-error/40 bg-error-soft px-3 py-2 text-sm text-error">
              {state.error}
            </p>
          ) : null}
          <Button
            className="w-full"
            disabled={pending}
            icon={
              mode === "sign-in" ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )
            }
            type="submit"
          >
            {pending
              ? "Working..."
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>

        <button
          className="min-h-11 text-sm font-medium text-accent underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          type="button"
        >
          {mode === "sign-in"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </CardBody>
    </Card>
  );
}
