export interface PlantIdentificationCandidate {
  commonNames: readonly string[];
  family?: string;
  gbifId?: string;
  genus?: string;
  powoId?: string;
  scientificName?: string;
  scientificNameWithoutAuthor: string;
  score: number;
}

export interface PlantIdentificationUsage {
  remainingCount: number;
  requestCount: number;
  usageDate: string;
}

export interface PlantIdentificationResponse {
  candidates: readonly PlantIdentificationCandidate[];
  usage: PlantIdentificationUsage;
}

export interface PlantIdentificationCandidateMatch {
  candidate: PlantIdentificationCandidate;
  plantId?: string;
}
