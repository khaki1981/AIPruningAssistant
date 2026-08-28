import { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "./auth/AuthContext";
import { supabaseConfigurationMessage } from "./auth/authErrors";
import {
  getPasswordRequirementError,
  minimumPasswordLength,
} from "./auth/passwordPolicy";
import {
  getPasswordResetRequestErrorMessage,
  getPasswordUpdateErrorMessage,
} from "./auth/passwordReset";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const invalidRecoveryMessage =
  "このパスワード再設定リンクは無効か、有効期限が切れています。もう一度、再設定メールを送信してください。";

type PasswordResetNavigationProps = {
  onBackToLogin: () => void;
};

export function PasswordResetRequestPage({
  onBackToLogin,
}: PasswordResetNavigationProps) {
  const { isConfigured, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [hasSent, setHasSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const isMountedRef = useRef(true);
  const submissionLockRef = useRef(false);
  const displayedRequestError =
    requestError || (!isConfigured ? supabaseConfigurationMessage : "");

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      submissionLockRef.current = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionLockRef.current || hasSent) return;

    const normalizedEmail = email.trim();
    setValidationError("");
    setRequestError("");
    if (!normalizedEmail) {
      setValidationError("メールアドレスを入力してください。");
      return;
    }
    if (!emailPattern.test(normalizedEmail)) {
      setValidationError("メールアドレスの形式を確認してください。");
      return;
    }
    if (!isConfigured) {
      setRequestError(supabaseConfigurationMessage);
      return;
    }

    submissionLockRef.current = true;
    setIsSending(true);
    let submittedEmail = normalizedEmail;
    try {
      const request = requestPasswordReset(submittedEmail);
      submittedEmail = "";
      await request;
      if (!isMountedRef.current) return;
      setEmail("");
      setHasSent(true);
    } catch (error) {
      submittedEmail = "";
      if (!isMountedRef.current) return;
      setRequestError(getPasswordResetRequestErrorMessage(error));
    } finally {
      if (isMountedRef.current) {
        submissionLockRef.current = false;
        setIsSending(false);
      }
    }
  };

  return (
    <main className="app-main auth-page">
      <button
        className="plant-detail__back"
        type="button"
        onClick={onBackToLogin}
        disabled={isSending}
      >
        <span aria-hidden="true">←</span>
        ログイン画面へ戻る
      </button>

      <section className="auth-card" aria-labelledby="password-reset-request-title">
        <div className="auth-card__heading">
          <span className="eyebrow">PASSWORD RESET</span>
          <h1 id="password-reset-request-title">パスワードを再設定する</h1>
          <p>登録したメールアドレスへ、パスワード再設定用のリンクを送信します。</p>
        </div>

        {validationError && (
          <div className="auth-message auth-message--error" role="alert">
            <strong>入力内容を確認してください</strong>
            <p>{validationError}</p>
          </div>
        )}
        {displayedRequestError && (
          <div className="auth-message auth-message--error" role="alert">
            <strong>メールを送信できませんでした</strong>
            <p>{displayedRequestError}</p>
          </div>
        )}
        {hasSent && (
          <div className="auth-message auth-message--success" role="status">
            <strong>メール送信を受け付けました</strong>
            <p>
              入力されたメールアドレスが登録されている場合、パスワード再設定用のメールを送信しました。
            </p>
          </div>
        )}

        {!hasSent && (
          <form className="auth-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
            <div className="field">
              <label htmlFor="password-reset-email">メールアドレス</label>
              <input
                id="password-reset-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setValidationError("");
                  setRequestError("");
                }}
                disabled={isSending}
              />
            </div>
            <button
              className="primary-button auth-form__submit"
              type="submit"
              disabled={isSending || !isConfigured}
            >
              {isSending ? "送信しています…" : "再設定メールを送信"}
            </button>
          </form>
        )}

        <div className="auth-switch">
          <button type="button" onClick={onBackToLogin} disabled={isSending}>
            ログイン画面へ戻る
          </button>
        </div>
      </section>
    </main>
  );
}

type PasswordResetUpdatePageProps = {
  onBackToRequest: () => void;
  onUpdated: () => void;
};

