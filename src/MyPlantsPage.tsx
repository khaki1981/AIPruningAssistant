import { useEffect, useMemo, useState } from "react";
import { listUserPlants } from "./data/userPlants";
import { loadPlants } from "./data/loadPlants";
import type { UserPlant } from "./types/userPlant";

const visiblePlants = loadPlants();

interface MyPlantsPageProps {
  isAuthInitializing: boolean;
  onBackHome: () => void;
  onCreateRecord: (userPlantId: string) => void;
  onLogin: () => void;
  onViewHistory: (userPlantId: string) => void;
  onViewDetails: (plantId: string) => void;
  onViewGuidance: (plantId: string) => void;
  userId?: string;
}

function MyPlantsPage({
  isAuthInitializing,
  onBackHome,
  onCreateRecord,
  onLogin,
  onViewHistory,
  onViewDetails,
  onViewGuidance,
  userId,
}: MyPlantsPageProps) {
  const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const plantsById = useMemo(
    () => new Map(visiblePlants.map((plant) => [plant.id, plant])),
    [],
  );

  useEffect(() => {
    if (!userId) {
      setUserPlants([]);
      setErrorMessage("");
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage("");

    void listUserPlants()
      .then((items) => {
        if (isCurrent) setUserPlants(items);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "自分の植物を読み込めませんでした。",
        );
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  if (isAuthInitializing) {
    return (
      <main className="app-main my-plants-page">
        <div className="loading-state my-plants-state" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          <strong>ログイン状態を確認しています</strong>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="app-main my-plants-page">
        <button className="plant-detail__back" type="button" onClick={onBackHome}>
          <span aria-hidden="true">←</span>
          ホームへ戻る
        </button>
        <section className="section-card my-plants-login" aria-labelledby="my-plants-login-title">
          <p className="eyebrow">MY PLANTS</p>
          <h1 id="my-plants-login-title">自分の植物を見るにはログインが必要です</h1>
          <p>ログインすると、登録した植物を端末を変えても確認できます。</p>
          <button className="primary-button" type="button" onClick={onLogin}>
            ログイン・新規登録へ
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-main my-plants-page">
      <button className="plant-detail__back" type="button" onClick={onBackHome}>
        <span aria-hidden="true">←</span>
        ホームへ戻る
      </button>

      <section className="intro my-plants-page__intro" aria-labelledby="my-plants-title">
        <div className="intro__copy">
          <span className="eyebrow">MY PLANTS</span>
          <h1 id="my-plants-title">自分の植物</h1>
          <p>登録した植物から、詳しい情報や現在の剪定案内を確認できます。</p>
        </div>
      </section>

      <section className="section-card my-plants-list" aria-labelledby="my-plants-list-title">
        <div className="section-card__heading">
          <span>PLANT CARTE</span>
          <h2 id="my-plants-list-title">登録した植物</h2>
          {!isLoading && !errorMessage && <p>{userPlants.length}件登録されています。</p>}
        </div>

        {isLoading ? (
          <div className="loading-state my-plants-state" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <strong>登録内容を読み込んでいます</strong>
          </div>
        ) : errorMessage ? (
          <div className="alert-box alert-box--error" role="alert">
            <div>
              <strong>読み込みに失敗しました</strong>
              <p>{errorMessage}</p>
            </div>
          </div>
        ) : userPlants.length === 0 ? (
          <div className="empty-state my-plants-state">
            <strong>自分の植物はまだ登録されていません</strong>
            <p>植物の詳細画面から「自分の植物として登録」を選んでください。</p>
          </div>
        ) : (
          <div className="my-plant-grid">
            {userPlants.map((userPlant) => {
              const plant = plantsById.get(userPlant.plantId);
              const displayName = userPlant.nickname || plant?.nameJa || "現在表示できない植物";
              return (
                <article className="my-plant-card" key={userPlant.id}>
                  <div>
                    <p className="my-plant-card__species">
                      {plant ? plant.nameJa : "植物情報は現在非公開です"}
                    </p>
                    <h3>{displayName}</h3>
                    <p className="my-plant-card__date">
                      登録日：{new Intl.DateTimeFormat("ja-JP").format(new Date(userPlant.createdAt))}
                    </p>
                  </div>
                  <div className="my-plant-card__actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => onCreateRecord(userPlant.id)}
                    >
                      状態・作業を記録する
                    </button>
                    <button type="button" onClick={() => onViewHistory(userPlant.id)}>
                      過去の記録を見る
                    </button>
                    {plant && (
                      <>
                        <button type="button" onClick={() => onViewDetails(plant.id)}>
                          植物詳細を見る
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewGuidance(plant.id)}
                        >
                          現在の剪定案内
                        </button>
                      </>
                    )}
                  </div>
                  {!plant && (
                    <p className="my-plant-card__unavailable">
                      公開条件を満たしていないため、詳細と剪定案内は表示できません。
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default MyPlantsPage;

