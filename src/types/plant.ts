export type PlantReviewStatus = "draft" | "reviewed" | "verified";

export interface PlantListItem {
  id: string;
  nameJa: string;
  aliases: string[];
  scientificName?: string;
  reviewStatus: PlantReviewStatus;
}
