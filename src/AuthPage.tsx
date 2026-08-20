import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "./auth/AuthContext";
import { supabaseConfigurationMessage } from "./auth/authErrors";

export type AuthMode = "sign-in" | "sign-up";

interface AuthPageProps {
  mode: AuthMode;
  onAuthenticated: () => void;
  onBackHome: () => void;
  onModeChange: (mode: AuthMode) => void;
  sessionExpiredNotice?: boolean;
}

const minimumPasswordLength = 8;

function AuthPage({
  mode,
  onAuthenticated,
  onBackHome,
  onModeChange,
  sessionExpiredNotice = false,
}: AuthPageProps) {
  const {
    authError,
    clearAuthError,
    isConfigured,
    isInitializing,
    isSubmitting,
    signIn,
    signUp,
    user,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setValidationError("");
    setSuccessMessage("");
  }, [mode]);

  const validate = () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password || (mode === "sign-up" && !passwordConfirmation)) {
      return "すべての入力欄を入力してください。";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return "メールアドレスの形式を確認してください。";
    }
    if (password.length < minimumPasswordLength) {
      return `パスワードは${minimumPasswordLength}文字以上で入力してください。`;
    }
    if (mode === "sign-up" && password !== passwordConfirmation) {
      return "パスワードと確認用パスワードが一致しません。";
    }
    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setSuccessMessage("");
    clearAuthError();
    const nextValidationError = validate();
    setValidationError(nextValidationError);
    if (nextValidationError) return;

    try {
      if (mode === "sign-up") {
        const result = await signUp(email.trim(), password);
        if (result.requiresEmailConfirmation) {
          setSuccessMessage(
            "確認メールを送信しました。メール内のリンクを開いて登録を完了してください。",
          );
          setPassword("");
          setPasswordConfirmation("");
          return;
        }
      } else {
        await signIn(email.trim(), password);
      }
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

  const isSignUp = mode === "sign-up";
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
          <h1 id="auth-title">{isSignUp ? "新規登録" : "ログイン"}</h1>
          <p>
            {isSignUp
              ? "メールアドレスとパスワードでアカウントを作成します。"
              : "登録したメールアドレスとパスワードを入力してください。"}
          </p>
        </div>

        {sessionExpiredNotice && (
          <div className="auth-message auth-message--error" role="alert">
            <strong>もう一度ログインしてください</strong>
            <p>セッションの有効期限が切れました。</p>
          </div>
        )}

        {displayedError && (
          <div className="auth-message auth-message--error" role="alert">
            <strong>入力または設定を確認してください</strong>
            <p>{displayedError}</p>
          </div>
        )}
        {successMessage && (
          <div className="auth-message auth-message--success" role="status">
            <strong>確認メールを送信しました</strong>
            <p>{successMessage}</p>
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
              autoComplete={isSignUp ? "new-password" : "current-password"}
              aria-describedby={isSignUp ? "password-requirement" : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
            {isSignUp && (
              <small id="password-requirement">
                {minimumPasswordLength}文字以上で入力してください。
              </small>
            )}
          </div>

          {isSignUp && (
            <div className="field">
              <label htmlFor="auth-password-confirmation">パスワード（確認）</label>
              <input
                id="auth-password-confirmation"
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          )}

          <button
            className="primary-button auth-form__submit"
            type="submit"
            disabled={isSubmitting || !isConfigured}
          >
            {isSubmitting
              ? isSignUp
                ? "登録しています…"
                : "ログインしています…"
              : isSignUp
                ? "登録する"
                : "ログインする"}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isSignUp
              ? "すでにアカウントをお持ちですか？"
              : "アカウントをお持ちでないですか？"}
          </p>
          <button
            type="button"
            onClick={() => {
              clearAuthError();
              onModeChange(isSignUp ? "sign-in" : "sign-up");
            }}
            disabled={isSubmitting}
          >
            {isSignUp ? "ログイン画面へ" : "新規登録画面へ"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default AuthPage;
