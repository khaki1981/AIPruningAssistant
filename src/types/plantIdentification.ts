export interface PlantIdentificationCandidate {
  commonNames?: readonly string[];
  family?: string;
  gbifId?: string;
  genus?: string;
  powoId?: string;
  scientificName?: string;
  scientificNameWithoutAuthor?: string;
  score?: number;
}

export interface PlantIdentificationCandidateMatch {
  candidate: PlantIdentificationCandidate;
  plantId?: string;
}
