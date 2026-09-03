import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type {
  PlantIdentificationCandidate,
  PlantIdentificationResponse,
  PlantIdentificationUsage,
} from "../types/plantIdentification";

const functionErrorCodes = [
  "ORIGIN_NOT_ALLOWED",
  "METHOD_NOT_ALLOWED",
  "CONFIGURATION_ERROR",
  "AUTH_REQUIRED",
  "FEATURE_NOT_AVAILABLE",
  "INVALID_CONTENT_TYPE",
  "REQUEST_TOO_LARGE",
  "INVALID_FORM_DATA",
  "INVALID_IMAGE",
  "RATE_LIMIT_DATABASE_ERROR",
  "RATE_LIMIT_INVALID_RESPONSE",
  "DAILY_LIMIT_REACHED",
  "PLANT_NOT_IDENTIFIED",
  "UPSTREAM_RATE_LIMITED",
  "UPSTREAM_REJECTED",
  "UPSTREAM_UNAVAILABLE",
  "UPSTREAM_TIMEOUT",
  "UPSTREAM_INVALID_RESPONSE",
  "INTERNAL_ERROR",
] as const;

export type PlantIdentificationFunctionErrorCode =
  (typeof functionErrorCodes)[number];

export type PlantIdentificationClientErrorCode =
  | PlantIdentificationFunctionErrorCode
  | "NETWORK_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "UNKNOWN_ERROR";

export type PlantIdentificationErrorCategory =
  | "authentication"
  | "availability"
  | "limit"
  | "network"
  | "not-identified"
  | "request"
  | "unexpected";

interface ClientErrorDefinition {
  category: PlantIdentificationErrorCategory;
  message: string;
  retryable: boolean;
}

const serviceUnavailableMessage =
  "現在、写真判定を利用できません。時間を置いてお試しください。";

const clientErrorDefinitions: Record<
  PlantIdentificationClientErrorCode,
  ClientErrorDefinition
> = {
  ORIGIN_NOT_ALLOWED: {
    category: "availability",
    message: serviceUnavailableMessage,
    retryable: false,
  },
  METHOD_NOT_ALLOWED: {
    category: "availability",
    message: serviceUnavailableMessage,
    retryable: false,
  },
  CONFIGURATION_ERROR: {
    category: "availability",
    message: serviceUnavailableMessage,
    retryable: false,
  },
  AUTH_REQUIRED: {
    category: "authentication",
    message: "ログインの有効期限が切れました。もう一度ログインしてください。",
    retryable: false,
  },
  FEATURE_NOT_AVAILABLE: {
    category: "availability",
    message: "現在、この機能は限られた利用者だけが使用できます。",
    retryable: false,
  },
  INVALID_CONTENT_TYPE: {
    category: "request",
    message: "写真の送信形式が正しくありません。写真を選び直してください。",
    retryable: false,
  },
  REQUEST_TOO_LARGE: {
    category: "request",
    message: "送信する写真のサイズが大きすぎます。写真を選び直してください。",
    retryable: false,
  },
  INVALID_FORM_DATA: {
    category: "request",
    message: "写真の送信内容が正しくありません。写真を選び直してください。",
    retryable: false,
  },
  INVALID_IMAGE: {
    category: "request",
    message: "有効なJPEG写真を送信できませんでした。写真を選び直してください。",
    retryable: false,
  },
  RATE_LIMIT_DATABASE_ERROR: {
    category: "availability",
    message: serviceUnavailableMessage,
    retryable: true,
  },
  RATE_LIMIT_INVALID_RESPONSE: {
    category: "availability",
    message: serviceUnavailableMessage,
    retryable: true,
  },
  DAILY_LIMIT_REACHED: {
    category: "limit",
    message: "本日の写真判定回数の上限に達しました。",
    retryable: false,
  },
  PLANT_NOT_IDENTIFIED: {
    category: "not-identified",
    message:
      "植物を判定できませんでした。葉や花がはっきり写る写真でお試しください。",
    retryable: false,
  },
  UPSTREAM_RATE_LIMITED: {
    category: "availability",
    message:
      "植物判定サービスの利用上限に達しています。時間を置いてお試しください。",
    retryable: true,
  },
  UPSTREAM_REJECTED: {
    category: "availability",
    message: serviceUnavailableMessage,
    retryable: false,
  },
  UPSTREAM_UNAVAILABLE: {
    category: "availability",
    message: serviceUnavailableMessage,
    retryable: true,
  },
  UPSTREAM_TIMEOUT: {
    category: "availability",
    message: "植物判定に時間がかかっています。時間を置いてお試しください。",
    retryable: true,
  },
  UPSTREAM_INVALID_RESPONSE: {
    category: "availability",
    message: serviceUnavailableMessage,
    retryable: true,
  },
  INTERNAL_ERROR: {
    category: "availability",
    message: serviceUnavailableMessage,
    retryable: true,
  },
  NETWORK_ERROR: {
    category: "network",
    message: "通信できませんでした。接続を確認してお試しください。",
    retryable: true,
  },
  SERVICE_UNAVAILABLE: {
    category: "availability",
    message: serviceUnavailableMessage,
    retryable: true,
  },
  INVALID_RESPONSE: {
    category: "unexpected",
    message: serviceUnavailableMessage,
    retryable: true,
  },
  UNKNOWN_ERROR: {
    category: "unexpected",
    message: serviceUnavailableMessage,
    retryable: false,
  },
};

