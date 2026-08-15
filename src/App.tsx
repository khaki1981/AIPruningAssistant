import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import AuthPage from "./AuthPage";
import type { AuthMode } from "./AuthPage";
import MyPlantEditPage from "./MyPlantEditPage";
import MyPlantCareHistoryPage from "./MyPlantCareHistoryPage";
import MyPlantCareRecordPage from "./MyPlantCareRecordPage";
import MyPlantsPage from "./MyPlantsPage";
import PlantListPage from "./PlantListPage";
import { useAuth } from "./auth/AuthContext";
import type { PruningStrength, UploadedPhoto } from "./types";

const pruningOptions: PruningStrength[] = [
  "軽剪定",
  "形を整える程度",
  "枯れ枝の整理",
  "強剪定",
];

const pruningOptionDescriptions: Record<PruningStrength, string> = {
  軽剪定: "混み合った枝を少し減らし、風通しを整えます",
  形を整える程度: "自然な樹形を残しながら、伸びた枝を整えます",
  枯れ枝の整理: "枯れ・傷みが気になる枝を優先して確認します",
  強剪定: "大きさを抑える剪定です。樹種と時期に注意が必要です",
};

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

type IconName =
  | "camera"
  | "check"
  | "info"
  | "leaf"
  | "scissors"
  | "sparkles"
  | "trash"
  | "warning";

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    camera: (
      <>
        <path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z" />
        <circle cx="12" cy="13" r="3.5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 4c-7 0-12 3-12 9 0 3 2 5 5 5 6 0 7-7 7-14Z" />
        <path d="M4 20c3-5 7-8 13-11" />
      </>
    ),
    scissors: (
      <>
        <circle cx="6" cy="7" r="3" />
        <circle cx="6" cy="17" r="3" />
        <path d="m8.6 8.5 11 6.5M8.6 15.5 20 9M14 12l-3-2" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3z" />
        <path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8zM5 13l.7 1.8L7.5 15l-1.8.7L5 17.5l-.7-1.8L2.5 15l1.8-.7z" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
      </>
    ),
    warning: (
      <>
        <path d="M10.3 4.2 2.7 18a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[name]}
      </g>
    </svg>
  );
}

type AppView = "home" | "diagnosis" | "plants" | "my-plants" | "auth";

type AppRoute = {
  view: AppView;
  authMode?: AuthMode;
  careFromMyPlants?: boolean;
  careEdit?: boolean;
  careHistory?: boolean;
  careUpdated?: boolean;
  myPlantCompletion?: "deleted" | "updated";
  myPlantEdit?: boolean;
  myPlantEditFromMyPlants?: boolean;
  plantId?: string;
  plantConfirmation?: boolean;
  plantGuidance?: boolean;
  recordId?: string;
  userPlantId?: string;
};

const homeRoute: AppRoute = { view: "home" };

