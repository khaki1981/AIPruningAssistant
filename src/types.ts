export type PruningStrength =
  | "強剪定"
  | "軽剪定"
  | "形を整える程度"
  | "枯れ枝の整理";

export interface UploadedPhoto {
  id: string;
  name: string;
  type: string;
  url: string;
  file: File;
}
