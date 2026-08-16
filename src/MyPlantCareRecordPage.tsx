import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  createPlantCareRecord,
  getPlantCareRecord,
  plantCareWorkOptions as workOptions,
  plantConditionOptions as conditionOptions,
  updatePlantCareRecord,
} from "./data/plantCareRecords";
import type {
  PlantCareWorkCode as WorkTypeCode,
  PlantConditionCode,
} from "./data/plantCareRecords";
import { loadPlants } from "./data/loadPlants";
import {
  createPlantCareRecordPhotoSignedUrl,
  getPlantCareRecordPhoto,
  savePlantCareRecordPhoto,
  validateCompressedPlantCarePhoto,
} from "./data/plantCareRecordPhotos";
import { getUserPlantById } from "./data/userPlants";
import {
  compressPlantPhoto,
  PlantPhotoProcessingError,
  releaseCompressedPlantPhoto,
} from "./lib/plantPhotoCompression";
import type { CompressedPlantPhoto } from "./lib/plantPhotoCompression";
import PlantCareRecordPhotoViewer from "./PlantCareRecordPhotoViewer";
import type { PlantCareRecordPhoto } from "./types/plantCareRecordPhoto";
import type { UserPlant } from "./types/userPlant";

const allPlants = loadPlants(true);
const userPlantIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1) return false;
  const candidate = new Date(0);
  candidate.setHours(0, 0, 0, 0);
  candidate.setFullYear(year, month - 1, day);
  return (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
  );
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${bytes}B`;
}

function PlantPhotoSelector({
  disabled,
  errorMessage,
  isCompressing,
  onChange,
  onRemove,
  photo,
}: {
  disabled: boolean;
  errorMessage: string;
  isCompressing: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  photo: CompressedPlantPhoto | null;
}) {
  const reductionRate =
    photo && photo.originalSize > 0 && photo.compressedSize < photo.originalSize
      ? Math.round((1 - photo.compressedSize / photo.originalSize) * 100)
      : null;
  const outputFormat = photo?.outputMimeType === "image/webp" ? "WebP" : "JPEG";

  return (
    <section className="plant-care-photo-field" aria-labelledby="plant-care-photo-title">
      <div className="plant-care-photo-field__heading">
        <h3 id="plant-care-photo-title">写真（任意）</h3>
        <p>植物の現在の状態が分かる写真を1枚選択してください。</p>
        <p>写真は端末内で縮小・圧縮してプレビューします。</p>
      </div>

      <div className="plant-care-photo-note" role="note">
        <strong>圧縮済みの写真だけを手入れ記録と一緒に保存します。</strong>
        <span>元画像はアップロードされません。写真なしでも記録できます。</span>
      </div>

      <input
        className="visually-hidden"
        id="plant-care-photo"
        type="file"
        accept="image/*"
        disabled={disabled}
        onChange={onChange}
      />
      <label
        className={`plant-care-photo-picker${disabled ? " is-disabled" : ""}`}
        htmlFor="plant-care-photo"
        aria-disabled={disabled}
      >
        <strong>
          {isCompressing
            ? "写真を圧縮しています…"
            : photo
              ? "別の写真を選ぶ"
              : "写真を選択する"}
        </strong>
        <span>カメラ撮影または写真フォルダから選択</span>
        <small>JPEG・PNG・WebP・HEIC・HEIF／最大20MB</small>
      </label>

      {isCompressing && (
        <div className="plant-care-photo-processing" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          <div>
            <strong>写真を圧縮しています</strong>
            <p>画面を閉じずにお待ちください。</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="alert-box alert-box--error plant-care-photo-error" role="alert">
          <div>
            <strong>写真を処理できませんでした</strong>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {photo && (
        <div className="plant-care-photo-result">
          <strong className="plant-care-photo-result__status" role="status">
            写真の圧縮が完了しました
          </strong>
          <figure className="plant-care-photo-preview">
            <img
              src={photo.previewUrl}
              alt={`選択した植物の状態写真：${photo.originalFileName}`}
            />
            <figcaption>{photo.originalFileName}</figcaption>
          </figure>
          <dl className="plant-care-photo-details">
            <div><dt>圧縮前</dt><dd>{formatFileSize(photo.originalSize)}</dd></div>
            <div><dt>圧縮後</dt><dd>{formatFileSize(photo.compressedSize)}</dd></div>
            {reductionRate !== null && (
              <div><dt>削減率</dt><dd>{reductionRate}%</dd></div>
            )}
            <div>
              <dt>元画像サイズ</dt>
              <dd>{photo.originalWidth} × {photo.originalHeight}px</dd>
            </div>
            <div>
              <dt>圧縮後サイズ</dt>
              <dd>{photo.compressedWidth} × {photo.compressedHeight}px</dd>
            </div>
            <div><dt>出力形式</dt><dd>{outputFormat}</dd></div>
          </dl>
          <button
            className="plant-care-photo-remove"
            type="button"
            disabled={disabled}
            onClick={onRemove}
          >
            写真を削除する
          </button>
        </div>
      )}
    </section>
  );
}

interface MyPlantCareRecordPageProps {
  isAuthInitializing: boolean;
  onBackToMyPlants: () => void;
  onLogin: () => void;
  onUpdated?: (userPlantId: string) => void;
  recordId?: string;
  userId?: string;
  userPlantId: string;
}

function MyPlantCareRecordPage({
  isAuthInitializing,
  onBackToMyPlants,
  onLogin,
  onUpdated,
  recordId,
  userId,
  userPlantId,
}: MyPlantCareRecordPageProps) {
  const [userPlant, setUserPlant] = useState<UserPlant | null>(null);
  const [isLoadingPlant, setIsLoadingPlant] = useState(false);
  const [plantLoadError, setPlantLoadError] = useState("");
  const [isPlantUnavailable, setIsPlantUnavailable] = useState(false);
  const [recordDate, setRecordDate] = useState(() => getLocalDateValue());
  const [plantCondition, setPlantCondition] = useState<PlantConditionCode | "">("");
  const [conditionOther, setConditionOther] = useState("");
  const [workTypes, setWorkTypes] = useState<WorkTypeCode[]>([]);
  const [workOther, setWorkOther] = useState("");
  const [memo, setMemo] = useState("");
  const [validationError, setValidationError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [pendingPhotoRecordId, setPendingPhotoRecordId] = useState<string | null>(null);
  const [photoSaveWarning, setPhotoSaveWarning] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<CompressedPlantPhoto | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [savedPhoto, setSavedPhoto] = useState<PlantCareRecordPhoto | null>(null);
  const [savedPhotoUrl, setSavedPhotoUrl] = useState<string | null>(null);
  const [savedPhotoStatus, setSavedPhotoStatus] = useState<
    "error" | "idle" | "loading" | "none" | "ready"
  >("idle");
  const [savedPhotoAutomaticRetryUsed, setSavedPhotoAutomaticRetryUsed] =
    useState(false);
  const [savedPhotoRetryKey, setSavedPhotoRetryKey] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const selectedPhotoRef = useRef<CompressedPlantPhoto | null>(null);
  const photoRequestIdRef = useRef(0);
  const saveRequestIdRef = useRef(0);
  const recordAttemptIdRef = useRef<string | null>(null);
  const savedPhotoRequestIdRef = useRef(0);
  const savedPhotoFailedUrlRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const today = getLocalDateValue();
  const isEditing = recordId !== undefined;

  useEffect(() => {
    setUserPlant(null);
    setPlantLoadError("");
    setIsPlantUnavailable(false);
    setIsLoadingPlant(false);
    setRecordDate(getLocalDateValue());
    setPlantCondition("");
    setConditionOther("");
    setWorkTypes([]);
    setWorkOther("");
    setMemo("");
    setValidationError("");
    setSaveError("");
    setSuccessMessage("");
    setPendingPhotoRecordId(null);
    setPhotoSaveWarning("");
    setIsSaving(false);
    setIsSavingPhoto(false);
    recordAttemptIdRef.current = null;
    saveRequestIdRef.current += 1;
    photoRequestIdRef.current += 1;
    if (selectedPhotoRef.current) {
      releaseCompressedPlantPhoto(selectedPhotoRef.current);
      selectedPhotoRef.current = null;
    }
    setSelectedPhoto(null);
    setPhotoError("");
    setIsCompressingPhoto(false);
    setSavedPhoto(null);
    setSavedPhotoUrl(null);
    setSavedPhotoStatus("idle");
    setSavedPhotoAutomaticRetryUsed(false);
    savedPhotoFailedUrlRef.current = null;
    savedPhotoRequestIdRef.current += 1;

    if (!userId) return;
    if (
      !userPlantIdPattern.test(userPlantId) ||
      (isEditing && (!recordId || !userPlantIdPattern.test(recordId)))
    ) {
      setIsPlantUnavailable(true);
      return;
    }

    let isCurrent = true;
    setIsLoadingPlant(true);
    void Promise.all([
      getUserPlantById({ userPlantId, userId }),
      isEditing && recordId
        ? getPlantCareRecord({ recordId, userPlantId, userId })
        : Promise.resolve(null),
    ])
      .then(([item, record]) => {
        if (!isCurrent) return;
        if (!item || (isEditing && !record)) {
          setIsPlantUnavailable(true);
          return;
        }

        if (record) {
          const condition = conditionOptions.find(
            (option) => option.code === record.plantCondition,
          )?.code;
          const works = record.workTypes.map(
            (code) => workOptions.find((option) => option.code === code)?.code,
          );
          if (!condition || works.length === 0 || works.some((code) => !code)) {
            setIsPlantUnavailable(true);
            return;
          }
          setRecordDate(record.recordDate);
          setPlantCondition(condition);
          setConditionOther(record.conditionOther ?? "");
          setWorkTypes(works as WorkTypeCode[]);
          setWorkOther(record.workOther ?? "");
          setMemo(record.memo ?? "");
        }
        setUserPlant(item);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setPlantLoadError(
          error instanceof Error
            ? error.message
            : "対象の植物を確認できませんでした。",
        );
      })
      .finally(() => {
        if (isCurrent) setIsLoadingPlant(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [isEditing, recordId, userId, userPlantId]);

  useEffect(() => {
    if (!isEditing || !recordId || !userId || !userPlant) return;

    let isCurrent = true;
    const requestId = savedPhotoRequestIdRef.current + 1;
    savedPhotoRequestIdRef.current = requestId;
    setSavedPhoto(null);
    setSavedPhotoUrl(null);
    setSavedPhotoStatus("loading");
    setSavedPhotoAutomaticRetryUsed(false);
    savedPhotoFailedUrlRef.current = null;

    void (async () => {
      try {
        const photo = await getPlantCareRecordPhoto({
          recordId,
          userPlantId: userPlant.id,
          userId,
        });
        if (!isCurrent || savedPhotoRequestIdRef.current !== requestId) return;
        if (!photo) {
          setSavedPhotoStatus("none");
          return;
        }

        setSavedPhoto(photo);
        const signedUrl = await createPlantCareRecordPhotoSignedUrl({
          photo,
          userPlantId: userPlant.id,
          userId,
        });
        if (!isCurrent || savedPhotoRequestIdRef.current !== requestId) return;
        setSavedPhotoUrl(signedUrl);
        setSavedPhotoStatus("ready");
      } catch {
        if (!isCurrent || savedPhotoRequestIdRef.current !== requestId) return;
        setSavedPhotoStatus("error");
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [isEditing, recordId, savedPhotoRetryKey, userId, userPlant]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      saveRequestIdRef.current += 1;
      photoRequestIdRef.current += 1;
      savedPhotoRequestIdRef.current += 1;
      if (selectedPhotoRef.current) {
        releaseCompressedPlantPhoto(selectedPhotoRef.current);
        selectedPhotoRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (userPlant) headingRef.current?.focus();
  }, [userPlant]);

  const clearFeedback = () => {
    setValidationError("");
    setSaveError("");
    setSuccessMessage("");
  };

  const canUpdateSaveState = (requestId: number) =>
    isMountedRef.current && saveRequestIdRef.current === requestId;

  const resetNewRecordForm = () => {
    clearSelectedPhoto();
    setPendingPhotoRecordId(null);
    setPhotoSaveWarning("");
    recordAttemptIdRef.current = null;
    setRecordDate(getLocalDateValue());
    setPlantCondition("");
    setConditionOther("");
    setWorkTypes([]);
    setWorkOther("");
    setMemo("");
  };

  const clearSelectedPhoto = () => {
    photoRequestIdRef.current += 1;
    if (selectedPhotoRef.current) {
      releaseCompressedPlantPhoto(selectedPhotoRef.current);
      selectedPhotoRef.current = null;
    }
    setSelectedPhoto(null);
    setPhotoError("");
    setIsCompressingPhoto(false);
  };

  const refreshSavedPhotoUrl = async (
    photo: PlantCareRecordPhoto,
    automaticRetryUsed: boolean,
  ) => {
    if (!userId || !userPlant) return;
    const requestId = savedPhotoRequestIdRef.current + 1;
    savedPhotoRequestIdRef.current = requestId;
    setSavedPhoto(photo);
    setSavedPhotoUrl(null);
    setSavedPhotoStatus("loading");
    setSavedPhotoAutomaticRetryUsed(automaticRetryUsed);
    if (!automaticRetryUsed) savedPhotoFailedUrlRef.current = null;

    try {
      const signedUrl = await createPlantCareRecordPhotoSignedUrl({
        photo,
        userPlantId: userPlant.id,
        userId,
      });
      if (!isMountedRef.current || savedPhotoRequestIdRef.current !== requestId) {
        return;
      }
      setSavedPhotoUrl(signedUrl);
      setSavedPhotoStatus("ready");
    } catch {
      if (!isMountedRef.current || savedPhotoRequestIdRef.current !== requestId) {
        return;
      }
      setSavedPhotoStatus("error");
    }
  };

  const handleSavedPhotoError = (failedUrl: string) => {
    if (!savedPhoto || savedPhotoUrl !== failedUrl) return;
    if (savedPhotoFailedUrlRef.current === failedUrl) return;
    savedPhotoFailedUrlRef.current = failedUrl;
    if (savedPhotoAutomaticRetryUsed) {
      setSavedPhotoUrl(null);
      setSavedPhotoStatus("error");
      return;
    }
    void refreshSavedPhotoUrl(savedPhoto, true);
  };

  const retrySavedPhoto = () => {
    if (savedPhoto) {
      void refreshSavedPhotoUrl(savedPhoto, false);
      return;
    }
    setSavedPhotoRetryKey((current) => current + 1);
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (
      !file ||
      isSaving ||
      isSavingPhoto ||
      isCompressingPhoto ||
      pendingPhotoRecordId
    ) return;

    clearFeedback();
    setPhotoError("");
    const requestId = photoRequestIdRef.current + 1;
    photoRequestIdRef.current = requestId;
    setIsCompressingPhoto(true);

    try {
      const nextPhoto = await compressPlantPhoto(file);
      if (photoRequestIdRef.current !== requestId) {
        releaseCompressedPlantPhoto(nextPhoto);
        return;
      }
      if (selectedPhotoRef.current) {
        releaseCompressedPlantPhoto(selectedPhotoRef.current);
      }
      selectedPhotoRef.current = nextPhoto;
      setSelectedPhoto(nextPhoto);
    } catch (error) {
      if (photoRequestIdRef.current !== requestId) return;
      setPhotoError(
        error instanceof PlantPhotoProcessingError
          ? error.message
          : "写真を処理できませんでした。別の写真を選択してください。",
      );
    } finally {
      if (photoRequestIdRef.current === requestId) setIsCompressingPhoto(false);
    }
  };

  const handleConditionChange = (code: PlantConditionCode) => {
    clearFeedback();
    setPlantCondition(code);
    if (code !== "other") setConditionOther("");
  };

  const handleWorkChange = (code: WorkTypeCode, checked: boolean) => {
    clearFeedback();
    setWorkTypes((current) =>
      checked
        ? Array.from(new Set([...current, code]))
        : current.filter((item) => item !== code),
    );
    if (code === "other" && !checked) setWorkOther("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      isSaving ||
      isSavingPhoto ||
      isCompressingPhoto ||
      pendingPhotoRecordId
    ) return;

    setValidationError("");
    setSaveError("");
    setSuccessMessage("");

    if (!userId) {
      setSaveError("記録を保存するにはログインが必要です。");
      return;
    }
    if (!userPlant || userPlant.userId !== userId || userPlant.id !== userPlantId) {
      setSaveError(
        isEditing
          ? "対象の記録が見つからないか、このアカウントでは利用できません"
          : "対象の植物が見つからないか、このアカウントでは利用できません。",
      );
      return;
    }

    const currentLocalDate = getLocalDateValue();
    if (!recordDate || !isCalendarDate(recordDate)) {
      setValidationError("記録日を正しく入力してください。");
      return;
    }
    if (recordDate > currentLocalDate) {
      setValidationError("未来の日付は記録できません。");
      return;
    }
    if (!conditionOptions.some((option) => option.code === plantCondition)) {
      setValidationError("植物の状態を1つ選択してください。");
      return;
    }

    const trimmedConditionOther = conditionOther.trim();
    if (plantCondition === "other" && !trimmedConditionOther) {
      setValidationError("植物の状態の「その他」を入力してください。");
      return;
    }

    const uniqueWorkTypes = Array.from(new Set(workTypes));
    if (
      uniqueWorkTypes.length === 0 ||
      uniqueWorkTypes.some(
        (code) => !workOptions.some((option) => option.code === code),
      )
    ) {
      setValidationError("行った作業を1つ以上選択してください。");
      return;
    }

    const trimmedWorkOther = workOther.trim();
    if (uniqueWorkTypes.includes("other") && !trimmedWorkOther) {
      setValidationError("行った作業の「その他」を入力してください。");
      return;
    }

    const trimmedMemo = memo.trim();
    if (
      trimmedConditionOther.length > 200 ||
      trimmedWorkOther.length > 200 ||
      trimmedMemo.length > 2000
    ) {
      setValidationError("入力できる文字数を超えています。内容を短くしてください。");
      return;
    }

    if (selectedPhoto) {
      try {
        validateCompressedPlantCarePhoto(selectedPhoto);
      } catch (error) {
        setPhotoError(
          error instanceof Error
            ? error.message
            : "圧縮済み写真を保存できません。別の写真を選択してください。",
        );
        return;
      }
    }

    const requestId = saveRequestIdRef.current + 1;
    saveRequestIdRef.current = requestId;
    const recordAttemptId = isEditing
      ? null
      : recordAttemptIdRef.current ?? crypto.randomUUID();
    if (!isEditing && !recordAttemptIdRef.current) {
      recordAttemptIdRef.current = recordAttemptId;
    }
    let createdRecordId: string | null = null;
    setIsSaving(true);
    try {
      const ownedPlant = await getUserPlantById({ userPlantId, userId });
      if (!canUpdateSaveState(requestId)) return;
      if (!ownedPlant || ownedPlant.id !== userPlant.id) {
        setSaveError(
          isEditing
            ? "対象の記録が見つからないか、このアカウントでは利用できません"
            : "対象の植物が見つからないか、このアカウントでは利用できません。",
        );
        return;
      }

      const input = {
        userPlantId: userPlant.id,
        userId,
        recordDate,
        plantCondition,
        conditionOther: plantCondition === "other" ? trimmedConditionOther : null,
        workTypes: uniqueWorkTypes,
        workOther: uniqueWorkTypes.includes("other") ? trimmedWorkOther : null,
        memo: trimmedMemo || null,
      };
      if (isEditing && recordId) {
        const wasUpdated = await updatePlantCareRecord({ ...input, recordId });
        if (!canUpdateSaveState(requestId)) return;
        if (!wasUpdated) {
          setSaveError(
            "対象の記録が見つからないか、このアカウントでは利用できません",
          );
          return;
        }
        onUpdated?.(userPlant.id);
        return;
      }

      const createResult = await createPlantCareRecord({
        ...input,
        recordId: recordAttemptId!,
      });
      if (!canUpdateSaveState(requestId)) return;
      if (createResult.status !== "saved") {
        setSaveError(
          createResult.status === "unknown"
            ? "手入れ記録の保存結果を確認できませんでした。同じ記録として再確認してください。"
            : createResult.status === "conflict"
              ? "同じ保存操作の記録内容を安全に確認できませんでした。過去の記録を確認してください。"
              : "手入れ記録を保存できませんでした。同じ記録としてもう一度お試しください。",
        );
        return;
      }
      createdRecordId = createResult.recordId;

      if (!selectedPhoto) {
        resetNewRecordForm();
        setSuccessMessage("状態・作業記録を保存しました。");
        return;
      }

      const photoResult = await savePlantCareRecordPhoto({
        photo: selectedPhoto,
        recordId: createdRecordId,
        userId,
        userPlantId: userPlant.id,
      });
      if (!canUpdateSaveState(requestId)) return;

      if (photoResult.cleanupFailed) {
        console.error(
          "[plant-care-records] Photo cleanup requires another attempt",
        );
      }
      if (photoResult.status !== "saved") {
        setPendingPhotoRecordId(createdRecordId);
        setPhotoSaveWarning(
          photoResult.status === "unknown"
            ? "写真の保存結果を確認できませんでした。写真だけ再試行してください。"
            : photoResult.status === "conflict"
              ? "保存済みの写真情報を安全に確認できませんでした。写真だけ再試行してください。"
              : "手入れ記録は保存されましたが、写真を保存できませんでした。写真だけ再試行できます。",
        );
        return;
      }

      resetNewRecordForm();
      setSuccessMessage("状態・作業記録と写真を保存しました。");
    } catch (error) {
      if (!canUpdateSaveState(requestId)) return;
      if (createdRecordId && selectedPhoto) {
        setPendingPhotoRecordId(createdRecordId);
        setPhotoSaveWarning(
          "写真の保存結果を確認できませんでした。写真だけ再試行してください。",
        );
        return;
      }
      setSaveError(
        error instanceof Error
          ? error.message
          : "記録を保存できませんでした。時間をおいてもう一度お試しください。",
      );
    } finally {
      if (canUpdateSaveState(requestId)) setIsSaving(false);
    }
  };

  const handlePhotoRetry = async () => {
    if (
      isSaving ||
      isSavingPhoto ||
      isCompressingPhoto ||
      !pendingPhotoRecordId ||
      !selectedPhoto ||
      !userId ||
      !userPlant
    ) return;

    const requestId = saveRequestIdRef.current + 1;
    saveRequestIdRef.current = requestId;
    setSaveError("");
    setSuccessMessage("");
    setIsSavingPhoto(true);

    try {
      const [ownedPlant, savedRecord] = await Promise.all([
        getUserPlantById({ userPlantId: userPlant.id, userId }),
        getPlantCareRecord({
          recordId: pendingPhotoRecordId,
          userPlantId: userPlant.id,
          userId,
        }),
      ]);
      if (!canUpdateSaveState(requestId)) return;
      if (!ownedPlant || !savedRecord) {
        setPhotoSaveWarning(
          "保存済みの手入れ記録を確認できないため、写真を再試行できませんでした。",
        );
        return;
      }

      const photoResult = await savePlantCareRecordPhoto({
        photo: selectedPhoto,
        recordId: pendingPhotoRecordId,
        userId,
        userPlantId: userPlant.id,
      });
      if (!canUpdateSaveState(requestId)) return;

      if (photoResult.cleanupFailed) {
        console.error(
          "[plant-care-records] Photo retry cleanup requires another attempt",
        );
      }
      if (photoResult.status !== "saved") {
        setPhotoSaveWarning(
          photoResult.status === "unknown"
            ? "写真の保存結果を確認できませんでした。写真だけ再試行してください。"
            : photoResult.status === "conflict"
              ? "保存済みの写真情報を安全に確認できませんでした。写真だけ再試行してください。"
              : "手入れ記録は保存されていますが、写真を保存できませんでした。写真だけ再試行できます。",
        );
        return;
      }

      resetNewRecordForm();
      setSuccessMessage("写真を保存しました。");
    } catch {
      if (!canUpdateSaveState(requestId)) return;
      setPhotoSaveWarning(
        "写真の保存結果を確認できませんでした。写真だけ再試行してください。",
      );
    } finally {
      if (canUpdateSaveState(requestId)) setIsSavingPhoto(false);
    }
  };

  if (isAuthInitializing) {
    return (
      <main className="app-main plant-care-page">
        <div className="loading-state plant-care-state" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          <strong>ログイン状態を確認しています</strong>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="app-main plant-care-page">
        <button className="plant-detail__back" type="button" onClick={onBackToMyPlants}>
          <span aria-hidden="true">←</span>
          自分の植物一覧へ戻る
        </button>
        <section className="section-card my-plants-login" aria-labelledby="plant-care-login-title">
          <p className="eyebrow">CARE RECORD</p>
          <h1 id="plant-care-login-title">{isEditing ? "記録の編集" : "記録の保存"}にはログインが必要です</h1>
          <p>ログイン後、自分の植物からもう一度記録画面を開いてください。</p>
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
          <strong>{isEditing ? "対象の記録" : "対象の植物"}を確認しています</strong>
        </div>
      </main>
    );
  }

  if (plantLoadError || isPlantUnavailable || !userPlant) {
    return (
      <main className="app-main plant-care-page">
        <button className="plant-detail__back" type="button" onClick={onBackToMyPlants}>
          <span aria-hidden="true">←</span>
          自分の植物一覧へ戻る
        </button>
        <section className="section-card plant-care-state-card" aria-labelledby="plant-care-unavailable-title">
          <p className="eyebrow">CARE RECORD</p>
          <h1 id="plant-care-unavailable-title">{isEditing ? "記録を編集できません" : "記録する植物を確認できませんでした"}</h1>
          <p>
            {plantLoadError ||
              (isEditing
                ? "対象の記録が見つからないか、このアカウントでは利用できません"
                : "対象の植物が見つからないか、このアカウントでは利用できません。")}
          </p>
        </section>
      </main>
    );
  }

  const plant = allPlants.find((item) => item.id === userPlant.plantId);
  const displayName = userPlant.nickname || "設定なし";
  const isBusy = isSaving || isSavingPhoto;
  const isFormLocked = isBusy || Boolean(pendingPhotoRecordId);

  return (
    <main className="app-main plant-care-page">
      <button className="plant-detail__back" type="button" onClick={onBackToMyPlants}>
        <span aria-hidden="true">←</span>
        {isEditing ? "過去の記録へ戻る" : "自分の植物一覧へ戻る"}
      </button>

      <section className="intro plant-care-page__intro" aria-labelledby="plant-care-title">
        <div className="intro__copy">
          <span className="eyebrow">CARE RECORD</span>
          <h1 id="plant-care-title" ref={headingRef} tabIndex={-1}>
            {isEditing ? "記録を編集する" : "状態・作業を記録する"}
          </h1>
          <dl className="plant-care-identity">
            <div>
              <dt>植物名</dt>
              <dd>{plant?.nameJa || "植物情報は現在表示できません"}</dd>
            </div>
            <div>
              <dt>呼び名</dt>
              <dd>{displayName}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section-card plant-care-form-card" aria-labelledby="plant-care-form-title">
        <div className="section-card__heading">
          <span>{isEditing ? "EDIT RECORD" : "NEW RECORD"}</span>
          <h2 id="plant-care-form-title">{isEditing ? "記録内容の編集" : "新しい記録"}</h2>
          <p>{isEditing ? "保存済みの内容を変更できます。" : "現在の状態と、行った作業を入力してください。"}</p>
        </div>

        <form className="plant-care-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className="field">
            <label htmlFor="plant-care-record-date">記録日</label>
            <input
              id="plant-care-record-date"
              type="date"
              max={today}
              value={recordDate}
              onChange={(event) => {
                clearFeedback();
                setRecordDate(event.target.value);
              }}
              disabled={isFormLocked}
              required
            />
          </div>

          {isEditing ? (
            <section className="plant-care-photo-field" aria-labelledby="plant-care-photo-title">
              <div className="plant-care-photo-field__heading">
                <h3 id="plant-care-photo-title">保存済み写真</h3>
              </div>
              {(savedPhotoStatus === "idle" ||
                (savedPhotoStatus === "loading" && !savedPhoto)) && (
                <div className="saved-plant-photo__loading" role="status">
                  <span className="loading-spinner" aria-hidden="true" />
                  <span>保存済み写真を確認しています…</span>
                </div>
              )}
              {savedPhotoStatus === "none" && (
                <div className="plant-care-photo-note" role="note">
                  <strong>保存されている写真はありません。</strong>
                  <span>既存記録への写真追加は、次の段階で対応します。</span>
                </div>
              )}
              {savedPhoto &&
                (savedPhotoStatus === "loading" ||
                  savedPhotoStatus === "ready" ||
                  savedPhotoStatus === "error") && (
                  <PlantCareRecordPhotoViewer
                    alt={`${displayName}の保存済み記録写真`}
                    signedUrl={savedPhotoUrl}
                    status={savedPhotoStatus}
                    variant="detail"
                    onImageError={handleSavedPhotoError}
                    onRetry={retrySavedPhoto}
                  />
                )}
              {savedPhotoStatus === "error" && !savedPhoto && (
                <div className="saved-plant-photo__error" role="alert">
                  <span>保存済み写真を確認できませんでした。</span>
                  <button type="button" onClick={retrySavedPhoto}>
                    写真だけ再読み込みする
                  </button>
                </div>
              )}
              <div className="plant-care-photo-note" role="note">
                <span>写真の追加・変更・写真だけの削除は、次の段階で対応します。</span>
              </div>
            </section>
          ) : (
            <PlantPhotoSelector
              disabled={isBusy || isCompressingPhoto || Boolean(pendingPhotoRecordId)}
              errorMessage={photoError}
              isCompressing={isCompressingPhoto}
              onChange={(event) => void handlePhotoChange(event)}
              onRemove={clearSelectedPhoto}
              photo={selectedPhoto}
            />
          )}

          <fieldset className="plant-care-fieldset" disabled={isFormLocked}>
            <legend>植物の状態</legend>
            <p>現在の状態を1つ選択してください。</p>
            <div className="plant-care-options">
              {conditionOptions.map((option) => (
                <label className="plant-care-option" key={option.code}>
                  <input
                    type="radio"
                    name="plant-condition"
                    value={option.code}
                    checked={plantCondition === option.code}
                    onChange={() => handleConditionChange(option.code)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {plantCondition === "other" && (
            <div className="field plant-care-other-field">
              <label htmlFor="plant-condition-other">植物の状態（その他）</label>
              <input
                id="plant-condition-other"
                type="text"
                maxLength={200}
                value={conditionOther}
                onChange={(event) => {
                  clearFeedback();
                  setConditionOther(event.target.value);
                }}
                disabled={isFormLocked}
                required
              />
              <small>{conditionOther.length}/200文字</small>
            </div>
          )}

          <fieldset className="plant-care-fieldset" disabled={isFormLocked}>
            <legend>行った作業</legend>
            <p>当てはまる作業を1つ以上選択してください。</p>
            <div className="plant-care-options">
              {workOptions.map((option) => (
                <label className="plant-care-option" key={option.code}>
                  <input
                    type="checkbox"
                    value={option.code}
                    checked={workTypes.includes(option.code)}
                    onChange={(event) => handleWorkChange(option.code, event.target.checked)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {workTypes.includes("other") && (
            <div className="field plant-care-other-field">
              <label htmlFor="plant-work-other">行った作業（その他）</label>
              <input
                id="plant-work-other"
                type="text"
                maxLength={200}
                value={workOther}
                onChange={(event) => {
                  clearFeedback();
                  setWorkOther(event.target.value);
                }}
                disabled={isFormLocked}
                required
              />
              <small>{workOther.length}/200文字</small>
            </div>
          )}

          <div className="field">
            <label htmlFor="plant-care-memo">
              メモ
              <span>任意</span>
            </label>
            <textarea
              id="plant-care-memo"
              maxLength={2000}
              value={memo}
              onChange={(event) => {
                clearFeedback();
                setMemo(event.target.value);
              }}
              disabled={isFormLocked}
              placeholder="気づいたことや、次回確認したいこと"
            />
            <small>{memo.length}/2000文字</small>
          </div>

          {validationError && (
            <div className="alert-box alert-box--warning" role="alert">
              <div>
                <strong>入力内容を確認してください</strong>
                <p>{validationError}</p>
              </div>
            </div>
          )}
          {saveError && (
            <div className="alert-box alert-box--error" role="alert">
              <div>
                <strong>{isEditing ? "更新に失敗しました" : "保存に失敗しました"}</strong>
                <p>{saveError}</p>
              </div>
            </div>
          )}
          {photoSaveWarning && pendingPhotoRecordId && (
            <div className="alert-box alert-box--warning plant-care-photo-retry" role="alert">
              <div>
                <strong>写真の保存を完了できませんでした</strong>
                <p>{photoSaveWarning}</p>
                <button
                  className="primary-button"
                  type="button"
                  disabled={isBusy || isCompressingPhoto}
                  onClick={() => void handlePhotoRetry()}
                >
                  {isSavingPhoto ? "写真を保存中…" : "写真だけ再試行する"}
                </button>
              </div>
            </div>
          )}
          {successMessage && (
            <div className="plant-care-success" role="status">
              <strong>{successMessage}</strong>
              <p>続けて別の記録を入力するか、自分の植物一覧へ戻れます。</p>
              <button type="button" onClick={onBackToMyPlants}>
                自分の植物一覧へ戻る
              </button>
            </div>
          )}

          <button
            className="primary-button plant-care-submit"
            type="submit"
            disabled={isBusy || isCompressingPhoto || Boolean(pendingPhotoRecordId)}
          >
            {isCompressingPhoto
              ? "写真を圧縮中…"
              : isBusy
                ? (isEditing ? "更新中…" : "保存中…")
                : (isEditing ? "変更を保存する" : "記録を保存する")}
          </button>
        </form>
      </section>
    </main>
  );
}

export default MyPlantCareRecordPage;
