import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { matchPlantIdentificationCandidate } from "./data/plantIdentificationMappings";
import {
  preparePlantIdentificationPhoto,
  releasePlantIdentificationPhoto,
  type PreparedPlantIdentificationPhoto,
} from "./lib/plantIdentificationPhoto";
import type { PlantIdentificationCandidate } from "./types/plantIdentification";

interface PlantIdentificationCandidateListProps {
  availablePlantIds: ReadonlySet<string>;
  candidates: readonly PlantIdentificationCandidate[];
  onViewPlant: (plantId: string) => void;
}

export function PlantIdentificationCandidateList({
  availablePlantIds,
  candidates,
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
              <h3>{candidate.commonNames?.join("、") || "一般名の情報なし"}</h3>
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

function formatMegabytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
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
  const candidates: readonly PlantIdentificationCandidate[] = [];
  const inputRef = useRef<HTMLInputElement>(null);
  const operationRef = useRef(0);
  const photoRef = useRef<PreparedPlantIdentificationPhoto>();
  const processingRef = useRef(false);

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
      processingRef.current = false;
      if (photoRef.current) {
        releasePlantIdentificationPhoto(photoRef.current);
        photoRef.current = undefined;
      }
    };
  }, []);

  useEffect(() => {
    if (userId) return;
    operationRef.current += 1;
    processingRef.current = false;
    discardPhoto();
    setErrorMessage(undefined);
    setIsProcessing(false);
  }, [userId]);

  const handlePhotoSelection = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!selectedFile || !userId || processingRef.current) return;

    const operation = operationRef.current + 1;
    operationRef.current = operation;
    discardPhoto();
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
    if (processingRef.current) return;
    setErrorMessage(undefined);
    inputRef.current?.click();
  };

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
            ログイン・新規登録へ
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
              disabled={isProcessing}
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
                  disabled={isProcessing}
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
              <button className="primary-button" type="button" disabled>
                写真を送信して候補を調べる
              </button>
              <p className="plant-identification-consent__status">
                API接続は次の工程で実装します。
              </p>
            </section>
          )}

          {candidates.length > 0 && (
            <PlantIdentificationCandidateList
              availablePlantIds={availablePlantIds}
              candidates={candidates}
              onViewPlant={onViewPlant}
            />
          )}
        </>
      )}
    </main>
  );
}

export default PlantPhotoIdentificationPage;
