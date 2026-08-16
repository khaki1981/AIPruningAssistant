import { useEffect, useMemo, useRef, useState } from "react";
import {
  deletePlantCareRecord,
  listPlantCareRecords,
  plantCareWorkOptions,
  plantConditionOptions,
} from "./data/plantCareRecords";
import type { PlantCareRecord } from "./data/plantCareRecords";
import {
  createPlantCareRecordPhotoSignedUrl,
  createPlantCareRecordPhotoSignedUrls,
  listPlantCareRecordPhotos,
} from "./data/plantCareRecordPhotos";
import { loadPlants } from "./data/loadPlants";
import { getUserPlantById } from "./data/userPlants";
import PlantCareRecordPhotoViewer from "./PlantCareRecordPhotoViewer";
import type { PlantCareRecordPhoto } from "./types/plantCareRecordPhoto";
import type { UserPlant } from "./types/userPlant";

const allPlants = loadPlants(true);
const userPlantIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const conditionLabels = new Map(
  plantConditionOptions.map((option) => [option.code, option.label]),
);
const workLabels = new Map(
  plantCareWorkOptions.map((option) => [option.code, option.label]),
);

interface MyPlantCareHistoryPageProps {
  isAuthInitializing: boolean;
  onBackToMyPlants: () => void;
  onCreateRecord: (userPlantId: string) => void;
  onEditRecord: (userPlantId: string, recordId: string) => void;
  onLogin: () => void;
  onUpdatedMessageConsumed: () => void;
  userId?: string;
  userPlantId: string;
  updatedMessage?: boolean;
}

function formatRecordDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "日付を確認できません";
  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
}

function getConditionLabel(code: string) {
  return conditionLabels.get(code as (typeof plantConditionOptions)[number]["code"])
    ?? "登録済みの状態";
}

function getWorkLabels(codes: string[]) {
  return Array.from(
    new Set(
      codes.map(
        (code) =>
          workLabels.get(code as (typeof plantCareWorkOptions)[number]["code"])
          ?? "登録済みの作業",
      ),
    ),
  );
}

type SavedPhotoDisplayState = {
  automaticRetryUsed: boolean;
  photo: PlantCareRecordPhoto;
  signedUrl: string | null;
  status: "error" | "loading" | "ready";
};

