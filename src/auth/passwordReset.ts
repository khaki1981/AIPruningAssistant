import type { AuthError } from "@supabase/supabase-js";

export type PasswordRecoveryStatus =
  | "idle"
  | "checking"
  | "ready"
  | "invalid"
  | "completed";

export class PasswordRecoveryUnavailableError extends Error {
  constructor() {
    super("password_recovery_unavailable");
    this.name = "PasswordRecoveryUnavailableError";
  }
}

export function isPasswordResetRouteRequested() {
  return new URLSearchParams(window.location.search).get("view") === "password-reset";
}

export function getPasswordResetRedirectUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("view", "password-reset");
  return url.toString();
}

function isNetworkError(error: unknown) {
  const authError = error as Partial<AuthError> | undefined;
  return (
    error instanceof TypeError ||
    authError?.status === 0 ||
    /fetch|network|failed to fetch/i.test(authError?.message ?? "")
  );
}

export function getPasswordResetRequestErrorMessage(error: unknown) {
  const code = (error as Partial<AuthError> | undefined)?.code;
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
    return "短時間に送信が集中しています。しばらく待ってからお試しください。";
  }
  if (code === "email_address_invalid") {
    return "メールアドレスの形式を確認してください。";
  }
  if (isNetworkError(error)) {
    return "通信に失敗しました。ネットワーク接続を確認して、もう一度お試しください。";
  }
  return "再設定メールを送信できませんでした。時間をおいて、もう一度お試しください。";
}

export function getPasswordUpdateErrorMessage(error: unknown) {
  if (error instanceof PasswordRecoveryUnavailableError) {
    return "このパスワード再設定リンクは無効か、有効期限が切れています。もう一度、再設定メールを送信してください。";
  }

  const code = (error as Partial<AuthError> | undefined)?.code;
  if (code === "weak_password") {
    return "パスワードが要件を満たしていません。より長く推測されにくい文字列を設定してください。";
  }
  if (code === "same_password") {
    return "現在とは異なる新しいパスワードを設定してください。";
  }
  if (
    code === "session_not_found" ||
    code === "session_expired" ||
    code === "refresh_token_not_found" ||
    code === "refresh_token_already_used" ||
    code === "bad_jwt" ||
    code === "reauthentication_needed" ||
    code === "reauthentication_not_valid"
  ) {
    return "認証状態を確認できませんでした。もう一度、再設定メールを送信してください。";
  }
  if (isNetworkError(error)) {
    return "通信に失敗しました。ネットワーク接続を確認して、もう一度お試しください。";
  }
  return "パスワードを更新できませんでした。時間をおいて、もう一度お試しください。";
}
