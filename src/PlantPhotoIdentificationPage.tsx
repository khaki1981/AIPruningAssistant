import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  identifyPlantFromPhoto,
  PlantIdentificationClientError,
} from "./data/plantIdentification";
import { matchPlantIdentificationCandidate } from "./data/plantIdentificationMappings";
import {
  preparePlantIdentificationPhoto,
  releasePlantIdentificationPhoto,
  type PreparedPlantIdentificationPhoto,
} from "./lib/plantIdentificationPhoto";
import type {
  PlantIdentificationCandidate,
  PlantIdentificationUsage,
} from "./types/plantIdentification";

interface PlantIdentificationCandidateListProps {
  availablePlantIds: ReadonlySet<string>;
  candidates: readonly PlantIdentificationCandidate[];
  isDisabled: boolean;
  onViewPlant: (plantId: string) => void;
}

export function PlantIdentificationCandidateList({
  availablePlantIds,
  candidates,
  isDisabled,
  onViewPlant,
}: PlantIdentificationCandidateListProps) {
  return (
    <section className="section-card plant-identification-candidates" aria-labelledby="candidate-title">
      <div className="section-card__heading">
        <span>PLANT CANDIDATES</span>
        <h2 id="candidate-title">植物の候補</h2>
        <p>候補を確認し、剪定データがある植物だけ詳細へ進めます。</p>
      </div>

      <div className="plant-identification-candidate-list">
        {candidates.slice(0, 3).map((candidate, index) => {
          const plantId = matchPlantIdentificationCandidate(
            candidate,
            availablePlantIds,
          );
          const score =
            typeof candidate.score === "number" && Number.isFinite(candidate.score)
              ? candidate.score.toFixed(3)
              : "情報なし";

          return (
            <article
              className="plant-identification-candidate"
              key={`${candidate.powoId ?? candidate.gbifId ?? candidate.scientificName ?? "candidate"}-${index}`}
            >
              <div className="plant-identification-candidate__heading">
                <span>候補 {index + 1}</span>
                <strong>{plantId ? "剪定データ対応済み" : "剪定データ未対応"}</strong>
              </div>
              <h3>
                {candidate.commonNames.join("、") ||
                  candidate.scientificNameWithoutAuthor}
              </h3>
              <dl className="plant-identification-candidate__details">
                <div>
                  <dt>学名</dt>
                  <dd>{candidate.scientificName ?? candidate.scientificNameWithoutAuthor ?? "情報なし"}</dd>
                </div>
                <div>
                  <dt>属</dt>
                  <dd>{candidate.genus ?? "情報なし"}</dd>
                </div>
                <div>
                  <dt>科</dt>
                  <dd>{candidate.family ?? "情報なし"}</dd>
                </div>
                <div>
                  <dt>Pl@ntNetの候補スコア</dt>
                  <dd>{score}</dd>
                </div>
              </dl>
              {plantId ? (
                <button
                  className="primary-button plant-identification-candidate__action"
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onViewPlant(plantId)}
                >
                  植物の詳細を見る
                </button>
              ) : (
                <p className="plant-identification-candidate__unsupported">
                  このアプリには対応する剪定データがありません
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

interface PlantPhotoIdentificationPageProps {
  availablePlantIds: ReadonlySet<string>;
  isAuthInitializing: boolean;
  onBackHome: () => void;
  onLogin: () => void;
  onViewPlant: (plantId: string) => void;
  userId?: string;
}

type PlantIdentificationAccessBlock = Extract<
  PlantIdentificationClientError["code"],
  "AUTH_REQUIRED" | "FEATURE_NOT_AVAILABLE"
>;

function formatMegabytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function getSubmissionStatusMessage(
  submitError: PlantIdentificationClientError | undefined,
  accessBlock: PlantIdentificationAccessBlock | undefined,
  hasCandidates: boolean,
  dailyLimitReached: boolean,
) {
  if (accessBlock === "AUTH_REQUIRED") {
    return "ログイン状態を確認できないため、写真を送信できません。ログイン画面から再度ログインしてください。";
  }
  if (accessBlock === "FEATURE_NOT_AVAILABLE") {
    return "このアカウントでは現在、写真を送信できません。";
  }
  if (dailyLimitReached) {
    return "本日の写真判定回数の上限に達しているため送信できません。";
  }
  if (submitError?.retryable) {
    return "同じ写真で再試行できます。Functionへ到達した再試行は、新たに1回として数えられる場合があります。";
  }
  if (submitError?.code === "FEATURE_NOT_AVAILABLE") {
    return "このアカウントでは現在、写真を送信できません。";
  }
  if (
    submitError?.category === "request" ||
    submitError?.category === "not-identified"
  ) {
    return "写真を選び直すと、改めて候補を調べられます。";
  }
  if (submitError) {
    return "現在はこの写真を再送信できません。";
  }
  if (hasCandidates) {
    return "同じ写真を再判定すると、新たに1回として数えられます。";
  }
  return "写真はこのボタンを押したときだけPl@ntNetへ送信されます。";
}

function PlantPhotoIdentificationPage({
  availablePlantIds,
  isAuthInitializing,
  onBackHome,
  onLogin,
  onViewPlant,
  userId,
}: PlantPhotoIdentificationPageProps) {
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [photo, setPhoto] = useState<PreparedPlantIdentificationPhoto>();
  const [candidates, setCandidates] = useState<
    readonly PlantIdentificationCandidate[]
  >([]);
  const [accessBlock, setAccessBlock] =
    useState<PlantIdentificationAccessBlock>();
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] =
    useState<PlantIdentificationClientError>();
  const [usage, setUsage] = useState<PlantIdentificationUsage>();
  const inputRef = useRef<HTMLInputElement>(null);
  const accessBlockRef = useRef<PlantIdentificationAccessBlock>();
  const dailyLimitReachedRef = useRef(false);
  const operationRef = useRef(0);
  const photoRef = useRef<PreparedPlantIdentificationPhoto>();
  const processingRef = useRef(false);
  const requestAbortRef = useRef<AbortController>();
  const requestOperationRef = useRef(0);
  const submittingRef = useRef(false);
  const userIdRef = useRef(userId);

  const updateAccessBlock = (
    nextAccessBlock: PlantIdentificationAccessBlock | undefined,
  ) => {
    accessBlockRef.current = nextAccessBlock;
    setAccessBlock(nextAccessBlock);
  };

  const updateDailyLimitReached = (isReached: boolean) => {
    dailyLimitReachedRef.current = isReached;
    setDailyLimitReached(isReached);
  };

  const clearIdentificationResults = () => {
    setCandidates([]);
    setUsage(undefined);
    setSubmitError(undefined);
    setHasSubmitted(false);
  };

  const discardPhoto = () => {
    if (photoRef.current) {
      releasePlantIdentificationPhoto(photoRef.current);
      photoRef.current = undefined;
    }
    setPhoto(undefined);
  };

  useEffect(() => {
    return () => {
      operationRef.current += 1;
      requestOperationRef.current += 1;
      processingRef.current = false;
      submittingRef.current = false;
      requestAbortRef.current?.abort();
      requestAbortRef.current = undefined;
      if (photoRef.current) {
        releasePlantIdentificationPhoto(photoRef.current);
        photoRef.current = undefined;
      }
    };
  }, []);

  useEffect(() => {
    if (userIdRef.current === userId && userId) return;
    userIdRef.current = userId;
    operationRef.current += 1;
    requestOperationRef.current += 1;
    processingRef.current = false;
    submittingRef.current = false;
    requestAbortRef.current?.abort();
    requestAbortRef.current = undefined;
    discardPhoto();
    clearIdentificationResults();
    updateAccessBlock(undefined);
    updateDailyLimitReached(false);
    setErrorMessage(undefined);
    setIsProcessing(false);
    setIsSubmitting(false);
  }, [userId]);

  const handlePhotoSelection = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (
      !selectedFile ||
      !userId ||
      accessBlockRef.current !== undefined ||
      processingRef.current ||
      submittingRef.current
    ) {
      return;
    }

    const operation = operationRef.current + 1;
    operationRef.current = operation;
    discardPhoto();
    clearIdentificationResults();
    setErrorMessage(undefined);
    processingRef.current = true;
    setIsProcessing(true);

    try {
      const preparedPhoto = await preparePlantIdentificationPhoto(selectedFile);
      if (operationRef.current !== operation) {
        releasePlantIdentificationPhoto(preparedPhoto);
        return;
      }
      photoRef.current = preparedPhoto;
      setPhoto(preparedPhoto);
    } catch (error) {
      if (operationRef.current !== operation) return;
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "写真を処理できませんでした。別の写真を選択してください。",
      );
    } finally {
      if (operationRef.current === operation) {
        processingRef.current = false;
        setIsProcessing(false);
      }
    }
  };

  const chooseAnotherPhoto = () => {
    if (
      accessBlockRef.current !== undefined ||
      processingRef.current ||
      submittingRef.current
    ) {
      return;
    }
    setErrorMessage(undefined);
    inputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (
      !photo ||
      !userId ||
      isProcessing ||
      submittingRef.current ||
      dailyLimitReachedRef.current ||
      accessBlockRef.current !== undefined
    ) {
      return;
    }

    const submittedPhoto = photo;
    const operation = requestOperationRef.current + 1;
    const controller = new AbortController();
    requestOperationRef.current = operation;
    requestAbortRef.current = controller;
    submittingRef.current = true;
    setIsSubmitting(true);
    setCandidates([]);
    setSubmitError(undefined);
    setHasSubmitted(true);

    try {
      const result = await identifyPlantFromPhoto(
        submittedPhoto.file,
        controller.signal,
      );
      if (
        requestOperationRef.current !== operation ||
        photoRef.current !== submittedPhoto ||
        userIdRef.current !== userId
      ) {
        return;
      }
      setCandidates(result.candidates);
      setUsage(result.usage);
      updateDailyLimitReached(result.usage.remainingCount === 0);
    } catch (error) {
      if (
        requestOperationRef.current !== operation ||
        photoRef.current !== submittedPhoto ||
        userIdRef.current !== userId
      ) {
        return;
      }

      const clientError =
        error instanceof PlantIdentificationClientError
          ? error
          : new PlantIdentificationClientError(
              "UNKNOWN_ERROR",
              "現在、写真判定を利用できません。時間を置いてお試しください。",
              "unexpected",
              false,
            );
      setCandidates([]);
      setSubmitError(clientError);
      setUsage(clientError.usage);
      updateDailyLimitReached(
        clientError.code === "DAILY_LIMIT_REACHED" ||
          clientError.usage?.remainingCount === 0,
      );
      if (
        clientError.code === "AUTH_REQUIRED" ||
        clientError.code === "FEATURE_NOT_AVAILABLE"
      ) {
        updateAccessBlock(clientError.code);
      }
      if (clientError.code === "AUTH_REQUIRED") {
        setUsage(undefined);
        setErrorMessage(undefined);
        discardPhoto();
      }
    } finally {
      if (requestOperationRef.current === operation) {
        requestAbortRef.current = undefined;
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    }
  };

  const canSubmit = Boolean(
    photo &&
      userId &&
      !isProcessing &&
      !isSubmitting &&
      !accessBlock &&
      !dailyLimitReached &&
      (!submitError || submitError.retryable),
  );

  return (
    <main className="app-main plant-identification-page">
      <button className="plant-detail__back" type="button" onClick={onBackHome}>
        <span aria-hidden="true">←</span>
        ホームへ戻る
      </button>

      <section className="intro plant-identification-page__intro">
        <div className="intro__copy">
          <span className="eyebrow">PHOTO IDENTIFICATION</span>
          <h1>写真から植物を調べる</h1>
          <p>写真から植物名の候補を探し、登録済みの剪定情報へ案内します。</p>
        </div>
      </section>

      {isAuthInitializing ? (
        <section className="section-card plant-identification-state" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <strong>ログイン状態を確認しています</strong>
          <p>しばらくお待ちください。</p>
        </section>
      ) : !userId ? (
        <section className="section-card plant-identification-login">
          <div className="section-card__heading">
            <span>LOGIN REQUIRED</span>
            <h2>ログインが必要です</h2>
            <p>写真判定は本人限定で提供する予定です。写真を選ぶ前にログインしてください。</p>
          </div>
          <button className="primary-button" type="button" onClick={onLogin}>
            ログインへ
          </button>
        </section>
      ) : (
        <>
          <section className="section-card plant-identification-photo" aria-labelledby="photo-selection-title">
            <div className="section-card__heading">
              <span>SELECT A PHOTO</span>
              <h2 id="photo-selection-title">写真を1枚選ぶ</h2>
              <p id="photo-selection-description">
                JPEG、PNG、WebP、HEIC、HEIF形式の20MB以下の写真を選択できます。
              </p>
            </div>

            <label
              className="plant-identification-visually-hidden"
              htmlFor="plant-identification-photo"
            >
              植物判定用の写真を選ぶ
            </label>
            <input
              ref={inputRef}
              id="plant-identification-photo"
              className="plant-identification-photo__input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
              aria-describedby="photo-selection-description"
              disabled={isProcessing || isSubmitting || Boolean(accessBlock)}
              onChange={(event) => void handlePhotoSelection(event)}
            />

            {!photo && !isProcessing && (
              <p className="plant-identification-photo__notice">
                写真を選んだだけでは外部へ送信されません。
              </p>
            )}

            {isProcessing && (
              <div className="plant-identification-processing" role="status">
                <span className="loading-spinner" aria-hidden="true" />
                <div>
                  <strong>写真をJPEGへ変換しています</strong>
                  <p>画面を閉じずにお待ちください。</p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="auth-message auth-message--error" role="alert">
                <strong>写真を準備できませんでした</strong>
                <p>{errorMessage}</p>
              </div>
            )}

            {photo && (
              <div className="plant-identification-preview">
                <p className="plant-identification-visually-hidden" role="status">
                  JPEGへの変換が完了しました。
                </p>
                <img src={photo.previewUrl} alt="植物判定用にJPEGへ変換した写真のプレビュー" />
                <dl>
                  <div>
                    <dt>変換後</dt>
                    <dd>{photo.width} × {photo.height}px・{formatMegabytes(photo.file.size)}・JPEG</dd>
                  </div>
                  <div>
                    <dt>元画像</dt>
                    <dd>{photo.originalWidth} × {photo.originalHeight}px・{formatMegabytes(photo.originalSize)}</dd>
                  </div>
                </dl>
                <button
                  className="plant-identification-secondary-button"
                  type="button"
                  disabled={isProcessing || isSubmitting || Boolean(accessBlock)}
                  onClick={chooseAnotherPhoto}
                >
                  写真を選び直す
                </button>
              </div>
            )}
          </section>

          {photo && (
            <section className="section-card plant-identification-consent" aria-labelledby="external-send-title">
              <div className="section-card__heading">
                <span>BEFORE SENDING</span>
                <h2 id="external-send-title">外部送信について</h2>
              </div>
              <div className="alert-box alert-box--info">
                <span className="alert-box__icon" aria-hidden="true">i</span>
                <div>
                  <p>
                    選択した写真は、植物の候補を調べるためPl@ntNetへ送信されます。このアプリのデータベースや写真保存領域には保存しません。
                  </p>
                  <p>
                    送信前にJPEGへ変換し、位置情報などの写真メタデータを除去します。Pl@ntNetでは写真自体は識別処理中だけ一時的に扱われますが、問い合わせ日時などの利用履歴が記録される場合があります。
                  </p>
                  <a
                    href="https://my.plantnet.org/terms_of_use"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pl@ntNetの利用規約を確認する
                  </a>
                </div>
              </div>
              <button
                className="primary-button"
                type="button"
                disabled={!canSubmit}
                onClick={() => void handleSubmit()}
              >
                {isSubmitting
                  ? "植物の候補を調べています…"
                  : "写真を送信して候補を調べる"}
              </button>
              {isSubmitting ? (
                <div className="plant-identification-submit-status" role="status">
                  <span className="loading-spinner" aria-hidden="true" />
                  <p>植物の候補を調べています。しばらくお待ちください。</p>
                </div>
              ) : (
                <p className="plant-identification-consent__status">
                  {getSubmissionStatusMessage(
                    submitError,
                    accessBlock,
                    hasSubmitted && candidates.length > 0,
                    dailyLimitReached,
                  )}
                </p>
              )}
            </section>
          )}

          {dailyLimitReached && (
            <section
              className="section-card plant-identification-state"
              aria-labelledby="plant-identification-limit-title"
              role="status"
            >
              <span className="alert-box__icon" aria-hidden="true">i</span>
              <div>
                <strong id="plant-identification-limit-title">
                  本日の写真判定回数の上限に達しました
                </strong>
                <p>
                  利用回数は日本時間の午前0時に日付が切り替わります。日付が変わった後はページを再読み込みしてください。
                </p>
              </div>
            </section>
          )}

          {usage && (
            <section
              className="section-card plant-identification-usage"
              aria-labelledby="plant-identification-usage-title"
            >
              <h2 id="plant-identification-usage-title">本日の利用回数</h2>
              <p>
                <strong>本日の写真判定：{usage.requestCount}／5回</strong>
                <span>残り{usage.remainingCount}回</span>
              </p>
              <small>このアプリで設定している本人向けの1日5回制限です。</small>
            </section>
          )}

          {(submitError || accessBlock) && (
            <section
              className="auth-message auth-message--error plant-identification-submit-error"
              role="alert"
            >
              <strong>写真判定を完了できませんでした</strong>
              <p>
                {accessBlock === "AUTH_REQUIRED"
                  ? "ログイン状態を確認できませんでした。ログイン画面から再度ログインしてください。"
                  : accessBlock === "FEATURE_NOT_AVAILABLE"
                    ? "このアカウントでは現在、写真判定を利用できません。"
                    : dailyLimitReached
                      ? "本日の写真判定回数の上限に達しているため、再送信できません。"
                      : submitError?.message}
              </p>
              {accessBlock === "AUTH_REQUIRED" && (
                <button className="primary-button" type="button" onClick={onLogin}>
                  ログイン画面へ
                </button>
              )}
              {!accessBlock &&
                (submitError?.category === "request" ||
                  submitError?.category === "not-identified") &&
                photo && (
                  <button
                    className="plant-identification-secondary-button"
                    type="button"
                    disabled={isSubmitting}
                    onClick={chooseAnotherPhoto}
                  >
                    写真を選び直す
                  </button>
                )}
            </section>
          )}

          {candidates.length > 0 && (
            <PlantIdentificationCandidateList
              availablePlantIds={availablePlantIds}
              candidates={candidates}
              isDisabled={isSubmitting}
              onViewPlant={onViewPlant}
            />
          )}
        </>
      )}
    </main>
  );
}

export default PlantPhotoIdentificationPage;
