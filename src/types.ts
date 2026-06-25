export type PruningStrength =
  | "強剪定"
  | "軽剪定"
  | "形を揃えるだけ"
  | "枯れ枝整理";

export interface UploadedPhoto {
  id: string;
  name: string;
  url: string;
}

export interface DiagnosisItem {
  title: string;
  content: string;
}
