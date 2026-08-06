import { useEffect, useMemo, useRef } from "react";
import { createCurrentPruningGuidance } from "./pruningGuidance";
import type { Plant, PlantReviewStatus } from "./types/plant";

interface CurrentPruningGuidancePageProps {
  currentMonth?: number;
  onBack: () => void;
  onChooseAgain: () => void;
  plant: Plant;
}

const unavailableMessage = "この植物については、現在表示できる情報がありません。";

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

function CurrentPruningGuidancePage({
  currentMonth = new Date().getMonth() + 1,
  onBack,
  onChooseAgain,
  plant,
}: CurrentPruningGuidancePageProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const guidance = useMemo(
    () => createCurrentPruningGuidance(plant, currentMonth),
    [currentMonth, plant],
  );
  const reviewStatus = getReviewStatus(plant.reviewStatus);

  useEffect(() => {
    headingRef.current?.focus();
  }, [plant.id, currentMonth]);

  return (
    <main className="app-main current-guidance">
      <button className="plant-detail__back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span>
        植物の確定画面へ戻る
      </button>

      <section className="intro current-guidance__intro" aria-labelledby="current-guidance-title">
        <div className="intro__copy">
          <span className="eyebrow">CURRENT PRUNING GUIDE</span>
          <div className="current-guidance__title-row">
            <h1 id="current-guidance-title" ref={headingRef} tabIndex={-1}>
              {plant.nameJa}・{guidance.monthLabel}の剪定案内
            </h1>
            <span className={`status-badge ${reviewStatus.className}`}>
              {reviewStatus.label}
            </span>
          </div>
          <p>植物データに登録されている情報だけを使って表示しています。</p>
        </div>
      </section>

      <section
        className={`current-guidance__decision current-guidance__decision--${guidance.status}`}
        aria-labelledby="current-guidance-decision-title"
      >
        <span className="current-guidance__decision-icon" aria-hidden="true">
          {guidance.status === "suitable"
            ? "✓"
            : guidance.status === "unknown"
              ? "?"
              : "!"}
        </span>
        <div>
          <p className="eyebrow">現在の判定</p>
          <h2 id="current-guidance-decision-title">{guidance.statusLabel}</h2>
          <p>{guidance.reason}</p>
          <dl className="current-guidance__facts">
            <div>
              <dt>現在</dt>
              <dd>{guidance.monthLabel}</dd>
            </div>
            <div>
              <dt>登録されている剪定時期</dt>
              <dd>{guidance.pruningPeriodLabel}</dd>
            </div>
          </dl>
          <div className="current-guidance__avoidance">
            <h3>剪定を避けるべき時期か</h3>
            <p>{guidance.avoidanceMessage}</p>
            {guidance.explicitAvoidanceNotes.length > 0 && (
              <ul>
                {guidance.explicitAvoidanceNotes.map((note, index) => (
                  <li key={`${note}-${index}`}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <div className="current-guidance__sections">
        <section className="section-card" aria-labelledby="registered-timing-title">
          <div className="section-card__heading">
            <span>REGISTERED TIMING</span>
            <h2 id="registered-timing-title">登録されている時期の説明</h2>
            <p>月内の詳しい範囲や条件は、植物データの記載をそのまま表示します。</p>
          </div>
          {guidance.timingNotes.length > 0 ? (
            <ul className="current-guidance__list">
              {guidance.timingNotes.map((note, index) => (
                <li key={`${note}-${index}`}>{note}</li>
              ))}
            </ul>
          ) : (
            <p className="current-guidance__unavailable">{unavailableMessage}</p>
          )}
        </section>

        <section className="section-card" aria-labelledby="flower-bud-guidance-title">
          <div className="section-card__heading">
            <span>FLOWER BUDS</span>
            <h2 id="flower-bud-guidance-title">花芽を切る危険性</h2>
          </div>
          <div className={`current-guidance__notice current-guidance__notice--${guidance.flowerBudStatus}`}>
            <strong>
              {guidance.flowerBudStatus === "caution"
                ? "花芽への注意"
                : guidance.flowerBudStatus === "unknown"
                  ? "情報がありません"
                  : "登録時期との比較"}
            </strong>
            <p>{guidance.flowerBudMessage}</p>
            {guidance.flowerBudPeriodLabel && (
              <p className="current-guidance__period">
                登録されている花芽形成時期：{guidance.flowerBudPeriodLabel}
              </p>
            )}
          </div>
        </section>

        <section className="section-card" aria-labelledby="pruning-method-guidance-title">
          <div className="section-card__heading">
            <span>HOW TO PRUNE</span>
            <h2 id="pruning-method-guidance-title">基本的な切り方</h2>
          </div>
          {guidance.pruningSummary && (
            <p className="current-guidance__summary">{guidance.pruningSummary}</p>
          )}
          {guidance.methods.length > 0 ? (
            <div className="pruning-methods current-guidance__methods">
              {guidance.methods.map((method, index) => (
                <article className="pruning-method" key={`${method.name}-${index}`}>
                  <h3>{method.name}</h3>
                  {method.description && <p>{method.description}</p>}
                  {method.conditions && (
                    <p className="pruning-method__conditions">
                      <strong>対象・条件：</strong>{method.conditions}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="current-guidance__unavailable">{unavailableMessage}</p>
          )}
        </section>

        <section className="section-card" aria-labelledby="pruning-guidance-warnings-title">
          <div className="section-card__heading">
            <span>CAUTIONS</span>
            <h2 id="pruning-guidance-warnings-title">注意事項</h2>
          </div>
          {guidance.warnings.length > 0 ? (
            <ul className="current-guidance__list current-guidance__list--warning">
              {guidance.warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          ) : (
            <p className="current-guidance__unavailable">{unavailableMessage}</p>
          )}
        </section>
      </div>

      <section className="current-guidance__actions" aria-label="剪定案内の次の操作">
        <button className="plant-confirmation__choose-again" type="button" onClick={onChooseAgain}>
          <span aria-hidden="true">←</span>
          植物を選び直す
        </button>
      </section>
    </main>
  );
}

export default CurrentPruningGuidancePage;
