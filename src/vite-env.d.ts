/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_PLANT_DATA_VISIBILITY?: "all" | "verified";
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
