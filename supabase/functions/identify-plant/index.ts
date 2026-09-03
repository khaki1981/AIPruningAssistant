import { createSupabaseContext } from "npm:@supabase/server@1.4.0";

const plantNetEndpoint = "https://my-api.plantnet.org/v2/identify/all";
const maximumImageBytes = 5 * 1024 * 1024;
const maximumRequestBytes = 6 * 1024 * 1024;
const upstreamTimeoutMilliseconds = 15_000;
const maximumScientificNameWithoutAuthorLength = 200;
const maximumScientificNameLength = 300;
const maximumTaxonNameLength = 150;
const maximumCommonNameLength = 100;
const maximumCommonNames = 20;
const maximumIdentifierLength = 100;
const maximumCandidates = 3;

const allowedOrigins = new Set([
  "https://aipruningassistant.netlify.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
const deployPreviewOriginPattern =
  /^https:\/\/deploy-preview-\d+--aipruningassistant\.netlify\.app$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const unsafeDisplayCharacterPattern =
  /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/;

const errorDefinitions = {
  ORIGIN_NOT_ALLOWED: {
    status: 403,
    message: "この送信元からは写真判定を利用できません。",
  },
  METHOD_NOT_ALLOWED: {
    status: 405,
    message: "このHTTPメソッドは利用できません。",
  },
  CONFIGURATION_ERROR: {
    status: 503,
    message: "写真判定機能を現在利用できません。",
  },
  AUTH_REQUIRED: {
    status: 401,
    message: "写真判定を利用するにはログインが必要です。",
  },
  FEATURE_NOT_AVAILABLE: {
    status: 403,
    message: "このアカウントでは写真判定を利用できません。",
  },
  INVALID_CONTENT_TYPE: {
    status: 415,
    message: "送信形式が正しくありません。",
  },
  REQUEST_TOO_LARGE: {
    status: 413,
    message: "送信する写真のサイズが大きすぎます。",
  },
  INVALID_FORM_DATA: {
    status: 400,
    message: "写真の送信内容が正しくありません。",
  },
  INVALID_IMAGE: {
    status: 400,
    message: "有効なJPEG写真を1枚選んでください。",
  },
  RATE_LIMIT_DATABASE_ERROR: {
    status: 503,
    message: "利用回数を確認できませんでした。",
  },
  RATE_LIMIT_INVALID_RESPONSE: {
    status: 500,
    message: "利用回数の確認結果が正しくありません。",
  },
  DAILY_LIMIT_REACHED: {
    status: 429,
    message: "本日の写真判定回数の上限に達しました。",
  },
  PLANT_NOT_IDENTIFIED: {
    status: 422,
    message: "写真から植物候補を判定できませんでした。",
  },
  UPSTREAM_RATE_LIMITED: {
    status: 429,
    message: "写真判定サービスが利用上限に達しています。",
  },
  UPSTREAM_REJECTED: {
    status: 502,
    message: "写真判定サービスがリクエストを受け付けませんでした。",
  },
  UPSTREAM_UNAVAILABLE: {
    status: 503,
    message: "写真判定サービスを現在利用できません。",
  },
  UPSTREAM_TIMEOUT: {
    status: 504,
    message: "写真判定サービスから時間内に応答がありませんでした。",
  },
  UPSTREAM_INVALID_RESPONSE: {
    status: 502,
    message: "写真判定サービスから正しい応答を取得できませんでした。",
  },
  INTERNAL_ERROR: {
    status: 500,
    message: "写真判定の処理中にエラーが発生しました。",
  },
} as const;

type ErrorCode = keyof typeof errorDefinitions;

interface RuntimeConfiguration {
  allowedUserIds: ReadonlySet<string>;
  plantNetApiKey: string;
}

interface UsageDetails {
  requestCount: number;
  remainingCount: number;
  usageDate: string;
}

interface PlantIdentificationCandidate {
  score: number;
  scientificNameWithoutAuthor: string;
  scientificName: string | null;
  commonNames: string[];
  genus: string | null;
  family: string | null;
  gbifId: string | null;
  powoId: string | null;
}

type ParsedValue<T> =
  | { ok: true; value: T }
  | { ok: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAllowedOrigin(origin: string) {
  return allowedOrigins.has(origin) || deployPreviewOriginPattern.test(origin);
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function responseHeaders(origin: string | null, extra?: HeadersInit) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  if (origin) {
    for (const [name, value] of Object.entries(corsHeaders(origin))) {
      headers.set(name, value);
    }
  }
  if (extra) {
    new Headers(extra).forEach((value, name) => headers.set(name, value));
  }
  return headers;
}

function jsonResponse(origin: string | null, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(origin),
  });
}

function errorResponse(
  origin: string | null,
  code: ErrorCode,
  usage?: UsageDetails,
  extraHeaders?: HeadersInit,
) {
  const definition = errorDefinitions[code];
  return new Response(
    JSON.stringify({
      error: { code, message: definition.message },
      ...(usage ? { usage } : {}),
    }),
    {
      status: definition.status,
      headers: responseHeaders(origin, extraHeaders),
    },
  );
}

function preflightResponse(origin: string) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function readOpaqueSecret(name: string) {
  const value = Deno.env.get(name);
  return value &&
      value === value.trim() &&
      value.length <= 4096 &&
      !/\s/.test(value)
    ? value
    : null;
}

function isValidSupabaseUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

function readRuntimeConfiguration(): RuntimeConfiguration | null {
  const plantNetApiKey = readOpaqueSecret("PLANTNET_API_KEY");
  const rawSupabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseUrl = rawSupabaseUrl.trim();
  const supabaseAnonKey = readOpaqueSecret("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = readOpaqueSecret("SUPABASE_SERVICE_ROLE_KEY");
  const configuredUserIds = Deno.env.get(
    "PLANT_IDENTIFICATION_ALLOWED_USER_IDS",
  );

  if (
    !plantNetApiKey ||
    !supabaseUrl ||
    rawSupabaseUrl !== supabaseUrl ||
    !isValidSupabaseUrl(supabaseUrl) ||
    !supabaseAnonKey ||
    !supabaseServiceRoleKey ||
    configuredUserIds === undefined
  ) {
    return null;
  }

  const userIds = configuredUserIds
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (userIds.length === 0 || userIds.some((value) => !uuidPattern.test(value))) {
    return null;
  }

  return {
    allowedUserIds: new Set(userIds.map((value) => value.toLowerCase())),
    plantNetApiKey,
  };
}

function readBearerToken(value: string | null) {
  if (!value || value.length > 8192) return null;
  const match = /^Bearer ([^\s]+)$/i.exec(value);
  return match?.[1] ?? null;
}

function isMultipartFormData(contentType: string | null) {
  return contentType !== null && /^multipart\/form-data(?:\s*;|$)/i.test(contentType);
}

function validateDeclaredContentLength(value: string | null) {
  if (value === null) return "missing" as const;
  if (!/^\d+$/.test(value)) return "invalid" as const;
  const length = Number(value);
  if (!Number.isSafeInteger(length) || length > maximumRequestBytes) {
    return "too_large" as const;
  }
  return "valid" as const;
}

async function hasValidJpegSignature(file: File) {
  if (file.size < 5) return false;
  try {
    const firstBytes = new Uint8Array(await file.slice(0, 3).arrayBuffer());
    const lastBytes = new Uint8Array(
      await file.slice(file.size - 2, file.size).arrayBuffer(),
    );
    return (
      firstBytes.length === 3 &&
      firstBytes[0] === 0xff &&
      firstBytes[1] === 0xd8 &&
      firstBytes[2] === 0xff &&
      lastBytes.length === 2 &&
      lastBytes[0] === 0xff &&
      lastBytes[1] === 0xd9
    );
  } catch {
    return false;
  }
}

function isValidUsageDate(value: unknown): value is string {
  return typeof value === "string" && isoDatePattern.test(value);
}

function parseRateLimitResponse(value: unknown): ParsedValue<{
  allowed: boolean;
  usage: UsageDetails;
}> {
  if (!Array.isArray(value) || value.length !== 1 || !isRecord(value[0])) {
    return { ok: false };
  }

  const row = value[0];
  const allowed = row.allowed;
  const requestCount = row.request_count;
  const remainingCount = row.remaining_count;
  const usageDate = row.usage_date;
  if (
    typeof allowed !== "boolean" ||
    !Number.isInteger(requestCount) ||
    typeof requestCount !== "number" ||
    requestCount < 0 ||
    requestCount > 5 ||
    !Number.isInteger(remainingCount) ||
    typeof remainingCount !== "number" ||
    remainingCount < 0 ||
    remainingCount > 4 ||
    !isValidUsageDate(usageDate)
  ) {
    return { ok: false };
  }

  const contractIsValid = allowed
    ? requestCount >= 1 && remainingCount === 5 - requestCount
    : requestCount === 5 && remainingCount === 0;
  if (!contractIsValid) return { ok: false };

  return {
    ok: true,
    value: {
      allowed,
      usage: { requestCount, remainingCount, usageDate },
    },
  };
}

function readDisplayString(
  value: unknown,
  maximumLength: number,
  required: boolean,
): ParsedValue<string | null> {
  if (value === undefined || value === null) {
    return required ? { ok: false } : { ok: true, value: null };
  }
  if (typeof value !== "string") return { ok: false };

  const trimmed = value.trim();
  if (
    (!trimmed && required) ||
    trimmed.length > maximumLength ||
    unsafeDisplayCharacterPattern.test(trimmed)
  ) {
    return { ok: false };
  }
  return trimmed ? { ok: true, value: trimmed } : { ok: true, value: null };
}

function readCommonNames(value: unknown): ParsedValue<string[]> {
  if (value === undefined || value === null) return { ok: true, value: [] };
  if (!Array.isArray(value) || value.length > maximumCommonNames) {
    return { ok: false };
  }

  const commonNames: string[] = [];
  for (const item of value) {
    const parsed = readDisplayString(item, maximumCommonNameLength, true);
    if (!parsed.ok || parsed.value === null) return { ok: false };
    commonNames.push(parsed.value);
  }
  return { ok: true, value: commonNames };
}

function readTaxonName(value: unknown): ParsedValue<string | null> {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (typeof value === "string") {
    return readDisplayString(value, maximumTaxonNameLength, false);
  }
  if (!isRecord(value)) return { ok: false };

  const preferred = readDisplayString(
    value.scientificNameWithoutAuthor,
    maximumTaxonNameLength,
    false,
  );
  if (!preferred.ok) return { ok: false };
  if (preferred.value) return preferred;
  return readDisplayString(value.scientificName, maximumTaxonNameLength, false);
}

function readIdentifierValue(value: unknown): ParsedValue<string | null> {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0
      ? { ok: true, value: String(value) }
      : { ok: false };
  }
  return readDisplayString(value, maximumIdentifierLength, false);
}

function readIdentifierContainer(value: unknown): ParsedValue<string | null> {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (!isRecord(value) || !("id" in value)) return { ok: false };
  return readIdentifierValue(value.id);
}

function readIdentifierFromLocations(
  primary: unknown,
  secondary: unknown,
): ParsedValue<string | null> {
  const first = readIdentifierContainer(primary);
  const second = readIdentifierContainer(secondary);
  if (!first.ok || !second.ok) return { ok: false };
  if (first.value && second.value && first.value !== second.value) {
    return { ok: false };
  }
  return { ok: true, value: first.value ?? second.value };
}

function parseCandidate(value: unknown): PlantIdentificationCandidate | null {
  if (!isRecord(value) || !isRecord(value.species)) return null;
  if (
    typeof value.score !== "number" ||
    !Number.isFinite(value.score) ||
    value.score < 0 ||
    value.score > 1
  ) {
    return null;
  }

  const species = value.species;
  const scientificNameWithoutAuthor = readDisplayString(
    species.scientificNameWithoutAuthor,
    maximumScientificNameWithoutAuthorLength,
    true,
  );
  const scientificName = readDisplayString(
    species.scientificName,
    maximumScientificNameLength,
    false,
  );
  const commonNames = readCommonNames(species.commonNames);
  const genus = readTaxonName(species.genus);
  const family = readTaxonName(species.family);
  const gbifId = readIdentifierFromLocations(species.gbif, value.gbif);
  const powoId = readIdentifierFromLocations(species.powo, value.powo);
  if (
    !scientificNameWithoutAuthor.ok ||
    scientificNameWithoutAuthor.value === null ||
    !scientificName.ok ||
    !commonNames.ok ||
    !genus.ok ||
    !family.ok ||
    !gbifId.ok ||
    !powoId.ok
  ) {
    return null;
  }

  return {
    score: value.score,
    scientificNameWithoutAuthor: scientificNameWithoutAuthor.value,
    scientificName: scientificName.value,
    commonNames: commonNames.value,
    genus: genus.value,
    family: family.value,
    gbifId: gbifId.value,
    powoId: powoId.value,
  };
}

function parsePlantNetResponse(value: unknown): ParsedValue<
  PlantIdentificationCandidate[]
> {
  if (!isRecord(value) || !Array.isArray(value.results)) {
    return { ok: false };
  }
  if (value.results.length === 0) return { ok: true, value: [] };

  const candidates = value.results
    .slice(0, maximumCandidates)
    .map(parseCandidate)
    .filter((candidate): candidate is PlantIdentificationCandidate =>
      candidate !== null
    );
  return candidates.length > 0
    ? { ok: true, value: candidates }
    : { ok: false };
}

async function requestPlantNet(
  image: File,
  apiKey: string,
): Promise<
  | { ok: true; status: number; body?: unknown }
  | {
      ok: false;
      code:
        | "UPSTREAM_TIMEOUT"
        | "UPSTREAM_UNAVAILABLE"
        | "UPSTREAM_INVALID_RESPONSE";
    }
> {
  const endpoint = new URL(plantNetEndpoint);
  endpoint.searchParams.set("api-key", apiKey);
  endpoint.searchParams.set("nb-results", String(maximumCandidates));
  endpoint.searchParams.set("lang", "ja");
  endpoint.searchParams.set("include-related-images", "false");
  endpoint.searchParams.set("no-reject", "false");

  const body = new FormData();
  body.append("images", image, "plant.jpg");
  body.append("organs", "auto");

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    upstreamTimeoutMilliseconds,
  );
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body,
      signal: controller.signal,
    });
    if (response.status !== 200) {
      return { ok: true, status: response.status };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
      return { ok: false, code: "UPSTREAM_INVALID_RESPONSE" };
    }

    try {
      return { ok: true, status: response.status, body: await response.json() };
    } catch {
      return {
        ok: false,
        code: controller.signal.aborted
          ? "UPSTREAM_TIMEOUT"
          : "UPSTREAM_INVALID_RESPONSE",
      };
    }
  } catch {
    return {
      ok: false,
      code: controller.signal.aborted
        ? "UPSTREAM_TIMEOUT"
        : "UPSTREAM_UNAVAILABLE",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  async fetch(request: Request) {
    let corsOrigin: string | null = null;
    let reservedUsage: UsageDetails | undefined;

    try {
      const origin = request.headers.get("origin");
      if (!origin || !isAllowedOrigin(origin)) {
        return errorResponse(null, "ORIGIN_NOT_ALLOWED");
      }
      corsOrigin = origin;

      if (request.method === "OPTIONS") return preflightResponse(origin);
      if (request.method !== "POST") {
        return errorResponse(origin, "METHOD_NOT_ALLOWED", undefined, {
          Allow: "POST, OPTIONS",
        });
      }

      const configuration = readRuntimeConfiguration();
      if (!configuration) return errorResponse(origin, "CONFIGURATION_ERROR");

      if (!readBearerToken(request.headers.get("authorization"))) {
        return errorResponse(origin, "AUTH_REQUIRED");
      }

      let contextResult: Awaited<ReturnType<typeof createSupabaseContext>>;
      try {
        contextResult = await createSupabaseContext(request, { auth: "user" });
      } catch {
        return errorResponse(origin, "AUTH_REQUIRED");
      }
      if (contextResult.error || !contextResult.data) {
        return errorResponse(origin, "AUTH_REQUIRED");
      }

      const context = contextResult.data;
      const userId = context.jwtClaims?.sub;
      if (typeof userId !== "string" || !uuidPattern.test(userId)) {
        return errorResponse(origin, "AUTH_REQUIRED");
      }
      if (!configuration.allowedUserIds.has(userId.toLowerCase())) {
        return errorResponse(origin, "FEATURE_NOT_AVAILABLE");
      }

      if (!isMultipartFormData(request.headers.get("content-type"))) {
        return errorResponse(origin, "INVALID_CONTENT_TYPE");
      }
      const contentLengthResult = validateDeclaredContentLength(
        request.headers.get("content-length"),
      );
      if (contentLengthResult === "too_large") {
        return errorResponse(origin, "REQUEST_TOO_LARGE");
      }
      if (contentLengthResult === "invalid") {
        return errorResponse(origin, "INVALID_FORM_DATA");
      }

      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        return errorResponse(origin, "INVALID_FORM_DATA");
      }

      const entries = [...formData.entries()];
      if (
        entries.length !== 1 ||
        entries[0][0] !== "image" ||
        !(entries[0][1] instanceof File)
      ) {
        return errorResponse(origin, "INVALID_FORM_DATA");
      }
      const image = entries[0][1];
      if (
        image.size === 0 ||
        image.size > maximumImageBytes ||
        image.type !== "image/jpeg" ||
        !(await hasValidJpegSignature(image))
      ) {
        return errorResponse(
          origin,
          image.size > maximumImageBytes
            ? "REQUEST_TOO_LARGE"
            : "INVALID_IMAGE",
        );
      }

      const { data: rateLimitData, error: rateLimitError } =
        await context.supabaseAdmin.rpc(
          "reserve_plant_identification_request",
          { p_user_id: userId },
        );
      if (rateLimitError) {
        return errorResponse(origin, "RATE_LIMIT_DATABASE_ERROR");
      }
      const rateLimit = parseRateLimitResponse(rateLimitData);
      if (!rateLimit.ok) {
        return errorResponse(origin, "RATE_LIMIT_INVALID_RESPONSE");
      }
      reservedUsage = rateLimit.value.usage;
      if (!rateLimit.value.allowed) {
        return errorResponse(origin, "DAILY_LIMIT_REACHED", reservedUsage);
      }

      const upstream = await requestPlantNet(
        image,
        configuration.plantNetApiKey,
      );
      if (upstream.ok === false) {
        return errorResponse(origin, upstream.code, reservedUsage);
      }
      if (upstream.status === 404) {
        return errorResponse(origin, "PLANT_NOT_IDENTIFIED", reservedUsage);
      }
      if (upstream.status === 429) {
        return errorResponse(origin, "UPSTREAM_RATE_LIMITED", reservedUsage);
      }
      if (upstream.status >= 400 && upstream.status < 500) {
        return errorResponse(origin, "UPSTREAM_REJECTED", reservedUsage);
      }
      if (upstream.status >= 500) {
        return errorResponse(origin, "UPSTREAM_UNAVAILABLE", reservedUsage);
      }
      if (upstream.status !== 200) {
        return errorResponse(origin, "UPSTREAM_INVALID_RESPONSE", reservedUsage);
      }
      const parsedResponse = parsePlantNetResponse(upstream.body);
      if (!parsedResponse.ok) {
        return errorResponse(origin, "UPSTREAM_INVALID_RESPONSE", reservedUsage);
      }
      if (parsedResponse.value.length === 0) {
        return errorResponse(origin, "PLANT_NOT_IDENTIFIED", reservedUsage);
      }

      return jsonResponse(origin, 200, {
        candidates: parsedResponse.value,
        usage: reservedUsage,
      });
    } catch {
      return errorResponse(corsOrigin, "INTERNAL_ERROR", reservedUsage);
    }
  },
};
