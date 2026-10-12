import { beforeEach, describe, expect, it, vi } from "vitest";

import { signInErrorMessage, signUpErrorMessage } from "./auth-errors";
import {
  requestPasswordReset,
  signInWithPassword,
  signUpWithPassword,
} from "./actions";

const signInWithPasswordMock = vi.fn();
const signUpMock = vi.fn();
const resetPasswordForEmailMock = vi.fn();
const { ensureProfileMock } = vi.hoisted(() => ({
  ensureProfileMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ origin: "http://localhost:3000" })),
}));

vi.mock("@/infrastructure/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signUp: signUpMock,
      resetPasswordForEmail: resetPasswordForEmailMock,
    },
  })),
}));

vi.mock("@/infrastructure/db/knowledge-repository", () => ({
  knowledgeRepository: {
    ensureProfile: ensureProfileMock,
  },
}));

function credentialsFormData() {
  const formData = new FormData();
  formData.set("email", "person@example.com");
  formData.set("password", "Password1!");
  formData.set("displayName", "Person Example");
  return formData;
}

describe("auth action error messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps ordinary sign-in failures generic", () => {
    expect(signInErrorMessage({ code: "invalid_credentials" })).toBe(
      "We could not sign you in with those credentials.",
    );
  });

  it("explains email confirmation and sign-in rate limits", () => {
    expect(signInErrorMessage({ code: "email_not_confirmed" })).toBe(
      "Confirm your email address before signing in.",
    );
    expect(signInErrorMessage({ code: "over_request_rate_limit" })).toBe(
      "Too many attempts. Wait a few minutes, then try again.",
    );
  });

  it("does not report a network failure as invalid credentials", () => {
    expect(signInErrorMessage({ name: "AuthRetryableFetchError" })).toBe(
      "We could not reach the sign-in service. Check your connection and try again.",
    );
  });

  it("maps safe signup errors to actionable copy", () => {
    expect(signUpErrorMessage({ code: "weak_password" })).toBe(
      "Use a stronger password with uppercase and lowercase letters, a number, and a symbol.",
    );
    expect(signUpErrorMessage({ code: "email_address_invalid" })).toBe(
      "Use a real email address to create an account.",
    );
    expect(signUpErrorMessage({ code: "email_provider_disabled" })).toBe(
      "Email account creation is disabled for this project.",
    );
  });

  it("returns mapped errors from sign-in and signup actions", async () => {
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { user: null },
      error: { code: "email_not_confirmed" },
    });
    signUpMock.mockResolvedValueOnce({
      data: { user: null },
      error: { code: "weak_password" },
    });

    await expect(
      signInWithPassword({}, credentialsFormData()),
    ).resolves.toEqual({
      error: "Confirm your email address before signing in.",
    });
    await expect(
      signUpWithPassword({}, credentialsFormData()),
    ).resolves.toEqual({
      error:
        "Use a stronger password with uppercase and lowercase letters, a number, and a symbol.",
    });
  });

  it("stores the submitted name when creating an account", async () => {
    signUpMock.mockResolvedValueOnce({
      data: { user: { email: "person@example.com", id: "user-1" } },
      error: null,
    });

    await expect(signUpWithPassword({}, credentialsFormData())).rejects.toThrow(
      "redirect:/",
    );
    expect(signUpMock).toHaveBeenCalledWith({
      email: "person@example.com",
      options: { data: { display_name: "Person Example" } },
      password: "Password1!",
    });
    expect(ensureProfileMock).toHaveBeenCalledWith({
      displayName: "Person Example",
      owner: { userId: "user-1" },
    });
  });

  it("requires a name when creating an account", async () => {
    const formData = credentialsFormData();
    formData.set("displayName", " ");

    await expect(signUpWithPassword({}, formData)).resolves.toEqual({
      error: "Enter your name.",
    });
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("requests a password reset without revealing account existence", async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({ error: null });

    await expect(
      requestPasswordReset({}, credentialsFormData()),
    ).resolves.toEqual({
      message:
        "Check your email for a password reset link. You can set a new password from your account page.",
    });
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
      "person@example.com",
      {
        redirectTo: "http://localhost:3000/auth/callback?next=/account",
      },
    );
  });
});
