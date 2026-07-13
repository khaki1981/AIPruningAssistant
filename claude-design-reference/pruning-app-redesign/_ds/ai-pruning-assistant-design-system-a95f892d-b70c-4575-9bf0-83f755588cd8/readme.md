# AI Pruning Assistant — Design System

剪定アプリ **「AI Pruning Assistant（剪定AIアシスタント）」** のためのデザインシステムです。植物の剪定方法・肥料・時期を確認し、将来的には木の写真をAIが分析して「どの枝から確認すべきか」「どの程度の剪定が安全か」を提案するアプリの、画面全体で共通して使える基盤を体系化しています。

このシステムは **既存アプリのコードを変更せず**、参照用のデザイン提案として作成しています。

## 参照ソース
- **GitHub:** `khaki1981/AIPruningAssistant` — https://github.com/khaki1981/AIPruningAssistant
  - `docs/concept.md`（プロダクトコンセプト）、`src/App.tsx`（現行の単一画面フォーム）、`src/styles.css`（現行スタイル）を読み、色・フォント・トーンの土台にしました。
  - 現行アプリは React + TypeScript + Vite の個人用Webアプリで、写真アップロード＋入力フォーム＋（Gemini API による）診断結果表示までを実装しています。
  - このデザインシステムを使って実装を進める際は、上記リポジトリを合わせて参照するとより忠実な設計ができます。

> リポジトリへのアクセス権が読者にあるとは限りません。アクセスできない場合は本READMEと各カードの記述を正典として扱ってください。

---

## 1. ブランドコンセプト

**世界観:** 木漏れ日のさす明るい庭。土と若葉の温かさに、水と空気の爽やかさを添える。園芸ノートを開くように、剪定に不慣れな人が安心して「次の一歩」を確認できる、落ち着いた自然系のアシスタント。

**デザインキーワード:** 自然 / 親しみやすい / 清潔感 / 安心できる / 信頼感 / 整理されている / 屋外で見やすい

**与えたい印象:** 写真が主役でUIは静かに支える。初心者にやさしく経験者にも違和感がない。情報量が多くても整理されて見える。屋外・幅広い年齢層（40〜70代含む）でも読める大きめの文字と操作領域。

**避けるべき表現:** 緑の使いすぎ／派手すぎる黄色／黒・濃色多用の重さ／丸すぎて幼いデザイン・装飾過多／高級すぎて初心者が近寄りにくい表現／色だけで状態を区別する設計／写真や文字が小さすぎるデザイン。

---

## CONTENT FUNDAMENTALS（コピーの書き方）

- **言語:** 日本語。主語は基本置かず、ユーザーへは「〜してください」「〜できます」の丁寧語。命令形は避け、提案・案内のトーン。
- **一人称/二人称:** アプリ側を「AI」「アシスタント」と呼び、ユーザーを直接「あなた」とは呼ばない。「木の状態を教えてください」のように行動を促す。
- **トーン:** やわらかく丁寧、しかし冗長にしない。専門用語（徒長枝・強剪定など）は使うが、必ず平易な補足を添える。
- **安全表現:** 「AIの診断は参考情報です」「木の状態を直接確認してから作業してください」を繰り返し明示。断定を避け「写真からは断定できません」と不確実性を出す。高所・太枝・電線付近は専門家へ、と必ず注意。
- **ケーシング:** 日本語は等幅で。英語のオーバーライン（例 `AI DIAGNOSIS` / `MY GARDEN`）は大文字＋字間広め。数値はタブラー数字で桁を揃える（例 `12〜2月`）。
- **絵文字:** 使わない。意味はアイコン（Lucide）＋文字で伝える。
- **具体例の書き方:** プレースホルダは「例: モミジ、ウメ、ツバキ、サクラ、不明」のように実在の樹種を列挙し、初心者が入力に迷わないようにする。

---

## VISUAL FOUNDATIONS（視覚の基盤）