function readRoute(value: unknown): AppRoute {
  if (typeof value !== "object" || value === null) return homeRoute;

  const route = (value as { pruningAssistantRoute?: unknown }).pruningAssistantRoute;
  if (typeof route !== "object" || route === null) return homeRoute;

  const {
    authMode,
    careFromMyPlants,
    careEdit,
    careHistory,
    careUpdated,
    myPlantCompletion,
    myPlantEdit,
    myPlantEditFromMyPlants,
    plantConfirmation,
    plantGuidance,
    plantId,
    recordId,
    userPlantId,
    view,
  } = route as {
    authMode?: unknown;
    careFromMyPlants?: unknown;
    careEdit?: unknown;
    careHistory?: unknown;
    careUpdated?: unknown;
    myPlantCompletion?: unknown;
    myPlantEdit?: unknown;
    myPlantEditFromMyPlants?: unknown;
    plantConfirmation?: unknown;
    plantGuidance?: unknown;
    plantId?: unknown;
    recordId?: unknown;
    userPlantId?: unknown;
    view?: unknown;
  };
  if (
    view !== "home" &&
    view !== "plants" &&
    view !== "my-plants" &&
    view !== "diagnosis" &&
    view !== "auth"
  ) {
    return homeRoute;
  }

  return {
    view,
    authMode:
      view === "auth" && authMode === "sign-up" ? "sign-up" : undefined,
    careFromMyPlants:
      view === "my-plants" &&
      typeof userPlantId === "string" &&
      myPlantEdit !== true &&
      careFromMyPlants === true
        ? true
        : undefined,
    careHistory:
      view === "my-plants" &&
      typeof userPlantId === "string" &&
      myPlantEdit !== true &&
      careEdit !== true &&
      careHistory === true
        ? true
        : undefined,
    careEdit:
      view === "my-plants" &&
      typeof userPlantId === "string" &&
      myPlantEdit !== true &&
      careEdit === true
        ? true
        : undefined,
    careUpdated:
      view === "my-plants" && careHistory === true && careUpdated === true
        ? true
        : undefined,
    myPlantCompletion:
      view === "my-plants" &&
      (myPlantCompletion === "updated" || myPlantCompletion === "deleted")
        ? myPlantCompletion
        : undefined,
    myPlantEdit:
      view === "my-plants" &&
      typeof userPlantId === "string" &&
      myPlantEdit === true
        ? true
        : undefined,
    myPlantEditFromMyPlants:
      view === "my-plants" &&
      typeof userPlantId === "string" &&
      myPlantEdit === true &&
      myPlantEditFromMyPlants === true
        ? true
        : undefined,
    plantId: view === "plants" && typeof plantId === "string" ? plantId : undefined,
    plantConfirmation:
      view === "plants" &&
      typeof plantId === "string" &&
      plantConfirmation === true &&
      plantGuidance !== true
        ? true
        : undefined,
    plantGuidance:
      view === "plants" && typeof plantId === "string" && plantGuidance === true
        ? true
        : undefined,
    recordId:
      view === "my-plants" && careEdit === true && typeof recordId === "string"
        ? recordId
        : undefined,
    userPlantId:
      view === "my-plants" && typeof userPlantId === "string" && userPlantId.length > 0
        ? userPlantId
        : undefined,
  };
}

function readMyPlantsRouteFromLocation(): AppRoute | undefined {
  const parameters = new URLSearchParams(window.location.search);
  const userPlantId = parameters.get("userPlantId");
  const careView = parameters.get("view");
  if (
    !userPlantId ||
    (careView !== "plant-care" &&
      careView !== "plant-care-history" &&
      careView !== "plant-care-edit" &&
      careView !== "my-plant-edit")
  ) {
    return undefined;
  }
  return {
    view: "my-plants",
    careHistory: careView === "plant-care-history" ? true : undefined,
    careEdit: careView === "plant-care-edit" ? true : undefined,
    myPlantEdit: careView === "my-plant-edit" ? true : undefined,
    recordId: careView === "plant-care-edit" ? parameters.get("recordId") ?? "" : undefined,
    userPlantId,
  };
}

function getInitialRoute() {
  const storedRoute = readRoute(window.history.state);
  if (storedRoute.userPlantId) return storedRoute;
  return readMyPlantsRouteFromLocation() ?? homeRoute;
}