export function PasswordResetUpdatePage({
  onBackToRequest,
  onUpdated,
}: PasswordResetUpdatePageProps) {
  const {
    isConfigured,
    passwordRecoveryStatus,
    updateRecoveredPassword,
  } = useAuth();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [validationError, setValidationError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const isMountedRef = useRef(true);
  const submissionLockRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      submissionLockRef.current = false;
    };
  }, []);

  const passwordRequirementError = getPasswordRequirementError(password);
  const passwordsMatch = password === passwordConfirmation;
  const canSubmit =
    passwordRecoveryStatus === "ready" &&
    isConfigured &&
    !isUpdating &&
    password.length > 0 &&
    passwordConfirmation.length > 0 &&
    !passwordRequirementError &&
    passwordsMatch;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionLockRef.current || passwordRecoveryStatus !== "ready") return;

    setValidationError("");
    setUpdateError("");
    if (!password || !passwordConfirmation) {
      setValidationError("新しいパスワードと確認用パスワードを入力してください。");
      return;
    }
    if (passwordRequirementError) {
      setValidationError(passwordRequirementError);
      return;
    }
    if (!passwordsMatch) {
      setValidationError("新しいパスワードと確認用パスワードが一致しません。");
      return;
    }
    if (!isConfigured) {
      setUpdateError(supabaseConfigurationMessage);
      return;
    }

    submissionLockRef.current = true;
    setIsUpdating(true);
    let submittedPassword = password;
    setPassword("");
    setPasswordConfirmation("");
    let updateCompleted = false;
    try {
      const request = updateRecoveredPassword(submittedPassword);
      submittedPassword = "";
      await request;
      if (!isMountedRef.current) return;
      updateCompleted = true;
      submissionLockRef.current = false;
      setIsUpdating(false);
      onUpdated();
    } catch (error) {
      submittedPassword = "";
      if (!isMountedRef.current) return;
      setUpdateError(getPasswordUpdateErrorMessage(error));
    } finally {
      if (isMountedRef.current && !updateCompleted) {
        submissionLockRef.current = false;
        setIsUpdating(false);
      }
    }
  };

  if (
    passwordRecoveryStatus === "checking" ||
    (passwordRecoveryStatus === "completed" && isUpdating)
  ) {
    return (
      <main className="app-main auth-page">
        <section className="auth-card auth-card--loading" aria-live="polite">
          <span className="auth-spinner" aria-hidden="true" />
          <p>
            {passwordRecoveryStatus === "checking"
              ? "パスワード再設定リンクを確認しています。"
              : "更新後のログイン状態を整理しています。"}
          </p>
        </section>
      </main>
    );
  }

  if (passwordRecoveryStatus !== "ready") {
    return (
      <main className="app-main auth-page">
        <section className="auth-card" aria-labelledby="password-reset-invalid-title">
          <div className="auth-card__heading">
            <span className="eyebrow">PASSWORD RESET</span>
            <h1 id="password-reset-invalid-title">再設定リンクを確認できません</h1>
          </div>
          <div className="auth-message auth-message--error" role="alert">
            <strong>再設定リンクが無効です</strong>
            <p>{invalidRecoveryMessage}</p>
          </div>
          <button className="primary-button" type="button" onClick={onBackToRequest}>
            再設定メール送信画面へ
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-main auth-page">
      <section className="auth-card" aria-labelledby="password-reset-update-title">
        <div className="auth-card__heading">
          <span className="eyebrow">PASSWORD RESET</span>
          <h1 id="password-reset-update-title">新しいパスワードを設定する</h1>
          <p>今後のログインに使用する新しいパスワードを入力してください。</p>
        </div>

        {(validationError || updateError) && (
          <div className="auth-message auth-message--error" role="alert">
            <strong>パスワードを更新できませんでした</strong>
            <p>{validationError || updateError}</p>
          </div>
        )}

        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className="field">
            <label htmlFor="password-reset-new-password">新しいパスワード</label>
            <input
              id="password-reset-new-password"
              type="password"
              autoComplete="new-password"
              aria-describedby="password-reset-requirement"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setValidationError("");
                setUpdateError("");
              }}
              disabled={isUpdating}
            />
            <small id="password-reset-requirement">
              {minimumPasswordLength}文字以上で入力してください。
            </small>
          </div>
          <div className="field">
            <label htmlFor="password-reset-confirmation">新しいパスワードの確認</label>
            <input
              id="password-reset-confirmation"
              type="password"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(event) => {
                setPasswordConfirmation(event.target.value);
                setValidationError("");
                setUpdateError("");
              }}
              disabled={isUpdating}
            />
          </div>
          <button
            className="primary-button auth-form__submit"
            type="submit"
            disabled={!canSubmit}
          >
            {isUpdating ? "更新しています…" : "パスワードを更新"}
          </button>
        </form>
      </section>
    </main>
  );
}
