import type { PlantIdentificationCandidate } from "../types/plantIdentification";

export interface PlantIdentificationMapping {
  gbifIds: readonly string[];
  plantId: string;
  powoIds: readonly string[];
  scientificNamesWithoutAuthor: readonly string[];
}

export type PlantIdentificationMappingIdentifierType =
  | "powoId"
  | "gbifId"
  | "scientificNameWithoutAuthor";

export interface PlantIdentificationMappingConflict {
  identifierType: PlantIdentificationMappingIdentifierType;
  identifierValue: string;
  plantIds: readonly string[];
}

export const plantIdentificationMappings: readonly PlantIdentificationMapping[] = [
  {
    plantId: "hydrangea",
    scientificNamesWithoutAuthor: ["Hydrangea macrophylla"],
    powoIds: ["791637-1"],
    gbifIds: [],
  },
  {
    plantId: "hakumokuren",
    scientificNamesWithoutAuthor: ["Magnolia denudata"],
    powoIds: ["554678-1"],
    gbifIds: [],
  },
];

function normalizeScientificName(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

export function findPlantIdentificationMappingConflicts(
  mappings: readonly PlantIdentificationMapping[] = plantIdentificationMappings,
): PlantIdentificationMappingConflict[] {
  const entries = new Map<
    string,
    {
      identifierType: PlantIdentificationMappingIdentifierType;
      identifierValue: string;
      plantIds: Set<string>;
    }
  >();

  const addIdentifier = (
    identifierType: PlantIdentificationMappingIdentifierType,
    identifierValue: string,
    plantId: string,
  ) => {
    if (!identifierValue) return;

    const key = `${identifierType}\u0000${identifierValue}`;
    const existing = entries.get(key);
    if (existing) {
      existing.plantIds.add(plantId);
      return;
    }
    entries.set(key, {
      identifierType,
      identifierValue,
      plantIds: new Set([plantId]),
    });
  };

  for (const mapping of mappings) {
    for (const powoId of mapping.powoIds) {
      addIdentifier("powoId", powoId, mapping.plantId);
    }
    for (const gbifId of mapping.gbifIds) {
      addIdentifier("gbifId", gbifId, mapping.plantId);
    }
    for (const scientificName of mapping.scientificNamesWithoutAuthor) {
      addIdentifier(
        "scientificNameWithoutAuthor",
        normalizeScientificName(scientificName),
        mapping.plantId,
      );
    }
  }

  return [...entries.values()]
    .filter((entry) => entry.plantIds.size > 1)
    .map((entry) => ({
      identifierType: entry.identifierType,
      identifierValue: entry.identifierValue,
      plantIds: [...entry.plantIds].sort(),
    }));
}

export function matchPlantIdentificationCandidate(
  candidate: PlantIdentificationCandidate,
  availablePlantIds: ReadonlySet<string>,
): string | undefined {
  const matchedPlantIds = new Set<string>();

  if (candidate.powoId) {
    for (const mapping of plantIdentificationMappings) {
      if (mapping.powoIds.includes(candidate.powoId)) {
        matchedPlantIds.add(mapping.plantId);
      }
    }
  }

  if (candidate.gbifId) {
    for (const mapping of plantIdentificationMappings) {
      if (mapping.gbifIds.includes(candidate.gbifId)) {
        matchedPlantIds.add(mapping.plantId);
      }
    }
  }

  if (candidate.scientificNameWithoutAuthor) {
    const candidateName = normalizeScientificName(
      candidate.scientificNameWithoutAuthor,
    );
    for (const mapping of plantIdentificationMappings) {
      if (
        mapping.scientificNamesWithoutAuthor.some(
          (name) => normalizeScientificName(name) === candidateName,
        )
      ) {
        matchedPlantIds.add(mapping.plantId);
      }
    }
  }

  if (matchedPlantIds.size !== 1) return undefined;

  const [plantId] = matchedPlantIds;
  return plantId && availablePlantIds.has(plantId) ? plantId : undefined;
}
