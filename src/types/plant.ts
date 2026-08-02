export type PlantReviewStatus = "draft" | "reviewed" | "verified";

export interface PlantClassification {
  category?: string;
  familyJa?: string;
  familyScientific?: string;
  genusJa?: string;
  genusScientific?: string;
  cultivar?: string;
}

export interface PlantBasicData {
  growthHabit?: string;
  height?: string;
  spread?: string;
  deciduousEvergreen?: string;
  notes: string[];
}

export interface PlantCalendar {
  floweringMonths: number[];
  pruningMonths: number[];
  flowerBudFormationMonths: number[];
  harvestMonths: number[];
  plantingMonths: number[];
}

export interface PlantPruningMethod {
  name: string;
  description?: string;
  conditions?: string;
}

export interface PlantPruning {
  summary?: string;
  timing: string[];
  methods: PlantPruningMethod[];
  warnings: string[];
  flowerBudType?: string;
  difficulty?: string;
}

export interface PlantSource {
  sourceId: string;
  page: number;
  extractionType?: string;
  note?: string;
}

export interface Plant {
  id: string;
  nameJa: string;
  aliases: string[];
  scientificName?: string;
  classification: PlantClassification;
  basicData: PlantBasicData;
  calendar: PlantCalendar;
  pruning: PlantPruning;
  sources: PlantSource[];
  reviewStatus: PlantReviewStatus;
}

export type PlantListItem = Pick<
  Plant,
  "id" | "nameJa" | "aliases" | "scientificName" | "reviewStatus"
>;