function MyPlantCareHistoryPage({
  isAuthInitializing,
  onBackToMyPlants,
  onCreateRecord,
  onEditRecord,
  onLogin,
  onUpdatedMessageConsumed,
  userId,
  userPlantId,
  updatedMessage,
}: MyPlantCareHistoryPageProps) {
  const [userPlant, setUserPlant] = useState<UserPlant | null>(null);
  const [records, setRecords] = useState<PlantCareRecord[]>([]);
  const [isLoadingPlant, setIsLoadingPlant] = useState(false);
  const [isPlantUnavailable, setIsPlantUnavailable] = useState(false);
  const [plantLoadError, setPlantLoadError] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [recordLoadError, setRecordLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [photoRetryKey, setPhotoRetryKey] = useState(0);
  const [photoListError, setPhotoListError] = useState(false);
  const [savedPhotos, setSavedPhotos] = useState<
    Record<string, SavedPhotoDisplayState>
  >({});
  const [deletingRecordId, setDeletingRecordId] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [showUpdatedMessage, setShowUpdatedMessage] = useState(
    Boolean(updatedMessage),
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const photoLoadGenerationRef = useRef(0);
  const photoRequestIdsRef = useRef(new Map<string, number>());
  const failedPhotoUrlsRef = useRef(new Map<string, string>());

  useEffect(() => {
    if (updatedMessage) onUpdatedMessageConsumed();
  }, [onUpdatedMessageConsumed, updatedMessage]);

  useEffect(() => {
    setUserPlant(null);
    setRecords([]);
    setIsPlantUnavailable(false);
    setPlantLoadError(false);
    setRecordLoadError(false);
    setPhotoListError(false);
    setSavedPhotos({});
    setIsLoadingPlant(false);
    setIsLoadingRecords(false);
    setDeletingRecordId("");
    setDeleteError("");
    setDeleteSuccess("");

    if (!userId) return;
    if (!userPlantIdPattern.test(userPlantId)) {
      setIsPlantUnavailable(true);
      return;
    }

    let isCurrent = true;
    setIsLoadingPlant(true);
    void getUserPlantById({ userPlantId, userId })
      .then((item) => {
        if (!isCurrent) return;
        if (!item) {
          setIsPlantUnavailable(true);
          return;
        }
        setIsLoadingRecords(true);
        setUserPlant(item);
      })
      .catch(() => {
        if (isCurrent) setPlantLoadError(true);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingPlant(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [userId, userPlantId]);

  useEffect(() => {
    if (!userId || !userPlant) return;

    let isCurrent = true;
    setRecords([]);
    setRecordLoadError(false);
    setIsLoadingRecords(true);
    void listPlantCareRecords({ userPlantId: userPlant.id, userId })
      .then((items) => {
        if (isCurrent) setRecords(items);
      })
      .catch(() => {
        if (isCurrent) setRecordLoadError(true);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingRecords(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [retryKey, userId, userPlant]);

  useEffect(() => {
    if (!userId || !userPlant) return;

    let isCurrent = true;
    const generation = photoLoadGenerationRef.current + 1;
    photoLoadGenerationRef.current = generation;
    photoRequestIdsRef.current.clear();
    failedPhotoUrlsRef.current.clear();
    setPhotoListError(false);
    setSavedPhotos({});

    void (async () => {
      let photos: PlantCareRecordPhoto[];
      try {
        photos = await listPlantCareRecordPhotos({
          userPlantId: userPlant.id,
          userId,
        });
      } catch {
        if (isCurrent && photoLoadGenerationRef.current === generation) {
          setPhotoListError(true);
        }
        return;
      }
      if (!isCurrent || photoLoadGenerationRef.current !== generation) return;

      setSavedPhotos(
        Object.fromEntries(
          photos.map((photo) => [
            photo.plantCareRecordId,
            {
              automaticRetryUsed: false,
              photo,
              signedUrl: null,
              status: "loading" as const,
            },
          ]),
        ),
      );
      if (photos.length === 0) return;

      try {
        const results = await createPlantCareRecordPhotoSignedUrls({
          photos,
          userPlantId: userPlant.id,
          userId,
        });
        if (!isCurrent || photoLoadGenerationRef.current !== generation) return;
        setSavedPhotos(
          Object.fromEntries(
            results.map(({ photo, signedUrl }) => [
              photo.plantCareRecordId,
              {
                automaticRetryUsed: false,
                photo,
                signedUrl,
                status: signedUrl ? "ready" as const : "error" as const,
              },
            ]),
          ),
        );
      } catch {
        if (!isCurrent || photoLoadGenerationRef.current !== generation) return;
        setSavedPhotos(
          Object.fromEntries(
            photos.map((photo) => [
              photo.plantCareRecordId,
              {
                automaticRetryUsed: false,
                photo,
                signedUrl: null,
                status: "error" as const,
              },
            ]),
          ),
        );
      }
    })();

    return () => {
      isCurrent = false;
      if (photoLoadGenerationRef.current === generation) {
        photoLoadGenerationRef.current += 1;
        photoRequestIdsRef.current.clear();
        failedPhotoUrlsRef.current.clear();
      }
    };
  }, [photoRetryKey, userId, userPlant]);

  useEffect(() => {
    if (userPlant && !isLoadingRecords) headingRef.current?.focus();
  }, [isLoadingRecords, userPlant]);

  const plant = useMemo(
    () => allPlants.find((item) => item.id === userPlant?.plantId),
    [userPlant],
  );

  const retryRecords = () => {
    setRecordLoadError(false);
    setIsLoadingRecords(true);
    setRetryKey((current) => current + 1);
  };

  const refreshSavedPhoto = async (
    photo: PlantCareRecordPhoto,
    automaticRetryUsed: boolean,
  ) => {
    if (!userId || !userPlant) return;
    const recordId = photo.plantCareRecordId;
    if (!automaticRetryUsed) failedPhotoUrlsRef.current.delete(recordId);
    const requestId = (photoRequestIdsRef.current.get(recordId) ?? 0) + 1;
    const generation = photoLoadGenerationRef.current;
    photoRequestIdsRef.current.set(recordId, requestId);
    setSavedPhotos((current) => ({
      ...current,
      [recordId]: {
        automaticRetryUsed,
        photo,
        signedUrl: null,
        status: "loading",
      },
    }));

    try {
      const signedUrl = await createPlantCareRecordPhotoSignedUrl({
        photo,
        userPlantId: userPlant.id,
        userId,
      });
      if (
        photoLoadGenerationRef.current !== generation ||
        photoRequestIdsRef.current.get(recordId) !== requestId
      ) return;
      setSavedPhotos((current) => ({
        ...current,
        [recordId]: {
          automaticRetryUsed,
          photo,
          signedUrl,
          status: "ready",
        },
      }));
    } catch {
      if (
        photoLoadGenerationRef.current !== generation ||
        photoRequestIdsRef.current.get(recordId) !== requestId
      ) return;
      setSavedPhotos((current) => ({
        ...current,
        [recordId]: {
          automaticRetryUsed,
          photo,
          signedUrl: null,
          status: "error",
        },
      }));
    }
  };

  const handleSavedPhotoError = (recordId: string, failedUrl: string) => {
    const current = savedPhotos[recordId];
    if (!current || current.signedUrl !== failedUrl) return;
    if (failedPhotoUrlsRef.current.get(recordId) === failedUrl) return;
    failedPhotoUrlsRef.current.set(recordId, failedUrl);
    if (current.automaticRetryUsed) {
      setSavedPhotos((photos) => ({
        ...photos,
        [recordId]: { ...current, signedUrl: null, status: "error" },
      }));
      return;
    }
    void refreshSavedPhoto(current.photo, true);
  };

  const handleDelete = async (record: PlantCareRecord) => {
    if (!userId || !userPlant || deletingRecordId) return;
    setDeleteError("");
    setDeleteSuccess("");

    const displayDate = formatRecordDate(record.recordDate);
    if (!window.confirm(`${displayDate}の記録を削除しますか？\nこの操作は取り消せません。`)) {
      return;
    }
    setShowUpdatedMessage(false);
    if (!userPlantIdPattern.test(record.id)) {
      setDeleteError(
        "対象の記録が見つからないか、このアカウントでは利用できません",
      );
      return;
    }

    setDeletingRecordId(record.id);
    try {
      const wasDeleted = await deletePlantCareRecord({
        recordId: record.id,
        userId,
        userPlantId: userPlant.id,
      });
      if (!wasDeleted) {
        setDeleteError(
          "対象の記録が見つからないか、このアカウントでは利用できません",
        );
        return;
      }
      setRecords((current) => current.filter((item) => item.id !== record.id));
      photoRequestIdsRef.current.set(
        record.id,
        (photoRequestIdsRef.current.get(record.id) ?? 0) + 1,
      );
      failedPhotoUrlsRef.current.delete(record.id);
      setSavedPhotos((current) => {
        const next = { ...current };
        delete next[record.id];
        return next;
      });
      setDeleteSuccess(`${displayDate}の記録を削除しました。`);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "記録を削除できませんでした。時間をおいてもう一度お試しください。",
      );
    } finally {
      setDeletingRecordId("");
    }
  };

  if (isAuthInitializing) {
    return (
      <main className="app-main plant-care-page">
        <div className="loading-state plant-care-state" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          <strong>ログイン状態を確認しています…</strong>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="app-main plant-care-page">
        <button className="plant-detail__back" type="button" onClick={onBackToMyPlants}>
          <span aria-hidden="true">←</span>
          自分の植物へ戻る
        </button>
        <section className="section-card my-plants-login" aria-labelledby="plant-history-login-title">
          <p className="eyebrow">CARE HISTORY</p>
          <h1 id="plant-history-login-title">過去の記録を見るにはログインが必要です</h1>
          <p>ログイン後、自分の植物からもう一度記録一覧を開いてください。</p>
          <button className="primary-button" type="button" onClick={onLogin}>
            ログイン・新規登録へ
          </button>
        </section>
      </main>
    );
  }

  if (isLoadingPlant) {
    return (
      <main className="app-main plant-care-page">
        <div className="loading-state plant-care-state" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          <strong>植物の情報を読み込んでいます…</strong>
        </div>
      </main>
    );
  }

  if (plantLoadError || isPlantUnavailable || !userPlant) {
    return (
      <main className="app-main plant-care-page">
        <button className="plant-detail__back" type="button" onClick={onBackToMyPlants}>
          <span aria-hidden="true">←</span>
          自分の植物へ戻る
        </button>
        <section className="section-card plant-care-state-card" aria-labelledby="plant-history-unavailable-title">
          <p className="eyebrow">CARE HISTORY</p>
          <h1 id="plant-history-unavailable-title">過去の記録を表示できません</h1>
          <p>
            {plantLoadError
              ? "植物の情報を読み込めませんでした。通信状態を確認して、もう一度お試しください。"
              : "対象の植物が見つからないか、このアカウントでは利用できません"}
          </p>
        </section>
      </main>
    );
  }

  const speciesName = plant?.nameJa || "植物情報は現在表示できません";
  const displayName = userPlant.nickname || speciesName;

  return (
    <main className="app-main plant-care-page plant-care-history-page">
      <button className="plant-detail__back" type="button" onClick={onBackToMyPlants}>
        <span aria-hidden="true">←</span>
        自分の植物へ戻る
      </button>

      <section className="intro plant-care-page__intro" aria-labelledby="plant-care-history-title">
        <div className="intro__copy">
          <span className="eyebrow">CARE HISTORY</span>
          <h1 id="plant-care-history-title" ref={headingRef} tabIndex={-1}>過去の記録</h1>
          <dl className="plant-care-identity">
            <div><dt>呼び名</dt><dd>{displayName}</dd></div>
            <div><dt>植物名</dt><dd>{speciesName}</dd></div>
          </dl>
          <div className="plant-care-history__intro-actions">
            <button className="primary-button" type="button" onClick={() => onCreateRecord(userPlant.id)}>
              状態・作業を記録する
            </button>
            <button type="button" onClick={onBackToMyPlants}>自分の植物へ戻る</button>
          </div>
        </div>
      </section>

      <section className="section-card plant-care-history" aria-labelledby="plant-care-history-list-title" aria-busy={isLoadingRecords}>
        <div className="section-card__heading">
          <span>PAST RECORDS</span>
          <h2 id="plant-care-history-list-title">記録一覧</h2>
          {!isLoadingRecords && !recordLoadError && records.length > 0 && <p>{records.length}件の記録があります。</p>}
        </div>

        {showUpdatedMessage && (
          <div className="plant-care-success plant-care-history__feedback" role="status">
            <strong>記録を更新しました。</strong>
          </div>
        )}
        {deleteSuccess && (
          <div className="plant-care-success plant-care-history__feedback" role="status">
            <strong>{deleteSuccess}</strong>
          </div>
        )}
        {deleteError && (
          <div className="alert-box alert-box--error plant-care-history__feedback" role="alert">
            <div>
              <strong>削除に失敗しました</strong>
              <p>{deleteError}</p>
            </div>
          </div>
        )}
        {photoListError && (
          <div className="alert-box alert-box--warning plant-care-history__feedback" role="alert">
            <div>
              <strong>保存済み写真を読み込めませんでした</strong>
              <p>記録内容はそのまま確認できます。写真だけもう一度読み込めます。</p>
              <button
                className="primary-button"
                type="button"
                onClick={() => setPhotoRetryKey((current) => current + 1)}
              >
                写真だけ再読み込みする
              </button>
            </div>
          </div>
        )}

        {isLoadingRecords ? (
          <div className="loading-state plant-care-state" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <strong>過去の記録を読み込んでいます…</strong>
          </div>
        ) : recordLoadError ? (
          <div className="plant-care-history__message" role="alert">
            <strong>過去の記録を取得できませんでした。</strong>
            <p>通信状態を確認して、もう一度お試しください。</p>
            <button className="primary-button" type="button" onClick={retryRecords}>
              もう一度読み込む
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state plant-care-history__empty">
            <strong>まだ記録がありません。</strong>
            <p>植物の状態や行った作業を記録すると、<br />ここで振り返ることができます。</p>
            <button className="primary-button" type="button" onClick={() => onCreateRecord(userPlant.id)}>
              最初の記録を追加する
            </button>
          </div>
        ) : (
          <div className="plant-care-history__list">
            {records.map((record) => {
              const memo = record.memo?.trim();
              const savedPhoto = savedPhotos[record.id];
              return (
                <article className="plant-care-history-card" key={record.id}>
                  <h3>{formatRecordDate(record.recordDate)}</h3>
                  {savedPhoto && (
                    <PlantCareRecordPhotoViewer
                      alt={`${displayName}の${formatRecordDate(record.recordDate)}の記録写真`}
                      signedUrl={savedPhoto.signedUrl}
                      status={savedPhoto.status}
                      variant="thumbnail"
                      onImageError={(failedUrl) =>
                        handleSavedPhotoError(record.id, failedUrl)
                      }
                      onRetry={() => void refreshSavedPhoto(savedPhoto.photo, false)}
                    />
                  )}
                  <dl>
                    <div>
                      <dt>植物の状態</dt>
                      <dd>
                        <span>{getConditionLabel(record.plantCondition)}</span>
                        {record.conditionOther?.trim() && <span>その他：{record.conditionOther.trim()}</span>}
                      </dd>
                    </div>
                    <div>
                      <dt>行った作業</dt>
                      <dd>
                        {getWorkLabels(record.workTypes).map((label) => <span key={label}>{label}</span>)}
                        {record.workOther?.trim() && <span>その他：{record.workOther.trim()}</span>}
                      </dd>
                    </div>
                    {memo && <div><dt>メモ</dt><dd className="plant-care-history-card__memo">{memo}</dd></div>}
                  </dl>
                  <div className="plant-care-history-card__actions">
                    <button
                      type="button"
                      disabled={Boolean(deletingRecordId)}
                      onClick={() => onEditRecord(userPlant.id, record.id)}
                    >
                      編集する
                    </button>
                    <button
                      className="plant-care-history-card__delete"
                      type="button"
                      disabled={Boolean(deletingRecordId)}
                      onClick={() => void handleDelete(record)}
                    >
                      {deletingRecordId === record.id ? "削除中…" : "削除する"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default MyPlantCareHistoryPage;