const functionErrorCodeSet = new Set<string>(functionErrorCodes);
const functionErrorStatuses: Record<
  PlantIdentificationFunctionErrorCode,
  number
> = {
  ORIGIN_NOT_ALLOWED: 403,
  METHOD_NOT_ALLOWED: 405,
  CONFIGURATION_ERROR: 503,
  AUTH_REQUIRED: 401,
  FEATURE_NOT_AVAILABLE: 403,
  INVALID_CONTENT_TYPE: 415,
  REQUEST_TOO_LARGE: 413,
  INVALID_FORM_DATA: 400,
  INVALID_IMAGE: 400,
  RATE_LIMIT_DATABASE_ERROR: 503,
  RATE_LIMIT_INVALID_RESPONSE: 500,
  DAILY_LIMIT_REACHED: 429,
  PLANT_NOT_IDENTIFIED: 422,
  UPSTREAM_RATE_LIMITED: 429,
  UPSTREAM_REJECTED: 502,
  UPSTREAM_UNAVAILABLE: 503,
  UPSTREAM_TIMEOUT: 504,
  UPSTREAM_INVALID_RESPONSE: 502,
  INTERNAL_ERROR: 500,
};
const unsafeDisplayCharacterPattern =
  /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/;
const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const maximumCommonNameCount = 20;
const maximumCommonNameLength = 100;
const maximumIdentifierLength = 100;
const maximumScientificNameLength = 300;
const maximumScientificNameWithoutAuthorLength = 200;
const maximumTaxonNameLength = 300;

type ParsedValue<T> = { ok: true; value: T } | { ok: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readDisplayString(
  value: unknown,
  maximumLength: number,
  required: boolean,
): ParsedValue<string | undefined> {
  if (value === null || value === undefined) {
    return required ? { ok: false } : { ok: true, value: undefined };
  }
  if (typeof value !== "string") return { ok: false };

  const normalized = value.trim();
  if (
    (required && normalized.length === 0) ||
    normalized.length > maximumLength ||
    unsafeDisplayCharacterPattern.test(normalized)
  ) {
    return { ok: false };
  }
  return normalized.length > 0
    ? { ok: true, value: normalized }
    : { ok: true, value: undefined };
}

function readCommonNames(value: unknown): ParsedValue<readonly string[]> {
  if (!Array.isArray(value) || value.length > maximumCommonNameCount) {
    return { ok: false };
  }

  const names: string[] = [];
  for (const item of value) {
    const parsed = readDisplayString(item, maximumCommonNameLength, true);
    if (!parsed.ok || parsed.value === undefined) return { ok: false };
    names.push(parsed.value);
  }
  return { ok: true, value: names };
}

function readCandidate(value: unknown): ParsedValue<PlantIdentificationCandidate> {
  if (!isRecord(value)) return { ok: false };
  if (
    typeof value.score !== "number" ||
    !Number.isFinite(value.score) ||
    value.score < 0 ||
    value.score > 1
  ) {
    return { ok: false };
  }

  const scientificNameWithoutAuthor = readDisplayString(
    value.scientificNameWithoutAuthor,
    maximumScientificNameWithoutAuthorLength,
    true,
  );
  const scientificName = readDisplayString(
    value.scientificName,
    maximumScientificNameLength,
    false,
  );
  const commonNames = readCommonNames(value.commonNames);
  const genus = readDisplayString(value.genus, maximumTaxonNameLength, false);
  const family = readDisplayString(value.family, maximumTaxonNameLength, false);
  const gbifId = readDisplayString(value.gbifId, maximumIdentifierLength, false);
  const powoId = readDisplayString(value.powoId, maximumIdentifierLength, false);
  if (
    !scientificNameWithoutAuthor.ok ||
    scientificNameWithoutAuthor.value === undefined ||
    !scientificName.ok ||
    !commonNames.ok ||
    !genus.ok ||
    !family.ok ||
    !gbifId.ok ||
    !powoId.ok
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      score: value.score,
      scientificNameWithoutAuthor: scientificNameWithoutAuthor.value,
      commonNames: commonNames.value,
      ...(scientificName.value === undefined
        ? {}
        : { scientificName: scientificName.value }),
      ...(genus.value === undefined ? {} : { genus: genus.value }),
      ...(family.value === undefined ? {} : { family: family.value }),
      ...(gbifId.value === undefined ? {} : { gbifId: gbifId.value }),
      ...(powoId.value === undefined ? {} : { powoId: powoId.value }),
    },
  };
}

