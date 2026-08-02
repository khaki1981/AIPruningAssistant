import type {
  Plant,
  PlantBasicData,
  PlantCalendar,
  PlantClassification,
  PlantPruning,
  PlantPruningMethod,
  PlantReviewStatus,
  PlantSource,
} from "../types/plant";

// These JSON files are read-only application copies. AIPruningDatabase remains the source of truth.
const plantModules = import.meta.glob("./plants/**/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const reviewStatuses: PlantReviewStatus[] = ["draft", "reviewed", "verified"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readObject(
  data: Record<string, unknown>,
  key: string,
  filePath: string,
) {
  const value = data[key];
  if (!isRecord(value)) {
    throw new Error(`${filePath}: ${key} must be an object.`);
  }
  return value;
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

function readStringArray(
  data: Record<string, unknown>,
  key: string,
  filePath: string,
) {
  const value = data[key];
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${filePath}: ${key} must be an array of strings.`);
  }
  return value;
}

function readMonthArray(
  data: Record<string, unknown>,
  key: string,
  filePath: string,
) {
  const value = data[key];
  if (
    !Array.isArray(value) ||
    value.some(
      (month) =>
        typeof month !== "number" ||
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12,
    )
  ) {
    throw new Error(`${filePath}: ${key} must contain month numbers from 1 to 12.`);
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

function readClassification(
  data: Record<string, unknown>,
  filePath: string,
): PlantClassification {
  const value = readObject(data, "classification", filePath);
  return {
    category: readOptionalString(value, "category", filePath),
    familyJa: readOptionalString(value, "familyJa", filePath),
    familyScientific: readOptionalString(value, "familyScientific", filePath),
    genusJa: readOptionalString(value, "genusJa", filePath),
    genusScientific: readOptionalString(value, "genusScientific", filePath),
    cultivar: readOptionalString(value, "cultivar", filePath),
  };
}

function readBasicData(
  data: Record<string, unknown>,
  filePath: string,
): PlantBasicData {
  const value = readObject(data, "basicData", filePath);
  return {
    growthHabit: readOptionalString(value, "growthHabit", filePath),
    height: readOptionalString(value, "height", filePath),
    spread: readOptionalString(value, "spread", filePath),
    deciduousEvergreen: readOptionalString(value, "deciduousEvergreen", filePath),
    notes: readStringArray(value, "notes", filePath),
  };
}

function readCalendar(
  data: Record<string, unknown>,
  filePath: string,
): PlantCalendar {
  const value = readObject(data, "calendar", filePath);
  return {
    floweringMonths: readMonthArray(value, "floweringMonths", filePath),
    pruningMonths: readMonthArray(value, "pruningMonths", filePath),
    flowerBudFormationMonths: readMonthArray(value, "flowerBudFormationMonths", filePath),
    harvestMonths: readMonthArray(value, "harvestMonths", filePath),
    plantingMonths: readMonthArray(value, "plantingMonths", filePath),
  };
}

function readPruningMethods(
  data: Record<string, unknown>,
  filePath: string,
): PlantPruningMethod[] {
  const value = data.methods;
  if (!Array.isArray(value)) {
    throw new Error(`${filePath}: pruning.methods must be an array.`);
  }

  return value.map((method, index) => {
    if (!isRecord(method)) {
      throw new Error(`${filePath}: pruning.methods[${index}] must be an object.`);
    }
    return {
      name: readRequiredString(method, "name", filePath),
      description: readOptionalString(method, "description", filePath),
      conditions: readOptionalString(method, "conditions", filePath),
    };
  });
}

function readPruning(
  data: Record<string, unknown>,
  filePath: string,
): PlantPruning {
  const value = readObject(data, "pruning", filePath);
  return {
    summary: readOptionalString(value, "summary", filePath),
    timing: readStringArray(value, "timing", filePath),
    methods: readPruningMethods(value, filePath),
    warnings: readStringArray(value, "warnings", filePath),
    flowerBudType: readOptionalString(value, "flowerBudType", filePath),
    difficulty: readOptionalString(value, "difficulty", filePath),
  };
}

function readSources(data: Record<string, unknown>, filePath: string): PlantSource[] {
  const value = data.sources;
  if (!Array.isArray(value)) {
    throw new Error(`${filePath}: sources must be an array.`);
  }

  return value.map((source, index) => {
    if (!isRecord(source)) {
      throw new Error(`${filePath}: sources[${index}] must be an object.`);
    }
    const page = source.page;
    if (typeof page !== "number" || !Number.isFinite(page)) {
      throw new Error(`${filePath}: sources[${index}].page must be a number.`);
    }
    return {
      sourceId: readRequiredString(source, "sourceId", filePath),
      page,
      extractionType: readOptionalString(source, "extractionType", filePath),
      note: readOptionalString(source, "note", filePath),
    };
  });
}

function toPlant(value: unknown, filePath: string): Plant {
  if (!isRecord(value)) {
    throw new Error(`${filePath}: plant JSON must contain an object.`);
  }

  return {
    id: readRequiredString(value, "id", filePath),
    nameJa: readRequiredString(value, "nameJa", filePath),
    aliases: readStringArray(value, "aliases", filePath),
    scientificName: readOptionalString(value, "scientificName", filePath),
    classification: readClassification(value, filePath),
    basicData: readBasicData(value, filePath),
    calendar: readCalendar(value, filePath),
    pruning: readPruning(value, filePath),
    sources: readSources(value, filePath),
    reviewStatus: readReviewStatus(value, filePath),
  };
}

const allPlants = Object.entries(plantModules)
  .map(([filePath, value]) => toPlant(value, filePath))
  .sort(
    (left, right) =>
      left.nameJa.localeCompare(right.nameJa, "ja") || left.id.localeCompare(right.id),
  );

export function loadPlants(isProduction = import.meta.env.PROD) {
  return isProduction
    ? allPlants.filter((plant) => plant.reviewStatus === "verified")
    : [...allPlants];
}
