import type { AuthError } from "@supabase/supabase-js";

export const supabaseConfigurationMessage =
  "認証機能の設定が完了していません。管理者にお問い合わせください。";

export function getAuthErrorMessage(error: unknown) {
  const authError = error as Partial<AuthError> | undefined;
  const code = authError?.code;

  switch (code) {
    case "invalid_credentials":
      return "メールアドレスまたはパスワードが正しくありません。";
    case "email_not_confirmed":
      return "メールアドレスの確認が完了していません。確認メール内のリンクを開いてください。";
    case "weak_password":
      return "パスワードが要件を満たしていません。より長く推測されにくい文字列を設定してください。";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "短時間に操作が集中しています。しばらく待ってからお試しください。";
  }

  if (
    error instanceof TypeError ||
    authError?.status === 0 ||
    /fetch|network|failed to fetch/i.test(authError?.message ?? "")
  ) {
    return "通信に失敗しました。ネットワーク接続を確認して、もう一度お試しください。";
  }

  return "認証処理でエラーが発生しました。時間をおいて、もう一度お試しください。";
}