function readUsage(value: unknown): PlantIdentificationUsage | undefined {
  if (!isRecord(value)) return undefined;

  const { remainingCount, requestCount, usageDate } = value;
  if (
    typeof requestCount !== "number" ||
    !Number.isInteger(requestCount) ||
    requestCount < 1 ||
    requestCount > 5 ||
    typeof remainingCount !== "number" ||
    !Number.isInteger(remainingCount) ||
    remainingCount < 0 ||
    remainingCount > 4 ||
    remainingCount !== 5 - requestCount ||
    !isValidDate(usageDate)
  ) {
    return undefined;
  }
  return { requestCount, remainingCount, usageDate };
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = isoDatePattern.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function readSuccessResponse(value: unknown): PlantIdentificationResponse | null {
  if (!isRecord(value) || !Array.isArray(value.candidates)) return null;
  if (value.candidates.length < 1 || value.candidates.length > 3) return null;

  const candidates: PlantIdentificationCandidate[] = [];
  for (const item of value.candidates) {
    const candidate = readCandidate(item);
    if (!candidate.ok) return null;
    candidates.push(candidate.value);
  }

  const usage = readUsage(value.usage);
  return usage ? { candidates, usage } : null;
}

function isFunctionErrorCode(
  value: unknown,
): value is PlantIdentificationFunctionErrorCode {
  return typeof value === "string" && functionErrorCodeSet.has(value);
}

function createClientError(
  code: PlantIdentificationClientErrorCode,
  usage?: PlantIdentificationUsage,
) {
  const definition = clientErrorDefinitions[code];
  return new PlantIdentificationClientError(
    code,
    definition.message,
    definition.category,
    definition.retryable,
    usage,
  );
}

interface HttpErrorContext {
  json: () => Promise<unknown>;
  status: number;
}

function readHttpErrorContext(value: unknown): HttpErrorContext | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("status" in value) ||
    !("json" in value)
  ) {
    return null;
  }
  const context = value as { json?: unknown; status?: unknown };
  return typeof context.status === "number" && typeof context.json === "function"
    ? (context as HttpErrorContext)
    : null;
}

async function convertHttpError(
  error: FunctionsHttpError,
): Promise<PlantIdentificationClientError> {
  const context = readHttpErrorContext(error.context);
  if (!context) return createClientError("SERVICE_UNAVAILABLE");

  let payload: unknown;
  try {
    payload = await context.json();
  } catch {
    payload = undefined;
  }

  if (context.status === 401) return createClientError("AUTH_REQUIRED");
  if (context.status === 404) return createClientError("SERVICE_UNAVAILABLE");
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return createClientError("SERVICE_UNAVAILABLE");
  }

  const code = payload.error.code;
  if (!isFunctionErrorCode(code)) {
    return createClientError(
      typeof code === "string" ? "UNKNOWN_ERROR" : "SERVICE_UNAVAILABLE",
    );
  }
  if (functionErrorStatuses[code] !== context.status) {
    return createClientError("SERVICE_UNAVAILABLE");
  }

  return createClientError(code, readUsage(payload.usage));
}

async function convertInvocationError(
  error: unknown,
): Promise<PlantIdentificationClientError> {
  if (error instanceof FunctionsHttpError) return convertHttpError(error);
  if (error instanceof FunctionsFetchError) return createClientError("NETWORK_ERROR");
  if (error instanceof FunctionsRelayError) {
    return createClientError("SERVICE_UNAVAILABLE");
  }
  return createClientError("UNKNOWN_ERROR");
}

export class PlantIdentificationClientError extends Error {
  constructor(
    public readonly code: PlantIdentificationClientErrorCode,
    message: string,
    public readonly category: PlantIdentificationErrorCategory,
    public readonly retryable: boolean,
    public readonly usage?: PlantIdentificationUsage,
  ) {
    super(message);
    this.name = "PlantIdentificationClientError";
  }
}

export async function identifyPlantFromPhoto(
  photo: File,
  signal?: AbortSignal,
): Promise<PlantIdentificationResponse> {
  if (!supabase) throw createClientError("SERVICE_UNAVAILABLE");

  const body = new FormData();
  body.append("image", photo, "plant.jpg");
  const { data, error } = await supabase.functions.invoke<unknown>(
    "identify-plant",
    { body, signal },
  );

  if (error) throw await convertInvocationError(error);

  const response = readSuccessResponse(data);
  if (!response) throw createClientError("INVALID_RESPONSE");
  return response;
}
