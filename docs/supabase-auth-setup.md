# Supabase認証セットアップ

第4段階では、Supabase Authのメール・パスワード認証と、RLSを確認するための最小限の`profiles`テーブルを使用します。フロントエンドに設定するキーはpublishable key（従来プロジェクトではanon key）のみです。`service_role`キーは絶対に設定しないでください。

## 1. Supabaseプロジェクトを作成する

1. [Supabase Dashboard](https://supabase.com/dashboard)でプロジェクトを作成します。
2. Project SettingsのAPI Keys画面でProject URLとpublishable keyを確認します。
3. 従来のanon keyしか表示されないプロジェクトでは、anon keyを`VITE_SUPABASE_PUBLISHABLE_KEY`へ設定できます。

## 2. メール・パスワード認証を確認する

AuthenticationのSign In / ProvidersでEmailを有効にします。メール確認を有効にした場合、登録直後にはセッションが作られず、利用者へ確認メールが送信されます。本アプリはその場合に確認メールの案内を表示します。

## 3. Site URLとRedirect URLを設定する

AuthenticationのURL Configurationで次を設定します。

- Site URL: 本番NetlifyサイトのURL（例: `https://example.netlify.app`）
- Redirect URLs（ローカル）: `http://localhost:5173/**`
- Redirect URLs（本番）: 本番Netlifyサイトの正確なURL
- Redirect URLs（プレビュー）: 必要な場合のみ `https://**--your-site-name.netlify.app/**`

本番はワイルドカードではなく正確なURLを優先してください。Netlifyプレビューを使う場合だけ、対象サイト名に限定したパターンを追加します。詳細は[SupabaseのRedirect URLs公式ガイド](https://supabase.com/docs/guides/auth/redirect-urls)を確認してください。

## 4. profilesテーブルとRLSを作成する

Supabase DashboardのSQL Editorを開き、[`supabase/migrations/001_create_profiles.sql`](../supabase/migrations/001_create_profiles.sql)の内容を実行します。

このSQLは次を行います。

- `auth.users.id`を主キー・外部キーに持つ`public.profiles`を作成
- RLSを有効化
- `authenticated`ロールへSELECTだけを許可
- `(select auth.uid()) = id`を満たす自分の行だけをSELECT可能にする
- `anon`には権限もポリシーも与えない
- 新規ユーザー作成後、`security definer`かつ空の`search_path`を使うトリガーでprofileを作成
- 既存ユーザーに不足しているprofileを`on conflict do nothing`で補完

登録トリガーの失敗はユーザー登録自体を妨げるため、適用後は必ずテスト用ユーザーで登録を確認してください。

## 5. ローカル環境変数を設定する

ルートに`.env.local`を作成し、Dashboardで確認した値を設定します。`.env.local`はGit管理対象外です。

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_or_anon_key
```

変数名とダミー値は[`.env.example`](../.env.example)にも記載しています。値を設定した後は`npm run dev`を再起動してください。Viteは起動時に環境変数を読み込みます。

## 6. Netlify環境変数を設定する

Netlifyの対象サイトでSite configuration、Environment variablesを開き、次を設定して再デプロイします。

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`service_role`キー、ユーザーのパスワード、アクセストークンは設定・commitしないでください。Viteの`VITE_`変数はビルド済みJavaScriptから参照できるため、公開を前提としたpublishable keyまたはanon keyだけを使用し、実データの保護はRLSで行います。

## 7. 確認メールが届かない場合

次を順番に確認します。

1. AuthenticationのUsersに対象ユーザーが作成されているか
2. Email providerとConfirm emailの設定
3. AuthenticationのLogs
4. Site URLとRedirect URLs
5. 迷惑メールフォルダー
6. Supabaseのメール送信レート制限
7. 独自SMTPを設定している場合はSMTP設定と送信ログ

## 8. RLSを確認する

テスト用のユーザーAとユーザーBを用意し、SQL適用後に次を確認します。管理用のSQL Editorはテーブル所有者権限でRLSを迂回できるため、実際のpublishable keyと各ユーザーのセッションを使い、ブラウザクライアントまたはREST API経由で確認してください。

1. ログアウト状態では`profiles`をSELECTできない。
2. ユーザーAではA自身の1行だけ取得できる。
3. ユーザーBではB自身の1行だけ取得できる。
4. ユーザーBがAの`id`を条件指定しても0行になる。
5. INSERT、UPDATE、DELETEはA・Bのどちらにも許可されない。

DashboardのTable Editorでは、各ユーザーに対応するprofile行が1行ずつ存在することも確認します。RLSの考え方とポリシー構文は[Supabase公式のRow Level Securityガイド](https://supabase.com/docs/guides/database/postgres/row-level-security)、ユーザー作成トリガーは[User Managementガイド](https://supabase.com/docs/guides/auth/managing-user-data)を参照してください。
