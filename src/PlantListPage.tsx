import { useEffect, useMemo, useRef } from "react";
import CurrentPruningGuidancePage from "./CurrentPruningGuidancePage";
import PlantConfirmationPage from "./PlantConfirmationPage";
import PlantDetailPage from "./PlantDetailPage";
import { loadPlants } from "./data/loadPlants";
import type { PlantReviewStatus } from "./types/plant";

const plants = loadPlants();

function normalizeSearchText(value: string) {
  return value
    .trim()
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .replace(/[ぁ-ゖ]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) + 0x60),
    );
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

interface PlantListPageProps {
  confirmedPlantId?: string;
  isAuthInitializing: boolean;
  isConfirmation: boolean;
  isGuidance: boolean;
  onBackHome: () => void;
  onBackToConfirmation: () => void;
  onBackToList: () => void;
  onChooseAgain: () => void;
  onConfirmPlant: (plantId: string) => void;
  onLogin: () => void;
  onViewGuidance: () => void;
  onQueryChange: (query: string) => void;
  onSelectPlant: (plantId: string) => void;
  query: string;
  selectedPlantId?: string;
  userId?: string;
}

function PlantListPage({
  confirmedPlantId,
  isAuthInitializing,
  isConfirmation,
  isGuidance,
  onBackHome,
  onBackToConfirmation,
  onBackToList,
  onChooseAgain,
  onConfirmPlant,
  onLogin,
  onViewGuidance,
  onQueryChange,
  onSelectPlant,
  query,
  selectedPlantId,
  userId,
}: PlantListPageProps) {
  const listScrollPosition = useRef(0);
  const previousPlantId = useRef<string>();
  const normalizedQuery = normalizeSearchText(query);
  const filteredPlants = useMemo(() => {
    if (!normalizedQuery) return plants;

    return plants.filter((plant) =>
      [plant.nameJa, ...plant.aliases, plant.scientificName ?? ""].some((value) =>
        normalizeSearchText(value).includes(normalizedQuery),
      ),
    );
  }, [normalizedQuery]);

  const selectedPlant = plants.find((plant) => plant.id === selectedPlantId);
  const confirmedPlant = plants.find((plant) => plant.id === confirmedPlantId);

  useEffect(() => {
    if (isConfirmation || isGuidance) return;

    if (selectedPlant) {
      previousPlantId.current = selectedPlant.id;
      window.scrollTo({ top: 0 });
      return;
    }

    const plantId = previousPlantId.current;
    if (!plantId) return;

    previousPlantId.current = undefined;
    window.requestAnimationFrame(() => {
      document
        .getElementById(`plant-detail-button-${plantId}`)
        ?.focus({ preventScroll: true });
      window.scrollTo({ top: listScrollPosition.current });
    });
  }, [isConfirmation, isGuidance, selectedPlant]);

  const openPlantDetail = (plantId: string) => {
    listScrollPosition.current = window.scrollY;
    onSelectPlant(plantId);
  };

  const returnToList = () => {
    onBackToList();
  };

  if (isGuidance && confirmedPlant) {
    return (
      <CurrentPruningGuidancePage
        plant={confirmedPlant}
        onBack={onBackToConfirmation}
        onChooseAgain={onChooseAgain}
      />
    );
  }

  if (isConfirmation && confirmedPlant) {
    return (
      <PlantConfirmationPage
        plant={confirmedPlant}
        onChooseAgain={onChooseAgain}
        onViewGuidance={onViewGuidance}
      />
    );
  }

  if (selectedPlant) {
    return (
      <PlantDetailPage
        isAuthInitializing={isAuthInitializing}
        plant={selectedPlant}
        onBack={returnToList}
        onConfirm={() => onConfirmPlant(selectedPlant.id)}
        onLogin={onLogin}
        userId={userId}
      />
    );
  }

  return (
    <main className="app-main plant-directory">
      <button className="plant-detail__back" type="button" onClick={onBackHome}>
        <span aria-hidden="true">←</span>
        ホームへ戻る
      </button>

      <section className="intro plant-directory__intro">
        <div className="intro__copy">
          <span className="eyebrow">PLANT DIRECTORY</span>
          <h1>植物を調べる</h1>
          <p>植物名や別名から、登録されている庭木を探せます。</p>
        </div>
      </section>

      <section className="section-card plant-list-section" aria-labelledby="plant-list-title">
        <div className="section-card__heading">
          <span>PLANT LIST</span>
          <h2 id="plant-list-title">植物一覧</h2>
          <p>データベースに登録されている植物を名前順で表示しています。</p>
        </div>

        <div className="field plant-search">
          <label htmlFor="plant-search">植物名を検索</label>
          <input
            id="plant-search"
            type="search"
            placeholder="例：ウメ、梅、Hydrangea"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>

        <div className="plant-list-summary" aria-live="polite">
          {normalizedQuery
            ? `${filteredPlants.length}件見つかりました`
            : `${filteredPlants.length}件の植物`}
        </div>

        {filteredPlants.length > 0 ? (
          <div className="plant-grid">
            {filteredPlants.map((plant) => {
              const status = getReviewStatus(plant.reviewStatus);
              return (
                <article className="plant-card" key={plant.id}>
                  <div className="plant-card__heading">
                    <h3>{plant.nameJa}</h3>
                    <span className={`status-badge ${status.className}`}>{status.label}</span>
                  </div>
                  {plant.aliases.length > 0 && (
                    <p className="plant-card__aliases">別名：{plant.aliases.join("、")}</p>
                  )}
                  {plant.scientificName && (
                    <p className="plant-card__scientific">{plant.scientificName}</p>
                  )}
                  <button
                    className="plant-card__action"
                    id={`plant-detail-button-${plant.id}`}
                    type="button"
                    aria-label={`${plant.nameJa}の詳しい情報を見る`}
                    onClick={() => openPlantDetail(plant.id)}
                  >
                    詳しく見る
                    <span aria-hidden="true">→</span>
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state plant-list-empty">
            <strong>
              {normalizedQuery
                ? "該当する植物が見つかりません"
                : "公開できる植物情報は準備中です"}
            </strong>
            <p>
              {normalizedQuery
                ? "検索する名前を変えてお試しください。"
                : "確認済みの植物情報が追加されるまでお待ちください。"}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export default PlantListPage;
