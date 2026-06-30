import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import type { PruningStrength, UploadedPhoto } from "./types";

const pruningOptions: PruningStrength[] = [
  "強剪定",
  "軽剪定",
  "形を整える程度",
  "枯れ枝の整理",
];

const requiredSections = [
  "現在の時期に剪定して良いか",
  "剪定の強さは適切か",
  "優先して切る枝",
  "残した方が良い枝",
  "注意点",
  "次に撮影した方が良い写真",
];

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const geminiModel = "gemini-2.5-flash";

function getCurrentDateForPrompt() {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("画像を読み込めませんでした。"));
        return;
      }
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    reader.readAsDataURL(file);
  });
}

function createPrompt(input: {
  treeName: string;
  strength: PruningStrength;
  concerns: string;
  currentDate: string;
  photoCount: number;
}) {
  return `あなたは庭木の剪定アドバイザーです。添付画像と入力情報をもとに、日本語で安全側に診断してください。

入力情報:
- 写真枚数: ${input.photoCount}枚
- 樹木名: ${input.treeName || "未入力"}
- 希望する剪定の強さ: ${input.strength}
- 気になる点: ${input.concerns || "未入力"}
- 現在日付: ${input.currentDate}

次の見出しをこの順番で必ず含めてください。
${requiredSections.map((section) => `## ${section}`).join("\n")}

注意:
- 画像だけで断定できないことは「写真からは断定できません」と明記してください。
- 強剪定や太枝の切除が危険な可能性がある場合は、理由と代替案を書いてください。
- 作業者の安全、病害虫、開花・結実への影響にも触れてください。
- 最後に免責ではなく、実作業で確認すべき具体的な観察点を書いてください。`;
}

async function requestGeminiDiagnosis(input: {
  photos: UploadedPhoto[];
  treeName: string;
  strength: PruningStrength;
  concerns: string;
  currentDate: string;
}) {
  if (!geminiApiKey) {
    throw new Error(
      "Gemini APIキーが設定されていません。Netlifyの環境変数 VITE_GEMINI_API_KEY を設定してください。",
    );
  }

  const imageParts = await Promise.all(
    input.photos.map(async (photo) => ({
      inline_data: {
        mime_type: photo.type || "image/jpeg",
        data: await fileToBase64(photo.file),
      },
    })),
  );

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: createPrompt({ ...input, photoCount: input.photos.length }) },
              ...imageParts,
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Gemini APIとの通信に失敗しました。時間をおいて再試行してください。${
        errorText ? ` (${response.status})` : ""
      }`,
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Geminiから診断結果を取得できませんでした。別の写真で再試行してください。");
  }

  return text;
}

function App() {
  const [treeName, setTreeName] = useState("");
  const [strength, setStrength] = useState<PruningStrength>("軽剪定");
  const [concerns, setConcerns] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const diagnosisRef = useRef<HTMLElement>(null);
  const photosRef = useRef<UploadedPhoto[]>([]);

  useEffect(() => {
    return () =>
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
  }, []);

  photosRef.current = photos;

  const handlePhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    const nextPhotos = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
      file,
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setDiagnosis("");

    if (photos.length === 0) {
      setErrorMessage("診断には写真が必要です。木の全体や気になる枝の写真を追加してください。");
      return;
    }

    setIsLoading(true);
    window.setTimeout(
      () => diagnosisRef.current?.scrollIntoView({ behavior: "smooth" }),
      0,
    );

    try {
      const result = await requestGeminiDiagnosis({
        photos,
        treeName: treeName.trim(),
        strength,
        concerns: concerns.trim(),
        currentDate: getCurrentDateForPrompt(),
      });
      setDiagnosis(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "診断中にエラーが発生しました。もう一度お試しください。",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <header className="hero">
        <div className="hero__content">
          <span className="eyebrow">AI Pruning Assistant</span>
          <h1>剪定AIアシスタント</h1>
          <p>
            庭木の写真と状態を入力して、今の時期に合った剪定方針を確認できます。
          </p>
        </div>
        <div className="hero__mark" aria-hidden="true">
          <span>枝</span>
        </div>
      </header>

      <div className="page-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="section-heading">
            <span>01</span>
            <div>
              <h2>木の状態を教えてください</h2>
              <p>写真と気になる点をもとに、Geminiが剪定診断を作成します。</p>
            </div>
          </div>

          <div className="field">
            <div className="field__label-row">
              <label htmlFor="photos">木の写真</label>
              <span>複数選択できます</span>
            </div>
            <label className="upload-box" htmlFor="photos">
              <span className="upload-box__icon" aria-hidden="true">
                +
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
                      x
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
              placeholder="例: モミジ、ウメ、ツバキ、サクラ、不明"
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
              placeholder="例: 大きくなりすぎた、隣家に枝が伸びている、枯れ枝がある、どこを切ればよいかわからない"
              value={concerns}
              onChange={(event) => setConcerns(event.target.value)}
            />
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <button className="diagnose-button" type="submit" disabled={isLoading}>
            <span aria-hidden="true">{isLoading ? "..." : "✓"}</span>
            {isLoading ? "診断中..." : "AIで診断する"}
          </button>
          <p className="form-note">
            入力内容と写真はGemini APIへ送信されます。実作業は木の状態を直接確認してから行ってください。
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
                混み合い、枯れ、病害虫など<strong>気になる部分</strong>のアップ
              </p>
            </li>
          </ol>
          <p className="guide-card__caution">
            剪定の適期は樹種や地域で異なります。最終的な作業判断は、木の状態を直接確認して行ってください。
          </p>
        </aside>
      </div>

      <section className="result card" ref={diagnosisRef} aria-live="polite">
        <div className="result__header">
          <div>
            <span className="eyebrow">Gemini diagnosis</span>
            <h2>診断結果</h2>
          </div>
          <span className="result__badge">
            {isLoading ? "診断中" : diagnosis ? "完了" : "未診断"}
          </span>
        </div>

        {isLoading && (
          <div className="loading-panel">
            <span className="loading-spinner" aria-hidden="true" />
            <p>写真と入力内容をGeminiへ送信し、剪定方針を作成しています。</p>
          </div>
        )}

        {!isLoading && !diagnosis && !errorMessage && (
          <div className="empty-result">
            <p>写真を追加して「AIで診断する」を押すと、ここに結果が表示されます。</p>
          </div>
        )}

        {!isLoading && diagnosis && (
          <>
            <div className="result__summary">
              <strong>{treeName.trim() || "樹種不明"}の剪定診断</strong>
              <p>
                {strength}を前提に、{getCurrentDateForPrompt()}時点の写真と入力内容から診断しました。
              </p>
            </div>
            <div className="diagnosis-text">{diagnosis}</div>
          </>
        )}
      </section>

      <footer>
        <span>AI Pruning Assistant</span>
        <p>安全に配慮し、無理のない範囲で作業してください。</p>
      </footer>
    </main>
  );
}

export default App;
