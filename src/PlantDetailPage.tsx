import type { ReactNode } from "react";
import type { Plant, PlantReviewStatus } from "./types/plant";

interface PlantDetailPageProps {
  plant: Plant;
  onBack: () => void;
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

function PlantDetailPage({ plant, onBack }: PlantDetailPageProps) {
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
    </main>
  );
}

export default PlantDetailPage;
