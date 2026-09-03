import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "./auth/AuthContext";
import { supabaseConfigurationMessage } from "./auth/authErrors";
import {
  getPasswordRequirementError,
} from "./auth/passwordPolicy";

interface AuthPageProps {
  onAuthenticated: () => void;
  onBackHome: () => void;
  onForgotPassword: () => void;
  onPasswordResetNoticeConsumed: () => void;
  passwordResetCompletedNotice?: boolean;
  sessionExpiredNotice?: boolean;
}

function AuthPage({
  onAuthenticated,
  onBackHome,
  onForgotPassword,
  onPasswordResetNoticeConsumed,
  passwordResetCompletedNotice = false,
  sessionExpiredNotice = false,
}: AuthPageProps) {
  const {
    authError,
    clearAuthError,
    isConfigured,
    isInitializing,
    isSubmitting,
    signIn,
    user,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [showPasswordResetCompleted, setShowPasswordResetCompleted] = useState(
    passwordResetCompletedNotice,
  );

  useEffect(() => {
    if (passwordResetCompletedNotice) onPasswordResetNoticeConsumed();
  }, [onPasswordResetNoticeConsumed, passwordResetCompletedNotice]);

  const validate = () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      return "すべての入力欄を入力してください。";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return "メールアドレスの形式を確認してください。";
    }
    const passwordRequirementError = getPasswordRequirementError(password);
    if (passwordRequirementError) return passwordRequirementError;
    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    clearAuthError();
    const nextValidationError = validate();
    setValidationError(nextValidationError);
    if (nextValidationError) return;

    try {
      await signIn(email.trim(), password);
      onAuthenticated();
    } catch {
      // 利用者向けメッセージと開発者向けログはAuthProviderで処理する。
    }
  };

  if (isInitializing) {
    return (
      <main className="app-main auth-page">
        <section className="auth-card auth-card--loading" aria-live="polite">
          <span className="auth-spinner" aria-hidden="true" />
          <p>ログイン状態を確認しています。</p>
        </section>
      </main>
    );
  }

  if (user) {
    return (
      <main className="app-main auth-page">
        <button className="plant-detail__back" type="button" onClick={onBackHome}>
          <span aria-hidden="true">←</span>
          ホームへ戻る
        </button>
        <section className="auth-card" aria-labelledby="account-title">
          <span className="eyebrow">YOUR ACCOUNT</span>
          <h1 id="account-title">ログイン中です</h1>
          <p className="auth-card__description">
            {user.email ?? "メールアドレスを確認できません"} でログインしています。
          </p>
          {showPasswordResetCompleted && (
            <div className="auth-message auth-message--success" role="status">
              <strong>パスワードを更新しました</strong>
              <p>新しいパスワードでログインし直してください。</p>
            </div>
          )}
          {authError && (
            <div className="auth-message auth-message--error" role="alert">
              <strong>ログアウトできませんでした</strong>
              <p>{authError}</p>
            </div>
          )}
          <button className="primary-button" type="button" onClick={onBackHome}>
            ホームへ戻る
          </button>
        </section>
      </main>
    );
  }

  const displayedError =
    validationError ||
    authError ||
    (!isConfigured ? supabaseConfigurationMessage : "");

  return (
    <main className="app-main auth-page">
      <button className="plant-detail__back" type="button" onClick={onBackHome}>
        <span aria-hidden="true">←</span>
        ホームへ戻る
      </button>

      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card__heading">
          <span className="eyebrow">ACCOUNT</span>
          <h1 id="auth-title">ログイン</h1>
          <p>登録済みのメールアドレスとパスワードを入力してください。</p>
        </div>

        {sessionExpiredNotice && (
          <div className="auth-message auth-message--error" role="alert">
            <strong>もう一度ログインしてください</strong>
            <p>セッションの有効期限が切れました。</p>
          </div>
        )}

        {showPasswordResetCompleted && (
          <div className="auth-message auth-message--success" role="status">
            <strong>パスワードを更新しました</strong>
            <p>新しいパスワードでログインしてください。</p>
          </div>
        )}

        {displayedError && (
          <div className="auth-message auth-message--error" role="alert">
            <strong>入力または設定を確認してください</strong>
            <p>{displayedError}</p>
          </div>
        )}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="auth-email">メールアドレス</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="field">
            <label htmlFor="auth-password">パスワード</label>
            <input
              id="auth-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button
            className="auth-form__forgot"
            type="button"
            onClick={() => {
              clearAuthError();
              onForgotPassword();
            }}
            disabled={isSubmitting}
          >
            パスワードを忘れた方
          </button>

          <button
            className="primary-button auth-form__submit"
            type="submit"
            disabled={isSubmitting || !isConfigured}
          >
            {isSubmitting ? "ログインしています…" : "ログインする"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AuthPage;
