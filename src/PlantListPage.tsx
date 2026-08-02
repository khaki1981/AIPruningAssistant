import { useMemo, useState } from "react";
import { loadPlants } from "./data/loadPlants";

const plants = loadPlants();

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("ja-JP");
}

function PlantListPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSearchText(query);
  const filteredPlants = useMemo(() => {
    if (!normalizedQuery) return plants;

    return plants.filter((plant) =>
      [plant.nameJa, ...plant.aliases, plant.scientificName ?? ""].some((value) =>
        normalizeSearchText(value).includes(normalizedQuery),
      ),
    );
  }, [normalizedQuery]);

  return (
    <main className="app-main plant-directory">
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
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="plant-list-summary" aria-live="polite">
          {normalizedQuery
            ? `${filteredPlants.length}件見つかりました`
            : `${filteredPlants.length}件の植物`}
        </div>

        {filteredPlants.length > 0 ? (
          <div className="plant-grid">
            {filteredPlants.map((plant) => (
              <article className="plant-card" key={plant.id}>
                <div className="plant-card__heading">
                  <h3>{plant.nameJa}</h3>
                  {plant.reviewStatus === "draft" && (
                    <span className="status-badge status-badge--idle">確認中</span>
                  )}
                </div>
                {plant.aliases.length > 0 && (
                  <p className="plant-card__aliases">別名：{plant.aliases.join("、")}</p>
                )}
                {plant.scientificName && (
                  <p className="plant-card__scientific">{plant.scientificName}</p>
                )}
              </article>
            ))}
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
