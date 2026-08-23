import { FormEvent, useEffect, useRef, useState } from "react";
import type { AccountDeletionFailureCode } from "./data/accountDeletion";

interface AccountSettingsPageProps {
  email?: string;
  isAuthInitializing: boolean;
  isDeleting: boolean;
  onBackHome: () => void;
  onDeleteAccount: (password: string) => Promise<AccountDeletionFailureCode | null>;
  onLogin: () => void;
}

const deletionErrorMessages: Record<AccountDeletionFailureCode, string> = {
  auth_deletion_failed:
    "アカウント削除の最終処理に失敗しました。時間をおいてもう一度お試しください。",
  database_cleanup_failed:
    "植物や手入れ記録を削除できなかったため、退会は完了していません。時間をおいてもう一度お試しください。",
  invalid_request:
    "削除リクエストを受け付けられませんでした。画面を読み直して、もう一度お試しください。",
  method_not_allowed:
    "削除リクエストを受け付けられませんでした。時間をおいてもう一度お試しください。",
  network_error:
    "通信に失敗しました。ネットワーク接続を確認して、もう一度お試しください。",
  origin_not_allowed:
    "この画面から削除処理を利用できません。管理者へお問い合わせください。",
  reauthentication_failed:
    "パスワードが正しくありません。もう一度入力してください。",
  reauthentication_rate_limited:
    "短時間に操作が集中しました。しばらく待ってからもう一度お試しください。",
  reauthentication_unavailable:
    "現在、認証サービスを利用できません。時間をおいてもう一度お試しください。",
  request_in_progress: "アカウントの削除処理を実行しています。完了までお待ちください。",
  storage_cleanup_failed:
    "保存写真を削除できなかったため、退会は完了していません。もう一度お試しください。",
  storage_cleanup_incomplete:
    "一部の写真が処理済みの可能性がありますが、退会は完了していません。もう一度お試しください。",
  unauthorized: "セッションの有効期限が切れました。もう一度ログインしてください。",
  unexpected_response:
    "アカウントを削除できませんでした。時間をおいてもう一度お試しください。",
};

function AccountSettingsPage({
  email,
  isAuthInitializing,
  isDeleting,
  onBackHome,
  onDeleteAccount,
  onLogin,
}: AccountSettingsPageProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [deletionError, setDeletionError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    headingRef.current?.focus();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isConfirming) passwordRef.current?.focus();
  }, [isConfirming]);

  const clearForm = () => {
    setPassword("");
    setIsAcknowledged(false);
    setValidationError("");
    setDeletionError("");
  };

  const handleCancel = () => {
    if (isDeleting) return;
    clearForm();
    setIsConfirming(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDeleting) return;

    setValidationError("");
    setDeletionError("");
    if (!password) {
      setValidationError("現在のパスワードを入力してください。");
      passwordRef.current?.focus();
      return;
    }
    if (!isAcknowledged) {
      setValidationError("削除される内容と、操作を取り消せないことを確認してください。");
      return;
    }

    let submittedPassword = password;
    setPassword("");
    setIsAcknowledged(false);
    const deletionRequest = onDeleteAccount(submittedPassword);
    submittedPassword = "";
    const failureCode = await deletionRequest;
    if (!isMountedRef.current) return;

    if (failureCode) {
      setDeletionError(deletionErrorMessages[failureCode]);
      passwordRef.current?.focus();
    }
  };

  if (isAuthInitializing) {
    return (
      <main className="app-main account-settings-page">
        <div className="loading-state account-settings-state" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          <strong>ログイン状態を確認しています</strong>
        </div>
      </main>
    );
  }

  if (!email) {
    return (
      <main className="app-main account-settings-page">
        <section className="section-card account-settings-state" aria-labelledby="account-login-title">
          <p className="eyebrow">ACCOUNT SETTINGS</p>
          <h1 id="account-login-title">アカウント設定にはログインが必要です</h1>
          <p>ログイン後、もう一度アカウント設定を開いてください。</p>
          <button className="primary-button" type="button" onClick={onLogin}>
            ログイン・新規登録へ
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-main account-settings-page">
      <button
        className="plant-detail__back"
        type="button"
        onClick={onBackHome}
        disabled={isDeleting}
      >
        <span aria-hidden="true">←</span>
        ホームへ戻る
      </button>

      <section className="intro account-settings-page__intro" aria-labelledby="account-settings-title">
        <div className="intro__copy">
          <span className="eyebrow">ACCOUNT SETTINGS</span>
          <h1 id="account-settings-title" ref={headingRef} tabIndex={-1}>アカウント設定</h1>
          <p>{email} でログインしています。</p>
        </div>
      </section>

      <section className="section-card account-deletion-card" aria-labelledby="account-deletion-title">
        <div className="section-card__heading">
          <span>DANGER ZONE</span>
          <h2 id="account-deletion-title">アカウントを削除する</h2>
          <p>アカウントを削除すると、次のデータがすべて削除されます。</p>
        </div>

        <ul className="account-deletion-list">
          <li>自分の植物</li>
          <li>手入れ記録</li>
          <li>保存写真</li>
          <li>プロフィール</li>
          <li>ログインアカウント</li>
        </ul>

        <div className="alert-box alert-box--warning account-deletion-warning" role="note">
          <div>
            <strong>この操作は取り消せません</strong>
            <p>削除したデータやアカウントを元に戻すことはできません。</p>
          </div>
        </div>

        {!isConfirming ? (
          <button
            className="account-delete-button"
            type="button"
            onClick={() => setIsConfirming(true)}
          >
            アカウントを削除する
          </button>
        ) : (
          <form className="account-deletion-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
            <h3>最終確認</h3>
            <p id="account-deletion-password-help">
              本人確認のため、現在のパスワードを入力してください。
            </p>

            <div className="field">
              <label htmlFor="account-deletion-password">現在のパスワード</label>
              <input
                id="account-deletion-password"
                ref={passwordRef}
                type="password"
                autoComplete="current-password"
                aria-describedby="account-deletion-password-help"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setValidationError("");
                  setDeletionError("");
                }}
                disabled={isDeleting}
              />
            </div>

            <label className="account-deletion-acknowledgement">
              <input
                type="checkbox"
                checked={isAcknowledged}
                onChange={(event) => {
                  setIsAcknowledged(event.target.checked);
                  setValidationError("");
                }}
                disabled={isDeleting}
              />
              <span>すべてのデータが削除され、この操作を取り消せないことを確認しました。</span>
            </label>

            {validationError && (
              <div className="alert-box alert-box--warning account-deletion-message" role="alert">
                <div><strong>確認が必要です</strong><p>{validationError}</p></div>
              </div>
            )}
            {deletionError && (
              <div className="alert-box alert-box--error account-deletion-message" role="alert">
                <div><strong>アカウントを削除できませんでした</strong><p>{deletionError}</p></div>
              </div>
            )}
            {isDeleting && (
              <div className="account-deletion-progress" role="status" aria-live="polite">
                <span className="loading-spinner" aria-hidden="true" />
                <strong>アカウントを削除しています。画面を閉じずにお待ちください。</strong>
              </div>
            )}

            <div className="account-deletion-actions">
              <button type="button" onClick={handleCancel} disabled={isDeleting}>キャンセル</button>
              <button
                className="account-delete-button"
                type="submit"
                disabled={isDeleting || !password || !isAcknowledged}
              >
                {isDeleting ? "削除しています…" : "アカウントを完全に削除する"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

export default AccountSettingsPage;
