import { FormEvent, useEffect, useRef, useState } from "react";
import { createPlantCareRecord } from "./data/plantCareRecords";
import { loadPlants } from "./data/loadPlants";
import { getUserPlantById } from "./data/userPlants";
import type { UserPlant } from "./types/userPlant";

const conditionOptions = [
  { code: "healthy", label: "元気" },
  { code: "new_growth", label: "新芽・新しい成長あり" },
  { code: "leaf_discoloration", label: "葉の変色" },
  { code: "wilting", label: "しおれている" },
  { code: "pest_damage", label: "害虫の被害" },
  { code: "disease_sign", label: "病気の兆候" },
  { code: "other", label: "その他" },
] as const;

const workOptions = [
  { code: "watering", label: "水やり" },
  { code: "fertilizing", label: "肥料" },
  { code: "pruning", label: "剪定" },
  { code: "repotting", label: "植え替え" },
  { code: "pest_control", label: "害虫対策" },
  { code: "observation", label: "観察のみ" },
  { code: "other", label: "その他" },
] as const;

type PlantConditionCode = (typeof conditionOptions)[number]["code"];
type WorkTypeCode = (typeof workOptions)[number]["code"];

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

interface MyPlantCareRecordPageProps {
  isAuthInitializing: boolean;
  onBackToMyPlants: () => void;
  onLogin: () => void;
  userId?: string;
  userPlantId: string;
}

function MyPlantCareRecordPage({
  isAuthInitializing,
  onBackToMyPlants,
  onLogin,
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
  const headingRef = useRef<HTMLHeadingElement>(null);
  const today = getLocalDateValue();

  useEffect(() => {
    setUserPlant(null);
    setPlantLoadError("");
    setIsPlantUnavailable(false);
    setIsLoadingPlant(false);

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
  }, [userId, userPlantId]);

  useEffect(() => {
    if (userPlant) headingRef.current?.focus();
  }, [userPlant]);

  const clearFeedback = () => {
    setValidationError("");
    setSaveError("");
    setSuccessMessage("");
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
    if (isSaving) return;

    setValidationError("");
    setSaveError("");
    setSuccessMessage("");

    if (!userId) {
      setSaveError("記録を保存するにはログインが必要です。");
      return;
    }
    if (!userPlant || userPlant.userId !== userId || userPlant.id !== userPlantId) {
      setSaveError("対象の植物が見つからないか、このアカウントでは利用できません。");
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

    setIsSaving(true);
    try {
      await createPlantCareRecord({
        userPlantId: userPlant.id,
        userId,
        recordDate,
        plantCondition,
        conditionOther: plantCondition === "other" ? trimmedConditionOther : null,
        workTypes: uniqueWorkTypes,
        workOther: uniqueWorkTypes.includes("other") ? trimmedWorkOther : null,
        memo: trimmedMemo || null,
      });
      setRecordDate(getLocalDateValue());
      setPlantCondition("");
      setConditionOther("");
      setWorkTypes([]);
      setWorkOther("");
      setMemo("");
      setSuccessMessage("状態・作業記録を保存しました。");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "記録を保存できませんでした。時間をおいてもう一度お試しください。",
      );
    } finally {
      setIsSaving(false);
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
          <h1 id="plant-care-login-title">記録の保存にはログインが必要です</h1>
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
          <strong>対象の植物を確認しています</strong>
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
          <h1 id="plant-care-unavailable-title">記録する植物を確認できませんでした</h1>
          <p>
            {plantLoadError ||
              "対象の植物が見つからないか、このアカウントでは利用できません。"}
          </p>
        </section>
      </main>
    );
  }

  const plant = allPlants.find((item) => item.id === userPlant.plantId);
  const displayName = userPlant.nickname || "設定なし";

  return (
    <main className="app-main plant-care-page">
      <button className="plant-detail__back" type="button" onClick={onBackToMyPlants}>
        <span aria-hidden="true">←</span>
        自分の植物一覧へ戻る
      </button>

      <section className="intro plant-care-page__intro" aria-labelledby="plant-care-title">
        <div className="intro__copy">
          <span className="eyebrow">CARE RECORD</span>
          <h1 id="plant-care-title" ref={headingRef} tabIndex={-1}>
            状態・作業を記録する
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
          <span>NEW RECORD</span>
          <h2 id="plant-care-form-title">新しい記録</h2>
          <p>現在の状態と、行った作業を入力してください。</p>
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
              disabled={isSaving}
              required
            />
          </div>

          <fieldset className="plant-care-fieldset" disabled={isSaving}>
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
                disabled={isSaving}
                required
              />
              <small>{conditionOther.length}/200文字</small>
            </div>
          )}

          <fieldset className="plant-care-fieldset" disabled={isSaving}>
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
                disabled={isSaving}
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
              disabled={isSaving}
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
                <strong>保存に失敗しました</strong>
                <p>{saveError}</p>
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

          <button className="primary-button plant-care-submit" type="submit" disabled={isSaving}>
            {isSaving ? "保存中…" : "記録を保存する"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default MyPlantCareRecordPage;
