import type { PlantListItem, PlantReviewStatus } from "../types/plant";

// These JSON files are read-only application copies. AIPruningDatabase remains the source of truth.
const plantModules = import.meta.glob("./plants/**/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const reviewStatuses: PlantReviewStatus[] = ["draft", "reviewed", "verified"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(
  data: Record<string, unknown>,
  key: string,
  filePath: string,
) {
  const value = data[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${filePath}: ${key} must be a non-empty string.`);
  }
  return value;
}

function readOptionalString(
  data: Record<string, unknown>,
  key: string,
  filePath: string,
) {
  const value = data[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`${filePath}: ${key} must be a string when present.`);
  }
  return value;
}

function readAliases(data: Record<string, unknown>, filePath: string) {
  const value = data.aliases;
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((alias) => typeof alias !== "string")) {
    throw new Error(`${filePath}: aliases must be an array of strings.`);
  }
  return value;
}

function readReviewStatus(
  data: Record<string, unknown>,
  filePath: string,
): PlantReviewStatus {
  const value = data.reviewStatus;
  if (typeof value !== "string" || !reviewStatuses.includes(value as PlantReviewStatus)) {
    throw new Error(`${filePath}: unknown reviewStatus "${String(value)}".`);
  }
  return value as PlantReviewStatus;
}

function toPlantListItem(value: unknown, filePath: string): PlantListItem {
  if (!isRecord(value)) {
    throw new Error(`${filePath}: plant JSON must contain an object.`);
  }

  return {
    id: readRequiredString(value, "id", filePath),
    nameJa: readRequiredString(value, "nameJa", filePath),
    aliases: readAliases(value, filePath),
    scientificName: readOptionalString(value, "scientificName", filePath),
    reviewStatus: readReviewStatus(value, filePath),
  };
}

const allPlants = Object.entries(plantModules)
  .map(([filePath, value]) => toPlantListItem(value, filePath))
  .sort(
    (left, right) =>
      left.nameJa.localeCompare(right.nameJa, "ja") || left.id.localeCompare(right.id),
  );

export function loadPlants(isProduction = import.meta.env.PROD) {
  return isProduction
    ? allPlants.filter((plant) => plant.reviewStatus === "verified")
    : [...allPlants];
}