- **色:** 緑を主役、茶を補助、水色・黄を差し色。均等には使わない。背景は真っ白を避け、淡いアイボリー `#F6F4EC`／薄グリーン `#F0F4EE`。面（カード・入力）は白 `#FFFFFF`。植物写真の色と競合しない低彩度トーン。
- **タイポ:** 見出しは明朝（Shippori Mincho）で庭・園芸ノートの落ち着き、本文・UIはゴシック（Noto Sans JP）で可読性。本文は最小15px・行間1.8とゆったり。
- **背景:** フラットな単色が基本。現行アプリにあるごく淡い放射グラデ（左上のセージ）を任意で許容。全面画像やパターン・テクスチャは使わず、写真はカード内・ヒーローに置いて主役にする。
- **角丸:** 中庸。カード14px / ボタン・入力10px / タグ6px / モーダル20px / アイコン・FAB・ピルはfull。丸すぎず幼くならない範囲。
- **影:** 緑みのある低コントラストの柔らかい影（`rgba(33,54,40,.06〜.13)`）。浮きすぎない。カードは `shadow-card`、モーダルは `shadow-lg`、FABのみ緑の影。
- **枠線:** 1px、`#E4E1D6`（標準）/ `#D7DACD`（入力・区切り）。カードは「微細な枠＋柔らかい影」の組み合わせ。
- **カードの見た目:** 白面・14px角丸・1pxヘアライン枠・`shadow-card`。植物カードは画像上→見出し→タグ→説明の縦積み、星と季節バッジは画像上に重ねる。
- **ホバー:** ボタンは背景を1段濃く（primary→hover）。カードは-2px持ち上げ＋影を`md`に。アイコンボタンは淡い緑下地。
- **プレス:** ボタンは1px沈む、アイコンボタン・FABは95%前後に縮小。
- **フォーカス:** `:focus-visible` で緑2pxアウトライン＋2pxオフセット。入力欄は緑の3pxリング（`--focus-ring`）。屋外・高齢者にも明瞭。
- **透明・ブラー:** モーダル背景のみ `rgba(23,42,32,.42)` ＋ 2pxブラー。多用しない。
- **モーション:** `cubic-bezier(.4,0,.2,1)`、130〜260ms。フェード・スライドアップ・スピン中心でバウンスは使わない。`prefers-reduced-motion` を尊重。
- **レイアウト:** モバイルファースト。左右余白16px、カード間16px、セクション間48px、最大幅1120px（読み物は720px）。タップ領域は最小44px・推奨48px、主入力/ボタンは52px高。

---

## ICONOGRAPHY（アイコン）