function getRouteUrl(route: AppRoute) {
  const url = new URL(window.location.href);
  url.searchParams.delete("view");
  url.searchParams.delete("userPlantId");
  url.searchParams.delete("recordId");
  if (route.view === "my-plants" && route.userPlantId) {
    url.searchParams.set(
      "view",
      route.myPlantEdit
        ? "my-plant-edit"
        : route.careEdit
        ? "plant-care-edit"
        : route.careHistory
          ? "plant-care-history"
          : "plant-care",
    );
    url.searchParams.set("userPlantId", route.userPlantId);
    if (route.careEdit && route.recordId) {
      url.searchParams.set("recordId", route.recordId);
    }
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

function AppHeader({
  activeView,
  email,
  isAuthInitializing,
  isAuthSubmitting,
  onNavigate,
  onSignOut,
}: {
  activeView: AppView;
  email?: string;
  isAuthInitializing: boolean;
  isAuthSubmitting: boolean;
  onNavigate: (view: AppView) => void;
  onSignOut: () => void;
}) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <button
          className="brand"
          type="button"
          aria-label="剪定AIアシスタント ホームへ"
          onClick={() => onNavigate("home")}
        >
          <span className="brand__mark">
            <Icon name="scissors" size={21} />
          </span>
          <span>剪定AIアシスタント</span>
        </button>
        <div className="app-header__actions">
          <nav className="view-navigation" aria-label="画面切り替え">
            <button
              className={activeView === "plants" ? "is-active" : ""}
              type="button"
              aria-current={activeView === "plants" ? "page" : undefined}
              onClick={() => onNavigate("plants")}
            >
              植物を調べる
            </button>
            {email && (
              <button
                className={activeView === "my-plants" ? "is-active" : ""}
                type="button"
                aria-current={activeView === "my-plants" ? "page" : undefined}
                onClick={() => onNavigate("my-plants")}
              >
                自分の植物
              </button>
            )}
            <button
              className={activeView === "diagnosis" ? "is-active" : ""}
              type="button"
              aria-current={activeView === "diagnosis" ? "page" : undefined}
              onClick={() => onNavigate("diagnosis")}
            >
              AI診断
            </button>
          </nav>
          <div className="account-navigation" aria-live="polite">
            {isAuthInitializing ? (
              <span className="account-navigation__status">ログイン確認中</span>
            ) : email ? (
              <>
                <span className="account-navigation__status" title={email}>
                  <span>ログイン中</span>
                  <strong>{email}</strong>
                </span>
                <button type="button" onClick={onSignOut} disabled={isAuthSubmitting}>
                  {isAuthSubmitting ? "処理中…" : "ログアウト"}
                </button>
              </>
            ) : (
              <button
                className={activeView === "auth" ? "is-active" : ""}
                type="button"
                aria-current={activeView === "auth" ? "page" : undefined}
                onClick={() => onNavigate("auth")}
              >
                ログイン・新規登録
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function HomePage({ onOpenPlants }: { onOpenPlants: () => void }) {
  return (
    <main className="app-main home-page">
      <section className="intro home-page__intro" aria-labelledby="home-title">
        <div className="intro__copy">
          <span className="eyebrow">PRUNING GUIDE</span>
          <h1 id="home-title">調べ方を選んでください</h1>
          <p>庭木に合った剪定情報を、分かる方法から探せます。</p>
        </div>
        <div className="intro__art" aria-hidden="true">
          <span className="intro__art-ring" />
          <Icon name="leaf" size={72} />
        </div>
      </section>

      <section className="home-options" aria-label="植物の調べ方">
        <button className="home-option" type="button" onClick={onOpenPlants}>
          <span className="home-option__icon"><Icon name="leaf" size={28} /></span>
          <span className="home-option__copy">
            <strong>植物名から選ぶ</strong>
            <span>植物名を検索して、剪定情報を確認します。</span>
          </span>
          <span className="home-option__arrow" aria-hidden="true">→</span>
        </button>

        <button
          className="home-option home-option--disabled"
          type="button"
          disabled
          aria-describedby="photo-search-description"
        >
          <span className="home-option__icon"><Icon name="camera" size={28} /></span>
          <span className="home-option__copy">
            <span className="home-option__title-row">
              <strong>写真から調べる</strong>
              <small>準備中</small>
            </span>
            <span id="photo-search-description">写真から植物の候補を調べます。現在は利用できません。</span>
          </span>
        </button>
      </section>
    </main>
  );
}

function SectionCard({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description?: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="section-card">
      <div className="section-card__heading">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}

function AlertBox({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "error" | "info" | "warning";
}) {
  return (
    <div className={`alert-box alert-box--${tone}`} role={tone === "error" ? "alert" : "note"}>
      <span className="alert-box__icon">
        <Icon name={tone === "warning" || tone === "error" ? "warning" : "info"} size={20} />
      </span>
      <div>{children}</div>
    </div>
  );
}

function UploadArea({
  onChange,
  onRemove,
  photos,
}: {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  photos: UploadedPhoto[];
}) {
  return (
    <div className="upload-area-wrap">
      <label className="upload-area" htmlFor="photos">
        <span className="upload-area__icon">
          <Icon name="camera" size={28} />
        </span>
        <strong>{photos.length > 0 ? "写真を追加・撮り直す" : "木の写真を選ぶ"}</strong>
        <span>カメラ撮影または写真ライブラリから選択</span>
        <small>JPEG・PNGなど／複数枚選択できます</small>
      </label>
      <input
        className="visually-hidden"
        id="photos"
        type="file"
        accept="image/*"
        multiple
        onChange={onChange}
      />

      {photos.length === 0 ? (
        <p className="upload-status">
          <Icon name="info" size={17} />
          まだ写真が選択されていません。診断には1枚以上必要です。
        </p>
      ) : (
        <>
          <div className="selected-photo-heading">
            <strong>分析に使う写真</strong>
            <span>{photos.length}枚選択中</span>
          </div>
          <div className="preview-grid" aria-label="選択した写真">
            {photos.map((photo, index) => (
              <figure className="preview" key={photo.id}>
                <img src={photo.url} alt={`分析用写真 ${index + 1}: ${photo.name}`} />
                <button
                  type="button"
                  aria-label={`${photo.name}を削除`}
                  onClick={() => onRemove(photo.id)}
                >
                  <Icon name="trash" size={18} />
                </button>
                <figcaption>{photo.name}</figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PruningOptionCard({
  checked,
  onChange,
  option,
}: {
  checked: boolean;
  onChange: () => void;
  option: PruningStrength;
}) {
  return (
    <label className={`pruning-option ${checked ? "is-selected" : ""}`}>
      <input
        type="radio"
        name="strength"
        value={option}
        checked={checked}
        onChange={onChange}
      />
      <span className="pruning-option__check" aria-hidden="true">
        {checked && <Icon name="check" size={17} />}
      </span>
      <span className="pruning-option__copy">
        <strong>{option}</strong>
        <small>{pruningOptionDescriptions[option]}</small>
      </span>
    </label>
  );
}

type DiagnosisSection = {
  title: string;
  lines: string[];
  items: string[];
};

function parseDiagnosis(text: string) {
  const sections: DiagnosisSection[] = [];
  let current: DiagnosisSection = { title: "診断の概要", lines: [], items: [] };

  const pushCurrent = () => {
    if (current.lines.length > 0 || current.items.length > 0) sections.push(current);
  };

  text.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      pushCurrent();
      current = { title: heading[1], lines: [], items: [] };
      return;
    }

    const item = line.match(/^(?:[-*・]|\d+[.)])\s*(.+)$/);
    if (item) {
      current.items.push(item[1]);
      return;
    }

    current.lines.push(line);
  });

  pushCurrent();
  return sections;
}

function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <div className="loading-state__visual" aria-hidden="true">
        <span className="loading-spinner" />
        <Icon name="sparkles" size={24} />
      </div>
      <div>
        <strong>写真を分析しています</strong>
        <p>木の状態と入力内容から、安全側の剪定方針を作成しています。</p>
      </div>
      <div className="loading-state__steps" aria-hidden="true">
        <span className="is-active" />
        <span />
        <span />
      </div>
    </div>
  );
}

function AnalysisResult({ diagnosis }: { diagnosis: string }) {
  const sections = parseDiagnosis(diagnosis);

  return (
    <div className="analysis-sections">
      {sections.map((section, index) => (
        <article className="analysis-section" key={`${section.title}-${index}`}>
          <span className="analysis-section__number">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>{section.title}</h3>
            {section.lines.map((line, lineIndex) => (
              <p key={`${line}-${lineIndex}`}>{line}</p>
            ))}
            {section.items.length > 0 && (
              <ul>
                {section.items.map((item, itemIndex) => (
                  <li key={`${item}-${itemIndex}`}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function App() {
  const {
    isInitializing: isAuthInitializing,
    isSubmitting: isAuthSubmitting,
    signOut,
    user,
  } = useAuth();
  const [route, setRoute] = useState<AppRoute>(() => getInitialRoute());
  const [plantQuery, setPlantQuery] = useState("");
  const [confirmedPlantId, setConfirmedPlantId] = useState<string>();
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

  useEffect(() => {
    const initialRoute = getInitialRoute();
    window.history.replaceState(
      { pruningAssistantRoute: initialRoute },
      "",
      getRouteUrl(initialRoute),
    );
    setRoute(initialRoute);

    const handlePopState = (event: PopStateEvent) => {
      const storedRoute = readRoute(event.state);
      const nextRoute = storedRoute.userPlantId
        ? storedRoute
        : readMyPlantsRouteFromLocation() ?? storedRoute;
      if (
        (nextRoute.plantConfirmation || nextRoute.plantGuidance) &&
        nextRoute.plantId
      ) {
        setConfirmedPlantId(nextRoute.plantId);
      }
      setRoute(nextRoute);
      window.scrollTo({ top: 0 });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextRoute: AppRoute) => {
    if (
      route.view === nextRoute.view &&
      route.authMode === nextRoute.authMode &&
      route.careFromMyPlants === nextRoute.careFromMyPlants &&
      route.careEdit === nextRoute.careEdit &&
      route.careHistory === nextRoute.careHistory &&
      route.careUpdated === nextRoute.careUpdated &&
      route.myPlantCompletion === nextRoute.myPlantCompletion &&
      route.myPlantEdit === nextRoute.myPlantEdit &&
      route.myPlantEditFromMyPlants === nextRoute.myPlantEditFromMyPlants &&
      route.plantId === nextRoute.plantId &&
      route.plantConfirmation === nextRoute.plantConfirmation &&
      route.plantGuidance === nextRoute.plantGuidance &&
      route.recordId === nextRoute.recordId &&
      route.userPlantId === nextRoute.userPlantId
    ) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.history.pushState(
      { pruningAssistantRoute: nextRoute },
      "",
      getRouteUrl(nextRoute),
    );
    setRoute(nextRoute);
    window.scrollTo({ top: 0 });
  };

  const consumeCareUpdated = () => {
    if (!route.careUpdated) return;

    const nextRoute = { ...route, careUpdated: undefined };
    window.history.replaceState(
      { pruningAssistantRoute: nextRoute },
      "",
      getRouteUrl(nextRoute),
    );
    setRoute(nextRoute);
  };

  const replaceRoute = (nextRoute: AppRoute) => {
    window.history.replaceState(
      { pruningAssistantRoute: nextRoute },
      "",
      getRouteUrl(nextRoute),
    );
    setRoute(nextRoute);
    window.scrollTo({ top: 0 });
  };

  const consumeMyPlantCompletion = () => {
    if (!route.myPlantCompletion) return;
    replaceRoute({ ...route, myPlantCompletion: undefined });
  };

  const navigateToView = (view: AppView) => navigate({ view });

  const resetTransientAppState = () => {
    photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
    setPhotos([]);
    setPlantQuery("");
    setConfirmedPlantId(undefined);
    setTreeName("");
    setStrength("軽剪定");
    setConcerns("");
    setDiagnosis("");
    setErrorMessage("");
    setIsLoading(false);
  };

  const finishAuthentication = () => {
    resetTransientAppState();
    navigate(homeRoute);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      resetTransientAppState();
      navigate(homeRoute);
    } catch {
      navigate({ view: "auth" });
    }
  };

  const confirmPlant = (plantId: string) => {
    setConfirmedPlantId(plantId);
    navigate({ view: "plants", plantId, plantConfirmation: true });
  };

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

  const resultStatus = isLoading
    ? "分析中"
    : diagnosis
      ? "分析完了"
      : errorMessage
        ? "要確認"
        : "未分析";

  return (
    <div className="app-shell" id="top">
      <AppHeader
        activeView={route.view}
        email={user?.email}
        isAuthInitializing={isAuthInitializing}
        isAuthSubmitting={isAuthSubmitting}
        onNavigate={navigateToView}
        onSignOut={() => void handleSignOut()}
      />

      {route.view === "home" ? (
        <HomePage onOpenPlants={() => navigateToView("plants")} />
      ) : route.view === "auth" ? (
        <AuthPage
          mode={route.authMode ?? "sign-in"}
          onAuthenticated={finishAuthentication}
          onBackHome={() => navigateToView("home")}
          onModeChange={(authMode) => navigate({ view: "auth", authMode })}
        />
      ) : route.view === "my-plants" ? (
        route.userPlantId ? (
          route.myPlantEdit ? (
            <MyPlantEditPage
              isAuthInitializing={isAuthInitializing}
              onBackToMyPlants={() => {
                if (route.myPlantEditFromMyPlants) {
                  window.history.back();
                  return;
                }
                navigate({ view: "my-plants" });
              }}
              onDeleted={() =>
                replaceRoute({ view: "my-plants", myPlantCompletion: "deleted" })
              }
              onLogin={() => navigate({ view: "auth" })}
              onUpdated={() =>
                replaceRoute({ view: "my-plants", myPlantCompletion: "updated" })
              }
              userId={user?.id}
              userPlantId={route.userPlantId}
            />
          ) : route.careEdit ? (
            <MyPlantCareRecordPage
              isAuthInitializing={isAuthInitializing}
              onBackToMyPlants={() =>
                navigate({
                  view: "my-plants",
                  userPlantId: route.userPlantId,
                  careHistory: true,
                })
              }
              onLogin={() => navigate({ view: "auth" })}
              onUpdated={(userPlantId) =>
                navigate({
                  view: "my-plants",
                  userPlantId,
                  careHistory: true,
                  careUpdated: true,
                })
              }
              recordId={route.recordId ?? ""}
              userId={user?.id}
              userPlantId={route.userPlantId}
            />
          ) : route.careHistory ? (
            <MyPlantCareHistoryPage
              isAuthInitializing={isAuthInitializing}
              onBackToMyPlants={() => {
                if (route.careFromMyPlants) {
                  window.history.back();
                  return;
                }
                navigate({ view: "my-plants" });
              }}
              onCreateRecord={(userPlantId) =>
                navigate({ view: "my-plants", userPlantId })
              }
              onEditRecord={(userPlantId, recordId) =>
                navigate({
                  view: "my-plants",
                  userPlantId,
                  careEdit: true,
                  recordId,
                })
              }
              onLogin={() => navigate({ view: "auth" })}
              onUpdatedMessageConsumed={consumeCareUpdated}
              updatedMessage={route.careUpdated}
              userId={user?.id}
              userPlantId={route.userPlantId}
            />
          ) : (
            <MyPlantCareRecordPage
              isAuthInitializing={isAuthInitializing}
              onBackToMyPlants={() => {
                if (route.careFromMyPlants) {
                  window.history.back();
                  return;
                }
                navigate({ view: "my-plants" });
              }}
              onLogin={() => navigate({ view: "auth" })}
              userId={user?.id}
              userPlantId={route.userPlantId}
            />
          )
        ) : (
          <MyPlantsPage
            completionMessage={route.myPlantCompletion}
            isAuthInitializing={isAuthInitializing}
            onBackHome={() => navigateToView("home")}
            onCompletionMessageConsumed={consumeMyPlantCompletion}
            onCreateRecord={(userPlantId) =>
              navigate({ view: "my-plants", userPlantId, careFromMyPlants: true })
            }
            onEditPlant={(userPlantId) =>
              navigate({
                view: "my-plants",
                userPlantId,
                myPlantEdit: true,
                myPlantEditFromMyPlants: true,
              })
            }
            onViewHistory={(userPlantId) =>
              navigate({
                view: "my-plants",
                userPlantId,
                careFromMyPlants: true,
                careHistory: true,
              })
            }
            onLogin={() => navigate({ view: "auth" })}
            onViewDetails={(plantId) => navigate({ view: "plants", plantId })}
            onViewGuidance={(plantId) => {
              setConfirmedPlantId(plantId);
              navigate({ view: "plants", plantId, plantGuidance: true });
            }}
            userId={user?.id}
          />
        )
      ) : route.view === "plants" ? (
        <PlantListPage
          confirmedPlantId={confirmedPlantId}
          isAuthInitializing={isAuthInitializing}
          isConfirmation={route.plantConfirmation === true}
          isGuidance={route.plantGuidance === true}
          onBackHome={() => navigateToView("home")}
          onBackToConfirmation={() => window.history.back()}
          onBackToList={() => window.history.back()}
          onChooseAgain={() => navigate({ view: "plants" })}
          onConfirmPlant={confirmPlant}
          onLogin={() => navigate({ view: "auth" })}
          onQueryChange={setPlantQuery}
          onSelectPlant={(plantId) => navigate({ view: "plants", plantId })}
          onViewGuidance={() => {
            if (!confirmedPlantId) return;
            navigate({ view: "plants", plantId: confirmedPlantId, plantGuidance: true });
          }}
          query={plantQuery}
          selectedPlantId={
            route.plantConfirmation || route.plantGuidance ? undefined : route.plantId
          }
          userId={user?.id}
        />
      ) : (
        <main className="app-main">
        <section className="intro">
          <div className="intro__copy">
            <span className="eyebrow">AI PRUNING ASSISTANT</span>
            <h1>写真から、今できる剪定をわかりやすく。</h1>
            <p>
              庭木の写真と気になる点をもとに、剪定の時期・強さ・確認する枝を安全側に整理します。
            </p>
            <div className="intro__points" aria-label="サービスの特徴">
              <span><Icon name="camera" size={17} />写真で確認</span>
              <span><Icon name="sparkles" size={17} />AIが整理</span>
              <span><Icon name="warning" size={17} />安全を優先</span>
            </div>
          </div>
          <div className="intro__art" aria-hidden="true">
            <span className="intro__art-ring" />
            <Icon name="leaf" size={72} />
          </div>
        </section>

        <form className="diagnosis-form" onSubmit={handleSubmit} noValidate>
          <div className="form-column">
            <SectionCard
              eyebrow="STEP 1"
              title="木の写真を追加"
              description="木全体と気になる枝が分かる写真を選んでください。"
            >
              <UploadArea photos={photos} onChange={handlePhotos} onRemove={removePhoto} />
            </SectionCard>

            <SectionCard
              eyebrow="STEP 2"
              title="木の状態を入力"
              description="分かる範囲で大丈夫です。樹木名が不明でも診断できます。"
            >
              <div className="field">
                <label htmlFor="treeName">植物名・樹木名 <span>任意</span></label>
                <input
                  id="treeName"
                  type="text"
                  placeholder="例：モミジ、ウメ、ツバキ、不明"
                  value={treeName}
                  onChange={(event) => setTreeName(event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="concerns">気になること <span>任意</span></label>
                <textarea
                  id="concerns"
                  rows={5}
                  placeholder="例：大きくなりすぎた、隣家へ枝が伸びている、枯れ枝がある"
                  value={concerns}
                  onChange={(event) => setConcerns(event.target.value)}
                />
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="STEP 3"
              title="希望する剪定を選択"
              description="迷う場合は「軽剪定」がおすすめです。"
            >
              <fieldset className="strength-fieldset">
                <legend className="visually-hidden">剪定の強さ</legend>
                <div className="pruning-options">
                  {pruningOptions.map((option) => (
                    <PruningOptionCard
                      checked={strength === option}
                      key={option}
                      onChange={() => setStrength(option)}
                      option={option}
                    />
                  ))}
                </div>
              </fieldset>
            </SectionCard>

            <section className="submit-panel" aria-labelledby="submit-title">
              <div className="submit-panel__status">
                <span className={photos.length > 0 ? "is-ready" : ""}>
                  {photos.length > 0 ? <Icon name="check" size={18} /> : <Icon name="camera" size={18} />}
                </span>
                <div>
                  <strong id="submit-title">
                    {photos.length > 0 ? "診断の準備ができました" : "写真を選ぶと診断できます"}
                  </strong>
                  <small>選択中：{strength}{photos.length > 0 ? `／写真${photos.length}枚` : ""}</small>
                </div>
              </div>

              {errorMessage && (
                <AlertBox tone="error">
                  <strong>診断を開始できませんでした</strong>
                  <p>{errorMessage}</p>
                </AlertBox>
              )}

              <button className="primary-button" type="submit" disabled={isLoading}>
                {isLoading ? <span className="button-spinner" aria-hidden="true" /> : <Icon name="sparkles" size={22} />}
                {isLoading ? "AIが写真を分析中…" : "AI診断を開始する"}
              </button>
              <p className="privacy-note" id="diagnosis-note">
                入力内容と写真はGemini APIへ送信されます。AIの回答は参考情報として利用し、実作業前に木の状態を直接確認してください。
              </p>
            </section>
          </div>

          <aside className="tips-column" aria-label="撮影と安全のヒント">
            <section className="tips-card">
              <span className="tips-card__icon"><Icon name="camera" size={22} /></span>
              <div>
                <span className="eyebrow">PHOTO TIPS</span>
                <h2>判断しやすい写真</h2>
              </div>
              <ol>
                <li><span>1</span><p><strong>木全体</strong>が収まるように、少し離れて撮影</p></li>
                <li><span>2</span><p>正面だけでなく<strong>別の角度</strong>からも撮影</p></li>
                <li><span>3</span><p>枯れ・混み合いなど<strong>気になる部分</strong>を近くで撮影</p></li>
              </ol>
            </section>

            <AlertBox tone="warning">
              <strong>無理な作業は避けてください</strong>
              <p>高所、太い枝、電線付近の作業は専門家へ相談してください。</p>
            </AlertBox>
          </aside>
        </form>

        <section
          className="result-card"
          ref={diagnosisRef}
          aria-busy={isLoading}
          aria-live="polite"
        >
          <div className="result-card__header">
            <div>
              <span className="eyebrow">AI ANALYSIS</span>
              <h2>剪定診断の結果</h2>
              <p>写真と入力内容から、確認ポイントを順番に整理します。</p>
            </div>
            <span className={`status-badge status-badge--${isLoading ? "loading" : diagnosis ? "success" : errorMessage ? "error" : "idle"}`}>
              {diagnosis && <Icon name="check" size={16} />}
              {resultStatus}
            </span>
          </div>

          {isLoading && <LoadingState />}

          {!isLoading && !diagnosis && !errorMessage && (
            <div className="empty-state">
              <span><Icon name="leaf" size={36} /></span>
              <strong>診断結果はここに表示されます</strong>
              <p>上のフォームで写真と剪定条件を選び、「AI診断を開始する」を押してください。</p>
            </div>
          )}

          {!isLoading && errorMessage && (
            <AlertBox tone="error">
              <strong>診断結果を取得できませんでした</strong>
              <p>{errorMessage}</p>
            </AlertBox>
          )}

          {!isLoading && diagnosis && (
            <>
              <div className="result-summary">
                <span className="result-summary__icon"><Icon name="leaf" size={24} /></span>
                <div>
                  <span>今回の診断</span>
                  <strong>{treeName.trim() || "樹種不明"} ／ {strength}</strong>
                  <p>{getCurrentDateForPrompt()}時点の写真と入力内容をもとにしています。</p>
                </div>
              </div>
              <AnalysisResult diagnosis={diagnosis} />
              <AlertBox tone="warning">
                <strong>診断は参考情報です</strong>
                <p>写真だけでは分からない木の傷みや周辺の危険があります。切る前に枝元と足場を確認してください。</p>
              </AlertBox>
            </>
          )}
        </section>
        </main>
      )}

      <footer className="app-footer">
        <div>
          <span className="brand brand--footer">
            <span className="brand__mark"><Icon name="scissors" size={19} /></span>
            <span>AI Pruning Assistant</span>
          </span>
          <p>庭木と人の安全を第一に、無理のない範囲で作業してください。</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
