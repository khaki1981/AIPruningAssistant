import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import type {
  DiagnosisItem,
  PruningStrength,
  UploadedPhoto,
} from "./types";

const pruningOptions: PruningStrength[] = [
  "強剪定",
  "軽剪定",
  "形を揃えるだけ",
  "枯れ枝整理",
];

const diagnosis: DiagnosisItem[] = [
  {
    title: "現在の時期から見た剪定の可否",
    content:
      "樹種や開花時期によって適期が異なります。現段階では強剪定を避け、木の状態を確認しながら小さな整理から始めるのが安全です。",
  },
  {
    title: "おすすめの剪定方針",
    content:
      "全体の形を大きく変えるより、軽剪定で枝の混み合いを減らし、日当たりと風通しを良くする方針がおすすめです。",
  },
  {
    title: "優先して切る枝",
    content:
      "枯れ枝、傷んだ枝、幹の内側へ向かう枝、交差して擦れている枝を優先して整理してください。",
  },
  {
    title: "切らない方がよい枝",
    content:
      "樹形の骨格になる太い枝、葉や花芽が集中している健全な枝は、判断材料が増えるまで残してください。",
  },
  {
    title: "作業時の注意点",
    content:
      "一度に枝葉を落としすぎないようにし、高所や太い枝の作業は無理をせず専門家への依頼も検討してください。",
  },
  {
    title: "次に撮影するとよい写真",
    content:
      "木全体が分かる正面・側面、幹の根元、枝が混み合う部分、葉や芽のアップを明るい時間帯に撮影してください。",
  },
];

function App() {
  const [treeName, setTreeName] = useState("");
  const [strength, setStrength] = useState<PruningStrength>("軽剪定");
  const [concerns, setConcerns] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const diagnosisRef = useRef<HTMLElement>(null);
  const photosRef = useRef<UploadedPhoto[]>([]);

  useEffect(() => {
    return () =>
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
  }, []);

  photosRef.current = photos;

  const handlePhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const nextPhotos = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setPhotos((current) => [...current, ...nextPhotos]);
    event.target.value = "";
  };

  const removePhoto = (id: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((photo) => photo.id !== id);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowDiagnosis(true);
    window.setTimeout(
      () => diagnosisRef.current?.scrollIntoView({ behavior: "smooth" }),
      0,
    );
  };

  return (
    <main>
      <header className="hero">
        <div className="hero__content">
          <span className="eyebrow">AI Pruning Assistant</span>
          <h1>剪定AIアシスタント</h1>
          <p>
            木の写真と状況を入力して、安全な剪定方針を整理しましょう。
          </p>
        </div>
        <div className="hero__mark" aria-hidden="true">
          <span>♧</span>
        </div>
      </header>

      <div className="page-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="section-heading">
            <span>01</span>
            <div>
              <h2>木の状態を教えてください</h2>
              <p>分かる範囲の入力で構いません。</p>
            </div>
          </div>

          <div className="field">
            <div className="field__label-row">
              <label htmlFor="photos">木の写真</label>
              <span>複数選択できます</span>
            </div>
            <label className="upload-box" htmlFor="photos">
              <span className="upload-box__icon" aria-hidden="true">
                ＋
              </span>
              <strong>写真を追加する</strong>
              <small>JPEG・PNGなどの画像ファイル</small>
            </label>
            <input
              className="visually-hidden"
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotos}
            />

            {photos.length > 0 && (
              <div className="preview-grid" aria-label="選択した写真">
                {photos.map((photo) => (
                  <figure className="preview" key={photo.id}>
                    <img src={photo.url} alt={photo.name} />
                    <button
                      type="button"
                      aria-label={`${photo.name}を削除`}
                      onClick={() => removePhoto(photo.id)}
                    >
                      ×
                    </button>
                    <figcaption>{photo.name}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="treeName">樹木名</label>
            <input
              id="treeName"
              type="text"
              placeholder="例：松、梅、柿、桜、不明"
              value={treeName}
              onChange={(event) => setTreeName(event.target.value)}
            />
          </div>

          <fieldset className="field">
            <legend>剪定の強さ</legend>
            <div className="radio-grid">
              {pruningOptions.map((option) => (
                <label
                  className={`radio-card ${strength === option ? "is-selected" : ""}`}
                  key={option}
                >
                  <input
                    type="radio"
                    name="strength"
                    value={option}
                    checked={strength === option}
                    onChange={() => setStrength(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="concerns">気になる点</label>
            <textarea
              id="concerns"
              rows={5}
              placeholder="例：大きくなりすぎた、隣家に枝が伸びている、どこを切ればよいか分からない"
              value={concerns}
              onChange={(event) => setConcerns(event.target.value)}
            />
          </div>

          <button className="diagnose-button" type="submit">
            <span aria-hidden="true">✦</span>
            AIで診断する
          </button>
          <p className="form-note">
            現在はデモ版です。入力内容や写真は外部へ送信されません。
          </p>
        </form>

        <aside className="guide-card">
          <span className="guide-card__label">撮影のヒント</span>
          <h2>判断しやすい写真</h2>
          <ol>
            <li>
              <span>1</span>
              <p>
                <strong>木全体</strong>が収まる写真
              </p>
            </li>
            <li>
              <span>2</span>
              <p>
                正面とは別の<strong>角度から</strong>撮った写真
              </p>
            </li>
            <li>
              <span>3</span>
              <p>
                混み合いや傷みなど<strong>気になる部分</strong>のアップ
              </p>
            </li>
          </ol>
          <p className="guide-card__caution">
            剪定の適期は樹種や地域で異なります。最終的な作業判断は木の状態を直接確認して行ってください。
          </p>
        </aside>
      </div>

      {showDiagnosis && (
        <section className="result card" ref={diagnosisRef}>
          <div className="result__header">
            <div>
              <span className="eyebrow">Sample diagnosis</span>
              <h2>診断結果</h2>
            </div>
            <span className="result__badge">ダミー診断</span>
          </div>

          <div className="result__summary">
            <strong>{treeName.trim() || "樹種不明"}の剪定方針</strong>
            <p>
              ご希望の「{strength}」を前提にした参考結果です。
              {concerns.trim() &&
                ` 特に「${concerns.trim()}」について確認が必要です。`}
            </p>
          </div>

          <div className="diagnosis-list">
            {diagnosis.map((item, index) => (
              <article key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer>
        <span>AI Pruning Assistant</span>
        <p>安全に配慮し、無理のない範囲で作業してください。</p>
      </footer>
    </main>
  );
}

export default App;