- **システム:** [Lucide](https://lucide.dev) を採用。線画・角丸ジョイントで自然でやわらかい印象、屋外の視認性も良い。ストローク幅は **1.75**（強調時2）に統一、サイズは20〜24pxが基準、色は `currentColor`。
- **読み込み:** CDN（`https://unpkg.com/lucide@latest`）。`components/icons/Icon.jsx` の `<Icon name="…" />` ラッパー経由で使用。装飾は `aria-hidden`、意味を持つ場合は `label` を渡す。
- **用途別の目安:** 検索=`search`、カメラ=`camera`、写真追加=`image-plus`、ハサミ=`scissors`、葉=`leaf`、水=`droplet`、肥料=`sprout`、カレンダー=`calendar`、注意=`alert-triangle`、お気に入り=`star`、履歴=`history`、設定=`settings`。
- **背景の有無:** 単体アイコンは背景なし。丸背景を付ける場合は淡色（`primary-light` など）＋`currentColor`で統一。
- **絵文字・Unicode記号:** 使わない。ステータスは必ずアイコン＋文字で伝える。
- **ロゴ:** 元リポジトリに正式なロゴ画像はありません（現行アプリは「枝」の文字を円に入れた簡易マーク）。本システムでは **ロゴを新規作成せず**、ブランド名は文字表記、マーク位置には汎用のハサミアイコンを暫定使用しています。正式ロゴがあれば差し替えてください。

---

## 主要トークン（CSS変数サンプル）

`styles.css` 一つをリンクすれば全トークンが使えます（`@import` で各tokenファイルを集約）。

```css
/* Colors */
--color-primary: #2E7D4F;        --color-primary-hover: #256641;
--color-primary-light: #EEF5F0;  --color-secondary: #855B41;
--color-accent: #2B83A3;         --color-season: #E0A52E;
--color-bg: #F6F4EC;             --color-surface: #FFFFFF;
--color-border: #E4E1D6;         --color-text: #243028;
--color-text-secondary: #5C6660;
--color-success: #2E7D4F; --color-warning: #C08A1C;
--color-error: #C0453B;   --color-info: #2B83A3;

/* Type */
--font-sans: "Noto Sans JP", system-ui, sans-serif;
--font-serif: "Shippori Mincho", serif;
--fs-body: 16px; --lh-body: 1.8; --fs-sm: 15px;

/* Spacing / radii / shadow */
--space-4: 16px; --space-6: 24px; --space-12: 48px;
--radius-md: 10px; --radius-lg: 14px; --radius-full: 999px;
--card-shadow: 0 6px 18px rgba(33,54,40,.08);
--control-height: 52px; --tap-min: 44px;
```

---

## アクセシビリティ

- **コントラスト:** 本文 `#243028` on 白 = 12.6:1（AAA）、補足 `#5C6660` = 5.9:1（AA）。主要な緑・青・赤の面は白文字でAA以上。黄（season）は文字色に使わず下地/アイコン専用。
- **屋外の視認性:** 明度差の高い文字色、フラット背景、大きめの文字（本文15px以上）。
- **タップ領域:** 最小44px、推奨48px。主入力・主ボタンは52px高。
- **フォーカス:** `:focus-visible` で常に可視。入力は緑リング。
- **色覚差:** 状態は色のみに頼らず、必ずアイコン＋文字で示す（StatusBadge / SeasonBadge / AlertBox / Toast すべて準拠）。
- **エラー:** `aria-invalid` ＋ アイコン ＋ 赤文字メッセージ、`role="alert"` で読み上げ。
- **高齢者配慮:** 文字を小さくしすぎない、行間ゆったり、余白を確保。

---

## Components（コンポーネント一覧）

再利用可能なUIプリミティブ（`window.AIPruningAssistantDesignSystem_a95f89.<Name>`）。元リポジトリに独自コンポーネント定義が無いため、コンセプトと現行UIに合わせた標準セットを設計しました。

**Icons** — `Icon`
**Forms** — `Button`, `IconButton`, `Fab`, `Input`, `Textarea`, `Select`, `SearchBar`, `Checkbox`, `Radio`, `Switch`, `UploadArea`
**Badges & Tags** — `StatusBadge`, `SeasonBadge`, `Tag`
**Cards** — `Card`, `PlantCard`, `StepCard`, `AnalysisResultCard`
**Feedback** — `AlertBox`, `Toast`, `EmptyState`, `LoadingState`, `Skeleton`, `Modal`
**Navigation** — `AppHeader`, `BottomNavigation`, `PageTitle`

各コンポーネントは `<Name>.jsx` ＋ `<Name>.d.ts`（props）＋ `<Name>.prompt.md`（使い方）で構成。各ディレクトリの `*.card.html` が Design System タブのサムネイルです。

---

## ファイル索引（マニフェスト）

- `styles.css` — 唯一のエントリ（`@import` のみ）
- `tokens/` — `fonts.css` / `colors.css` / `typography.css` / `spacing.css` / `radii-shadows.css` / `base.css`
- `components/` — `icons/` `forms/` `badges/` `cards/` `feedback/` `navigation/`
- `guidelines/` — 色・タイポ・スペーシング・角丸・影・ブランドの specimen カード
- `ui_kits/app/` — アプリのクリックスルー再現（index.html ＋ 各 Screen.jsx）
- `SKILL.md` — Agent Skill として持ち出す際の入口

---

## CAVEATS（注意・要確認）
- **フォント:** Google Fonts の Noto Sans JP / Shippori Mincho をCDN読込。現行アプリと同一で置換なし。
- **アイコン:** 現行アプリはテキスト記号（`+` `x` `✓`）を使用。本システムでは屋外視認性と統一感のため Lucide に置き換え・拡張しました（要確認）。
- **写真:** リポジトリに画像素材が無いため、カード/ヒーローはプレースホルダ表示です。実写真を入れると意図どおりになります。
- **ロゴ:** 正式ロゴが無いため未作成（ハサミアイコン＋文字で代替）。
- **角丸:** 現行アプリはシャープな2px角丸ですが、ご要望の「自然でやわらかいが幼くない」方向に合わせ中庸の角丸（カード14px等）へ変更しています。
