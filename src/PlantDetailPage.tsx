import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createUserPlant } from "./data/userPlants";
import type { Plant, PlantReviewStatus } from "./types/plant";

interface PlantDetailPageProps {
  isAuthInitializing: boolean;
  onLogin: () => void;
  plant: Plant;
  onBack: () => void;
  onConfirm: () => void;
  userId?: string;
}

function hasText(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function joinValues(values: Array<string | undefined>) {
  const visibleValues = values.filter(hasText);
  return visibleValues.length > 0 ? visibleValues.join(" / ") : undefined;
}

function getReviewStatus(status: PlantReviewStatus) {
  switch (status) {
    case "verified":
      return { label: "確認済み", className: "status-badge--success" };
    case "reviewed":
      return { label: "レビュー済み", className: "status-badge--loading" };
    case "draft":
      return { label: "確認中", className: "status-badge--idle" };
  }
}

function DetailSection({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="section-card plant-detail__section">
      <div className="section-card__heading">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DetailTerm({ label, value }: { label: string; value?: string }) {
  if (!hasText(value)) return null;

  return (
    <div className="plant-detail__term">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function TextList({ items }: { items: string[] }) {
  const visibleItems = items.filter(hasText);
  if (visibleItems.length === 0) return null;

  return (
    <ul className="plant-detail__list">
      {visibleItems.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function CalendarRow({ label, months }: { label: string; months: number[] }) {
  if (months.length === 0) return null;

  return (
    <div className="plant-calendar__row" aria-label={`${label}：${months.join("月、")}月`}>
      <dt>{label}</dt>
      <dd>
        {months.map((month) => (
          <span className="plant-calendar__month" key={month}>
            {month}月
          </span>
        ))}
      </dd>
    </div>
  );
}

function PlantDetailPage({
  isAuthInitializing,
  onLogin,
  plant,
  onBack,
  onConfirm,
  userId,
}: PlantDetailPageProps) {
  const [nickname, setNickname] = useState("");
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [showLoginNotice, setShowLoginNotice] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const status = getReviewStatus(plant.reviewStatus);
  const aliases = plant.aliases.filter(hasText);
  const basicNotes = plant.basicData.notes.filter(hasText);
  const pruningTiming = plant.pruning.timing.filter(hasText);
  const pruningWarnings = plant.pruning.warnings.filter(hasText);
  const family = joinValues([
    plant.classification.familyJa,
    plant.classification.familyScientific,
  ]);
  const genus = joinValues([
    plant.classification.genusJa,
    plant.classification.genusScientific,
  ]);
  const hasClassification = [
    plant.classification.category,
    family,
    genus,
    plant.classification.cultivar,
  ].some(hasText);
  const hasBasicData = [
    plant.basicData.growthHabit,
    plant.basicData.height,
    plant.basicData.spread,
    plant.basicData.deciduousEvergreen,
  ].some(hasText);
  const hasCalendar = Object.values(plant.calendar).some((months) => months.length > 0);
  const flowerBudType = hasText(plant.pruning.flowerBudType)
    ? plant.pruning.flowerBudType === "unknown"
      ? "未確認"
      : plant.pruning.flowerBudType
    : undefined;

  useEffect(() => {
    setNickname("");
    setRegistrationMessage("");
    setRegistrationError("");
    setShowLoginNotice(false);
    setIsRegistering(false);
  }, [plant.id]);

  const handleRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegistrationMessage("");
    setRegistrationError("");

    if (!userId) {
      setShowLoginNotice(true);
      return;
    }

    setIsRegistering(true);
    try {
      const registered = await createUserPlant({
        userId,
        plantId: plant.id,
        nickname,
      });
      setRegistrationMessage(
        `「${registered.nickname || plant.nameJa}」を自分の植物として登録しました。`,
      );
      setNickname("");
    } catch (error) {
      setRegistrationError(
        error instanceof Error ? error.message : "登録に失敗しました。",
      );
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <main className="app-main plant-directory plant-detail">
      <button className="plant-detail__back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span>
        植物一覧へ戻る
      </button>

      <section className="intro plant-detail__intro" aria-labelledby="plant-detail-title">
        <div className="intro__copy">
          <span className="eyebrow">PLANT DETAIL</span>
          <div className="plant-detail__title-row">
            <h1 id="plant-detail-title">{plant.nameJa}</h1>
            <span className={`status-badge ${status.className}`}>{status.label}</span>
          </div>
          {aliases.length > 0 && (
            <p className="plant-detail__aliases">別名：{aliases.join("、")}</p>
          )}
          {hasText(plant.scientificName) && (
            <p className="plant-detail__scientific">{plant.scientificName}</p>
          )}
        </div>
      </section>

      <div className="plant-detail__content">
        {(hasClassification || hasBasicData || basicNotes.length > 0) && (
          <DetailSection eyebrow="PROFILE" title="分類と基本情報">
            {(hasClassification || hasBasicData) && (
              <dl className="plant-detail__terms">
                <DetailTerm label="分類" value={plant.classification.category} />
                <DetailTerm label="科" value={family} />
                <DetailTerm label="属" value={genus} />
                <DetailTerm label="品種" value={plant.classification.cultivar} />
                <DetailTerm label="落葉・常緑" value={plant.basicData.deciduousEvergreen} />
                <DetailTerm label="樹高" value={plant.basicData.height} />
                <DetailTerm label="枝張り" value={plant.basicData.spread} />
                <DetailTerm label="生育の特徴" value={plant.basicData.growthHabit} />
              </dl>
            )}
            {basicNotes.length > 0 && (
              <div className="plant-detail__subsection">
                <h3>特徴・補足</h3>
                <TextList items={basicNotes} />
              </div>
            )}
          </DetailSection>
        )}

        {hasCalendar && (
          <DetailSection eyebrow="CALENDAR" title="時期の目安">
            <dl className="plant-calendar">
              <CalendarRow label="剪定期" months={plant.calendar.pruningMonths} />
              <CalendarRow label="花芽形成期" months={plant.calendar.flowerBudFormationMonths} />
              <CalendarRow label="開花期" months={plant.calendar.floweringMonths} />
              <CalendarRow label="結実・収穫期" months={plant.calendar.harvestMonths} />
              <CalendarRow label="植え付け期" months={plant.calendar.plantingMonths} />
            </dl>
          </DetailSection>
        )}

        <DetailSection eyebrow="PRUNING" title="剪定情報">
          {(hasText(plant.pruning.difficulty) || flowerBudType) && (
            <dl className="plant-detail__terms plant-detail__terms--compact">
              <DetailTerm label="剪定の難易度" value={plant.pruning.difficulty} />
              <DetailTerm label="花芽タイプ" value={flowerBudType} />
            </dl>
          )}

          {hasText(plant.pruning.summary) && (
            <div className="plant-detail__subsection">
              <h3>剪定の概要</h3>
              <p>{plant.pruning.summary}</p>
            </div>
          )}

          {pruningTiming.length > 0 && (
            <div className="plant-detail__subsection">
              <h3>剪定時期</h3>
              <TextList items={pruningTiming} />
            </div>
          )}

          {plant.pruning.methods.length > 0 && (
            <div className="plant-detail__subsection">
              <h3>剪定方法</h3>
              <div className="pruning-methods">
                {plant.pruning.methods.map((method, index) => (
                  <article className="pruning-method" key={`${method.name}-${index}`}>
                    <h4>{method.name}</h4>
                    {hasText(method.description) && <p>{method.description}</p>}
                    {hasText(method.conditions) && (
                      <p className="pruning-method__conditions">
                        <strong>対象・条件：</strong>{method.conditions}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {pruningWarnings.length > 0 && (
            <aside className="plant-detail__warning" aria-labelledby="pruning-warnings-title">
              <h3 id="pruning-warnings-title">注意事項</h3>
              <TextList items={pruningWarnings} />
            </aside>
          )}
        </DetailSection>

        {plant.sources.length > 0 && (
          <DetailSection eyebrow="SOURCES" title="出典">
            <ol className="plant-sources">
              {plant.sources.map((source, index) => (
                <li key={`${source.sourceId}-${source.page}-${index}`}>
                  <p className="plant-sources__label">
                    {source.sourceId}・{source.page}ページ
                  </p>
                  {hasText(source.note) && <p>{source.note}</p>}
                </li>
              ))}
            </ol>
          </DetailSection>
        )}
      </div>

      <section className="plant-confirm-action" aria-labelledby="plant-confirm-action-title">
        <div>
          <span className="eyebrow">CONFIRM PLANT</span>
          <h2 id="plant-confirm-action-title">剪定する植物を決める</h2>
          <p>詳細を確認し、この植物を剪定対象として使用する場合は確定してください。</p>
        </div>
        <button className="primary-button plant-confirm-action__button" type="button" onClick={onConfirm}>
          この植物で確認する
          <span aria-hidden="true">→</span>
        </button>
      </section>

      <section className="section-card plant-registration" aria-labelledby="plant-registration-title">
        <div className="section-card__heading">
          <span>MY PLANT</span>
          <h2 id="plant-registration-title">自分の植物として登録</h2>
          <p>
            同じ樹種を複数登録できます。呼び名を空欄にすると「{plant.nameJa}」と表示します。
          </p>
        </div>

        <form className="plant-registration__form" onSubmit={(event) => void handleRegistration(event)}>
          {userId && (
            <div className="field">
              <label htmlFor={`plant-nickname-${plant.id}`}>呼び名（任意）</label>
              <input
                id={`plant-nickname-${plant.id}`}
                type="text"
                maxLength={100}
                placeholder={`例：玄関の${plant.nameJa}`}
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                disabled={isRegistering}
              />
              <small>{nickname.length}/100文字</small>
            </div>
          )}

          <button
            className="primary-button plant-registration__button"
            type="submit"
            disabled={isAuthInitializing || isRegistering}
          >
            {isAuthInitializing
              ? "ログイン状態を確認中…"
              : isRegistering
                ? "登録中…"
                : "自分の植物として登録"}
          </button>
        </form>

        {showLoginNotice && !userId && (
          <div className="plant-registration__notice" role="note">
            <strong>登録にはログインが必要です</strong>
            <p>ログインまたは新規登録後に、もう一度この植物を登録してください。</p>
            <button type="button" onClick={onLogin}>ログイン・新規登録へ</button>
          </div>
        )}
        {registrationMessage && (
          <p className="plant-registration__feedback plant-registration__feedback--success" role="status">
            {registrationMessage}
          </p>
        )}
        {registrationError && (
          <p className="plant-registration__feedback plant-registration__feedback--error" role="alert">
            {registrationError}
          </p>
        )}
      </section>
    </main>
  );
}

export default PlantDetailPage;
