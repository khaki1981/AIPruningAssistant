import { useEffect, useRef } from "react";
import type { Plant } from "./types/plant";

interface PlantConfirmationPageProps {
  plant: Plant;
  onChooseAgain: () => void;
  onViewGuidance: () => void;
}

function PlantConfirmationPage({
  plant,
  onChooseAgain,
  onViewGuidance,
}: PlantConfirmationPageProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [plant.id]);

  return (
    <main className="app-main plant-confirmation">
      <section
        className="section-card plant-confirmation__card"
        aria-labelledby="plant-confirmation-title"
      >
        <span className="plant-confirmation__icon" aria-hidden="true">✓</span>
        <p className="eyebrow">PLANT CONFIRMED</p>
        <h1 id="plant-confirmation-title" ref={headingRef} tabIndex={-1}>
          植物を確定しました
        </h1>
        <p className="plant-confirmation__name">{plant.nameJa}</p>
        <p className="plant-confirmation__message">
          この植物を剪定対象として使用します。
        </p>
        <div className="plant-confirmation__actions">
          <button className="primary-button" type="button" onClick={onViewGuidance}>
            現在の剪定案内を見る
            <span aria-hidden="true">→</span>
          </button>
          <button
            className="plant-confirmation__choose-again"
            type="button"
            onClick={onChooseAgain}
          >
            <span aria-hidden="true">←</span>
            植物を選び直す
          </button>
        </div>
      </section>
    </main>
  );
}

export default PlantConfirmationPage;
