import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { loadPlants } from "./data/loadPlants";
import {
  countPlantCareRecords,
  deleteUserPlant,
  getUserPlantById,
  updateUserPlantNickname,
  UserPlantHasCareRecordsError,
} from "./data/userPlants";
import type { UserPlant } from "./types/userPlant";

const allPlants = loadPlants(true);
const userPlantIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const unavailableMessage =
  "対象の植物が見つからないか、このアカウントでは利用できません。";
const deletionBlockedMessage =
  "手入れ記録が残っているため、この植物は削除できません。植物を削除するには、先にすべての手入れ記録を削除してください。";

interface MyPlantEditPageProps {
  isAuthInitializing: boolean;
  onBackToMyPlants: () => void;
  onDeleted: () => void;
  onLogin: () => void;
  onUpdated: () => void;
  userId?: string;
  userPlantId: string;
}

function formatRegistrationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "確認できません";
  return new Intl.DateTimeFormat("ja-JP").format(date);
}

function MyPlantEditPage({
  isAuthInitializing,
  onBackToMyPlants,
  onDeleted,
  onLogin,
  onUpdated,
  userId,
  userPlantId,
}: MyPlantEditPageProps) {
  const [userPlant, setUserPlant] = useState<UserPlant | null>(null);
  const [careRecordCount, setCareRecordCount] = useState<number | null>(null);
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isProcessing = isSaving || isDeleting;

  useEffect(() => {
    setUserPlant(null);
    setCareRecordCount(null);
    setNickname("");
    setIsUnavailable(false);
    setLoadError("");
    setValidationError("");
    setSaveError("");
    setDeleteError("");
    setIsSaving(false);
    setIsDeleting(false);

    if (!userId) return;
    if (!userPlantIdPattern.test(userPlantId)) {
      setIsUnavailable(true);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    void Promise.all([
      getUserPlantById({ userPlantId, userId }),
      countPlantCareRecords({ userPlantId, userId }),
    ])
      .then(([item, recordCount]) => {
        if (!isCurrent) return;
        if (!item) {
          setIsUnavailable(true);
          return;
        }
        setUserPlant(item);
        setNickname(item.nickname ?? "");
        setCareRecordCount(recordCount);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "植物の情報を読み込めませんでした。時間をおいてもう一度お試しください。",
        );
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [userId, userPlantId]);

  useEffect(() => {
    if (userPlant && careRecordCount !== null) headingRef.current?.focus();
  }, [careRecordCount, userPlant]);

  const plant = useMemo(
    () => allPlants.find((item) => item.id === userPlant?.plantId),
    [userPlant],
  );

  const clearFeedback = () => {
    setValidationError("");
    setSaveError("");
    setDeleteError("");
  };

  const ownsLoadedPlant = () =>
    Boolean(
      userId &&
        userPlant &&
        userPlant.id === userPlantId &&
        userPlant.userId === userId,
    );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isProcessing) return;
    clearFeedback();

    if (!ownsLoadedPlant() || !userId) {
      setSaveError(unavailableMessage);
      return;
    }

    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length > 100) {
      setValidationError("呼び名は100文字以内で入力してください。");
      return;
    }

    setIsSaving(true);
    try {
      const wasUpdated = await updateUserPlantNickname({
        nickname,
        userPlantId,
        userId,
      });
      if (!wasUpdated) {
        setSaveError(unavailableMessage);
        return;
      }
      onUpdated();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "自分の植物を更新できませんでした。時間をおいてもう一度お試しください。",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isProcessing || careRecordCount === null || careRecordCount > 0) return;
    clearFeedback();

    if (!ownsLoadedPlant() || !userId || !userPlant) {
      setDeleteError(unavailableMessage);
      return;
    }

    const speciesName = plant?.nameJa || "植物情報は現在表示できません";
    const displayName = userPlant.nickname?.trim() || speciesName;
    if (
      !window.confirm(
        `「${displayName}」を自分の植物から削除しますか？\nこの操作は取り消せません。`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const wasDeleted = await deleteUserPlant({ userPlantId, userId });
      if (!wasDeleted) {
        setDeleteError(unavailableMessage);
        return;
      }
      onDeleted();
    } catch (error) {
      if (error instanceof UserPlantHasCareRecordsError) {
        setCareRecordCount((current) => Math.max(1, current ?? 0));
        return;
      }
      setDeleteError(
        error instanceof Error
          ? error.message
          : "自分の植物を削除できませんでした。時間をおいてもう一度お試しください。",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isAuthInitializing) {
    return (
      <main className="app-main my-plant-edit-page">
        <div className="loading-state my-plants-state" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          <strong>ログイン状態を確認しています</strong>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="app-main my-plant-edit-page">
        <button className="plant-detail__back" type="button" onClick={onBackToMyPlants}>
          <span aria-hidden="true">←</span>
          自分の植物一覧へ戻る
        </button>
        <section className="section-card my-plants-login" aria-labelledby="my-plant-edit-login-title">
          <p className="eyebrow">EDIT MY PLANT</p>
          <h1 id="my-plant-edit-login-title">自分の植物を編集するにはログインが必要です</h1>
          <p>ログイン後、自分の植物一覧からもう一度編集画面を開いてください。</p>
          <button className="primary-button" type="button" onClick={onLogin}>
            ログイン・新規登録へ
          </button>
        </section>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="app-main my-plant-edit-page">
        <div className="loading-state my-plants-state" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          <strong>植物の情報を読み込んでいます</strong>
        </div>
      </main>
    );
  }

  if (loadError || isUnavailable || !userPlant || careRecordCount === null) {
    return (
      <main className="app-main my-plant-edit-page">
        <button className="plant-detail__back" type="button" onClick={onBackToMyPlants}>
          <span aria-hidden="true">←</span>
          自分の植物一覧へ戻る
        </button>
        <section className="section-card plant-care-state-card" aria-labelledby="my-plant-edit-unavailable-title">
          <p className="eyebrow">EDIT MY PLANT</p>
          <h1 id="my-plant-edit-unavailable-title">自分の植物を編集できません</h1>
          <p>{loadError || unavailableMessage}</p>
        </section>
      </main>
    );
  }

  const speciesName = plant?.nameJa || "植物情報は現在表示できません";
  const currentNickname = userPlant.nickname?.trim() || "設定なし";

  return (
    <main className="app-main my-plant-edit-page">
      <button
        className="plant-detail__back"
        type="button"
        onClick={onBackToMyPlants}
        disabled={isProcessing}
      >
        <span aria-hidden="true">←</span>
        自分の植物一覧へ戻る
      </button>

      <section className="intro my-plant-edit-page__intro" aria-labelledby="my-plant-edit-title">
        <div className="intro__copy">
          <span className="eyebrow">EDIT MY PLANT</span>
          <h1 id="my-plant-edit-title" ref={headingRef} tabIndex={-1}>自分の植物を編集する</h1>
          <dl className="plant-care-identity">
            <div><dt>樹種名</dt><dd>{speciesName}</dd></div>
            <div><dt>現在の呼び名</dt><dd>{currentNickname}</dd></div>
            <div><dt>登録日</dt><dd>{formatRegistrationDate(userPlant.createdAt)}</dd></div>
            <div><dt>手入れ記録</dt><dd>{careRecordCount}件</dd></div>
          </dl>
        </div>
      </section>

      <section className="section-card my-plant-edit-card" aria-labelledby="my-plant-nickname-title">
        <div className="section-card__heading">
          <span>NICKNAME</span>
          <h2 id="my-plant-nickname-title">呼び名の編集</h2>
          <p>空欄で保存すると、一覧では樹種名を表示します。</p>
        </div>
        <form className="my-plant-edit-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className="field">
            <label htmlFor="my-plant-nickname">呼び名（任意）</label>
            <input
              id="my-plant-nickname"
              type="text"
              maxLength={100}
              value={nickname}
              onChange={(event) => {
                clearFeedback();
                setNickname(event.target.value);
              }}
              disabled={isProcessing}
              placeholder={`例：玄関の${speciesName}`}
            />
            <small>{nickname.length}/100文字</small>
          </div>

          {validationError && (
            <div className="alert-box alert-box--warning" role="alert">
              <div><strong>入力内容を確認してください</strong><p>{validationError}</p></div>
            </div>
          )}
          {saveError && (
            <div className="alert-box alert-box--error" role="alert">
              <div><strong>更新に失敗しました</strong><p>{saveError}</p></div>
            </div>
          )}

          <button className="primary-button my-plant-edit-submit" type="submit" disabled={isProcessing}>
            {isSaving ? "更新中…" : "変更を保存する"}
          </button>
        </form>
      </section>

      <section className="section-card my-plant-danger-zone" aria-labelledby="my-plant-delete-title">
        <div>
          <span className="eyebrow">DANGER ZONE</span>
          <h2 id="my-plant-delete-title">危険な操作</h2>
          <p>植物を削除すると、自分の植物一覧から表示されなくなります。</p>
        </div>

        {careRecordCount > 0 && (
          <div className="alert-box alert-box--warning my-plant-delete-notice" role="note">
            <div><strong>この植物は削除できません</strong><p>{deletionBlockedMessage}</p></div>
          </div>
        )}
        {deleteError && (
          <div className="alert-box alert-box--error my-plant-delete-notice" role="alert">
            <div><strong>削除に失敗しました</strong><p>{deleteError}</p></div>
          </div>
        )}

        <button
          className="my-plant-delete-button"
          type="button"
          disabled={isProcessing || careRecordCount > 0}
          onClick={() => void handleDelete()}
        >
          {isDeleting ? "削除中…" : "植物を削除する"}
        </button>
      </section>
    </main>
  );
}

export default MyPlantEditPage;
