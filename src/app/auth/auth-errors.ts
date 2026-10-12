export type AuthErrorLike = {
  code?: string;
  name?: string;
};

function authErrorCode(error: AuthErrorLike | null): string | undefined {
  return typeof error?.code === "string" ? error.code : undefined;
}

export function signInErrorMessage(error: AuthErrorLike | null) {
  if (error?.name === "AuthRetryableFetchError") {
    return "We could not reach the sign-in service. Check your connection and try again.";
  }

  switch (authErrorCode(error)) {
    case "email_not_confirmed":
      return "Confirm your email address before signing in.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a few minutes, then try again.";
    default:
      return "We could not sign you in with those credentials.";
  }
}

export function signUpErrorMessage(error: AuthErrorLike | null) {
  switch (authErrorCode(error)) {
    case "weak_password":
      return "Use a stronger password with uppercase and lowercase letters, a number, and a symbol.";
    case "email_exists":
    case "user_already_exists":
      return "That account may already exist. Try signing in instead.";
    case "email_address_invalid":
      return "Use a real email address to create an account.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "Email account creation is disabled for this project.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a few minutes, then try again.";
    default:
      return "We could not create that account.";
  }
}
