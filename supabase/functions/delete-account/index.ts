import { createSupabaseContext } from "npm:@supabase/server@1.4.0";
import { createContextClient } from "npm:@supabase/server@1.4.0/core";
import {
  isAuthRetryableFetchError,
  type SupabaseClient,
} from "npm:@supabase/supabase-js@2.112.3";

const photoBucket = "plant-care-photos";
const storagePageSize = 1000;
const maximumStorageCleanupMilliseconds = 60_000;
const maximumStorageListOperations = 5000;
const maximumStorageObjectsRemoved = 10_000;
const maximumConsecutiveStaleStorageListings = 2;
const storageStaleRetryDelayMilliseconds = 100;
const maximumRequestBytes = 4096;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const photoFileNamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$/;

const defaultAllowedOrigins = new Set([
  "https://aipruningassistant.netlify.app",
  "http://localhost:5173",
]);

type AccountDeletionCode =
  | "account_deleted"
  | "auth_deletion_failed"
  | "database_cleanup_failed"
  | "invalid_request"
  | "method_not_allowed"
  | "origin_not_allowed"
  | "reauthentication_failed"
  | "reauthentication_rate_limited"
  | "reauthentication_unavailable"
  | "storage_cleanup_failed"
  | "storage_cleanup_incomplete"
  | "unauthorized";

type AccountDeletionResponse =
  | { code: "account_deleted"; ok: true }
  | { code: Exclude<AccountDeletionCode, "account_deleted">; ok: false };

type AccountDeletionFailureCode = Exclude<
  AccountDeletionCode,
  "account_deleted"
>;

type ValidatedStorageEntry = {
  kind: "file" | "folder";
  name: string;
};

type StorageCleanupBudget = {
  listOperations: number;
  removedObjects: number;
  startedAt: number;
};

class AccountDeletionStageError extends Error {
  constructor(readonly code: AccountDeletionFailureCode) {
    super(code);
    this.name = "AccountDeletionStageError";
  }
}

function getAllowedOrigins() {
  const allowedOrigins = new Set(defaultAllowedOrigins);
  const configuredOrigins = Deno.env.get("ACCOUNT_DELETE_ALLOWED_ORIGINS");

  for (const value of configuredOrigins?.split(",") ?? []) {
    const candidate = value.trim();
    if (!candidate || candidate === "*") continue;

    try {
      const parsed = new URL(candidate);
      if (
        (parsed.protocol === "https:" || parsed.protocol === "http:") &&
        parsed.origin === candidate
      ) {
        allowedOrigins.add(candidate);
      }
    } catch {
      // Ignore malformed configuration instead of broadening access.
    }
  }

  return allowedOrigins;
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function jsonResponse(
  origin: string | null,
  status: number,
  body: AccountDeletionResponse,
) {
  return Response.json(body, {
    status,
    headers: origin ? corsHeaders(origin) : { "Cache-Control": "no-store" },
  });
}

function errorResponse(
  origin: string | null,
  status: number,
  code: AccountDeletionFailureCode,
) {
  return jsonResponse(origin, status, { code, ok: false });
}

function isJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  return /^application\/json(?:\s*;|$)/i.test(contentType);
}

async function readPassword(request: Request) {
  const declaredLength = request.headers.get("content-length");
  if (
    declaredLength !== null &&
    (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maximumRequestBytes)
  ) {
    throw new AccountDeletionStageError("invalid_request");
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > maximumRequestBytes) {
    throw new AccountDeletionStageError("invalid_request");
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    throw new AccountDeletionStageError("invalid_request");
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new AccountDeletionStageError("invalid_request");
  }

  const keys = Object.keys(body);
  const password = (body as Record<string, unknown>).password;
  if (
    keys.length !== 1 ||
    keys[0] !== "password" ||
    typeof password !== "string" ||
    password.length === 0 ||
    new TextEncoder().encode(password).byteLength > 1024
  ) {
    throw new AccountDeletionStageError("invalid_request");
  }

  return password;
}

function isAuthUserNotFound(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const value = error as { code?: unknown; status?: unknown };
  return value.code === "user_not_found" && value.status === 404;
}

function classifyPasswordAuthError(error: unknown): AccountDeletionFailureCode {
  if (typeof error !== "object" || error === null) {
    return "reauthentication_unavailable";
  }

  const value = error as {
    code?: unknown;
    status?: unknown;
  };
  if (value.status === 429) return "reauthentication_rate_limited";
  if (
    value.status === 0 ||
    (typeof value.status === "number" && value.status >= 500) ||
    isAuthRetryableFetchError(error)
  ) {
    return "reauthentication_unavailable";
  }
  if (value.code === "invalid_credentials") {
    return "reauthentication_failed";
  }
  return "reauthentication_unavailable";
}

function classifyAuthServiceError(error: unknown): AccountDeletionFailureCode {
  if (
    typeof error === "object" &&
    error !== null &&
    (error as { status?: unknown }).status === 429
  ) {
    return "reauthentication_rate_limited";
  }
  return "reauthentication_unavailable";
}

async function verifyCurrentPassword(input: {
  email: string;
  password: string;
  userId: string;
}) {
  let reauthenticationClient: ReturnType<typeof createContextClient> | null =
    null;
  try {
    reauthenticationClient = createContextClient();
    const { data, error } = await reauthenticationClient.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) {
      throw new AccountDeletionStageError(classifyPasswordAuthError(error));
    }
    return data.user?.id === input.userId;
  } catch (error) {
    if (error instanceof AccountDeletionStageError) throw error;
    throw new AccountDeletionStageError("reauthentication_unavailable");
  } finally {
    // The client is non-persistent, but revoke the temporary server-side session
    // when one was created. Account deletion will revoke it if this call fails.
    await reauthenticationClient?.auth
      .signOut({ scope: "local" })
      .catch(() => undefined);
  }
}

function validateStorageName(name: unknown): name is string {
  return (
    typeof name === "string" &&
    name.length > 0 &&
    name !== "." &&
    name !== ".." &&
    !name.includes("/") &&
    !name.includes("\\")
  );
}

function validateListedStorageEntry(value: unknown): ValidatedStorageEntry | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const entry = value as Record<string, unknown>;
  if (!validateStorageName(entry.name)) return null;

  // Hosted Storage currently needs to be verified to return virtual folders
  // with both fields set to null. Any missing or different shape fails closed.
  if (entry.id === null && entry.metadata === null) {
    return { kind: "folder", name: entry.name };
  }
  if (
    typeof entry.id === "string" &&
    typeof entry.metadata === "object" &&
    entry.metadata !== null &&
    !Array.isArray(entry.metadata)
  ) {
    return { kind: "file", name: entry.name };
  }
  return null;
}

function ensureStorageCleanupBudget(budget: StorageCleanupBudget) {
  if (budget.listOperations >= maximumStorageListOperations) {
    throw new AccountDeletionStageError("storage_cleanup_incomplete");
  }
  ensureStorageCleanupTimeBudget(budget);
}

function ensureStorageCleanupTimeBudget(budget: StorageCleanupBudget) {
  if (Date.now() - budget.startedAt >= maximumStorageCleanupMilliseconds) {
    throw new AccountDeletionStageError("storage_cleanup_incomplete");
  }
}

async function waitForStorageRelist(budget: StorageCleanupBudget) {
  ensureStorageCleanupTimeBudget(budget);
  await new Promise((resolve) =>
    setTimeout(resolve, storageStaleRetryDelayMilliseconds),
  );
  ensureStorageCleanupTimeBudget(budget);
}

async function listDirectoryFromStart(
  adminClient: SupabaseClient,
  directory: string,
  budget: StorageCleanupBudget,
) {
  ensureStorageCleanupBudget(budget);
  budget.listOperations += 1;

  const { data, error } = await adminClient.storage
    .from(photoBucket)
    .list(directory, {
      limit: storagePageSize,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });
  ensureStorageCleanupTimeBudget(budget);

  if (error || !data) {
    throw new AccountDeletionStageError("storage_cleanup_failed");
  }

  const rawEntries: unknown = data;
  if (!Array.isArray(rawEntries)) {
    throw new AccountDeletionStageError("storage_cleanup_failed");
  }

  const entries: ValidatedStorageEntry[] = [];
  for (const value of rawEntries) {
    const entry = validateListedStorageEntry(value);
    if (!entry) {
      throw new AccountDeletionStageError("storage_cleanup_failed");
    }
    entries.push(entry);
  }
  return entries;
}

function validateExactPhotoPath(path: string, userId: string) {
  const parts = path.split("/");
  return (
    parts.length === 4 &&
    parts[0] === userId &&
    uuidPattern.test(parts[1]) &&
    uuidPattern.test(parts[2]) &&
    photoFileNamePattern.test(parts[3])
  );
}

function expectFolderEntry(entry: ValidatedStorageEntry) {
  if (entry.kind !== "folder" || !uuidPattern.test(entry.name)) {
    throw new AccountDeletionStageError("storage_cleanup_failed");
  }
  return entry.name;
}

async function removeRecordPhotos(
  adminClient: SupabaseClient,
  recordDirectory: string,
  userId: string,
  budget: StorageCleanupBudget,
) {
  let previousRemovedBatch = "";
  let consecutiveStaleListings = 0;
  let removedObjects = 0;

  while (true) {
    const photoEntries = await listDirectoryFromStart(
      adminClient,
      recordDirectory,
      budget,
    );
    if (photoEntries.length === 0) return removedObjects;

    const paths: string[] = [];
    for (const photoEntry of photoEntries) {
      if (
        photoEntry.kind !== "file" ||
        !photoFileNamePattern.test(photoEntry.name)
      ) {
        throw new AccountDeletionStageError("storage_cleanup_failed");
      }

      const path = `${recordDirectory}/${photoEntry.name}`;
      if (!validateExactPhotoPath(path, userId)) {
        throw new AccountDeletionStageError("storage_cleanup_failed");
      }
      paths.push(path);
    }

    const batchFingerprint = paths.join("\n");
    if (batchFingerprint === previousRemovedBatch) {
      consecutiveStaleListings += 1;
      if (
        consecutiveStaleListings > maximumConsecutiveStaleStorageListings
      ) {
        throw new AccountDeletionStageError("storage_cleanup_failed");
      }
      await waitForStorageRelist(budget);
      continue;
    }
    consecutiveStaleListings = 0;

    const remainingAllowance =
      maximumStorageObjectsRemoved - budget.removedObjects;
    if (remainingAllowance <= 0) {
      throw new AccountDeletionStageError("storage_cleanup_incomplete");
    }
    const pathsToRemove = paths.slice(0, remainingAllowance);
    ensureStorageCleanupTimeBudget(budget);
    const { error } = await adminClient.storage
      .from(photoBucket)
      .remove(pathsToRemove);
    ensureStorageCleanupTimeBudget(budget);
    if (error) {
      throw new AccountDeletionStageError("storage_cleanup_failed");
    }
    budget.removedObjects += pathsToRemove.length;
    removedObjects += pathsToRemove.length;
    previousRemovedBatch = batchFingerprint;

    if (pathsToRemove.length !== paths.length) {
      throw new AccountDeletionStageError("storage_cleanup_incomplete");
    }
  }
}

async function removePlantPhotos(
  adminClient: SupabaseClient,
  plantDirectory: string,
  userId: string,
  budget: StorageCleanupBudget,
) {
  let previousStagnantListing = "";
  let consecutiveStaleListings = 0;
  let removedObjects = 0;

  while (true) {
    const recordEntries = await listDirectoryFromStart(
      adminClient,
      plantDirectory,
      budget,
    );
    if (recordEntries.length === 0) return removedObjects;

    for (const entry of recordEntries) expectFolderEntry(entry);
    const recordId = expectFolderEntry(recordEntries[0]);
    const listingFingerprint = recordEntries
      .map((entry) => `${entry.kind}:${entry.name}`)
      .join("\n");
    const removedFromRecord = await removeRecordPhotos(
      adminClient,
      `${plantDirectory}/${recordId}`,
      userId,
      budget,
    );
    removedObjects += removedFromRecord;

    if (removedFromRecord > 0) {
      previousStagnantListing = "";
      consecutiveStaleListings = 0;
      continue;
    }

    consecutiveStaleListings =
      listingFingerprint === previousStagnantListing
        ? consecutiveStaleListings + 1
        : 1;
    previousStagnantListing = listingFingerprint;
    if (consecutiveStaleListings > maximumConsecutiveStaleStorageListings) {
      throw new AccountDeletionStageError("storage_cleanup_failed");
    }
    await waitForStorageRelist(budget);
  }
}

async function removeUserPhotos(
  adminClient: SupabaseClient,
  userId: string,
) {
  const budget: StorageCleanupBudget = {
    listOperations: 0,
    removedObjects: 0,
    startedAt: Date.now(),
  };
  let previousStagnantListing = "";
  let consecutiveStaleListings = 0;

  while (true) {
    const plantEntries = await listDirectoryFromStart(
      adminClient,
      userId,
      budget,
    );
    if (plantEntries.length === 0) {
      ensureStorageCleanupTimeBudget(budget);
      return budget;
    }

    for (const entry of plantEntries) expectFolderEntry(entry);
    const plantId = expectFolderEntry(plantEntries[0]);
    const listingFingerprint = plantEntries
      .map((entry) => `${entry.kind}:${entry.name}`)
      .join("\n");
    const removedFromPlant = await removePlantPhotos(
      adminClient,
      `${userId}/${plantId}`,
      userId,
      budget,
    );

    if (removedFromPlant > 0) {
      previousStagnantListing = "";
      consecutiveStaleListings = 0;
      continue;
    }

    consecutiveStaleListings =
      listingFingerprint === previousStagnantListing
        ? consecutiveStaleListings + 1
        : 1;
    previousStagnantListing = listingFingerprint;
    if (consecutiveStaleListings > maximumConsecutiveStaleStorageListings) {
      throw new AccountDeletionStageError("storage_cleanup_failed");
    }
    await waitForStorageRelist(budget);
  }
}

function logStageFailure(code: AccountDeletionFailureCode) {
  console.error("[delete-account] Request failed", { code });
}

export default {
  async fetch(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !getAllowedOrigins().has(origin)) {
      return errorResponse(null, 403, "origin_not_allowed");
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return errorResponse(origin, 405, "method_not_allowed");
    }
    if (!isJsonContentType(request)) {
      return errorResponse(origin, 400, "invalid_request");
    }

    const { data: context, error: authenticationError } =
      await createSupabaseContext(request, { auth: "user" });
    if (authenticationError || !context) {
      return errorResponse(origin, 401, "unauthorized");
    }

    const userId = context.jwtClaims?.sub;
    if (typeof userId !== "string" || !uuidPattern.test(userId)) {
      return errorResponse(origin, 401, "unauthorized");
    }

    let password: string;
    try {
      password = await readPassword(request);
    } catch {
      return errorResponse(origin, 400, "invalid_request");
    }

    try {
      let authLookupResult: Awaited<
        ReturnType<typeof context.supabaseAdmin.auth.admin.getUserById>
      >;
      try {
        authLookupResult =
          await context.supabaseAdmin.auth.admin.getUserById(userId);
      } catch {
        throw new AccountDeletionStageError("reauthentication_unavailable");
      }
      const { data: authData, error: authLookupError } = authLookupResult;
      const authUserAlreadyDeleted = isAuthUserNotFound(authLookupError);

      if (authLookupError && !authUserAlreadyDeleted) {
        throw new AccountDeletionStageError(
          classifyAuthServiceError(authLookupError),
        );
      }

      if (!authUserAlreadyDeleted) {
        const email = authData?.user?.email;
        if (
          typeof email !== "string" ||
          !(await verifyCurrentPassword({ email, password, userId }))
        ) {
          throw new AccountDeletionStageError("reauthentication_failed");
        }
      }

      password = "";
      const storageBudget = await removeUserPhotos(
        context.supabaseAdmin,
        userId,
      );
      ensureStorageCleanupTimeBudget(storageBudget);

      const { error: databaseError } = await context.supabaseAdmin.rpc(
        "delete_account_application_data",
        { p_user_id: userId },
      );
      if (databaseError) {
        throw new AccountDeletionStageError("database_cleanup_failed");
      }

      if (!authUserAlreadyDeleted) {
        const { error: deletionError } =
          await context.supabaseAdmin.auth.admin.deleteUser(userId, false);
        if (deletionError && !isAuthUserNotFound(deletionError)) {
          throw new AccountDeletionStageError("auth_deletion_failed");
        }
      }

      return jsonResponse(origin, 200, { code: "account_deleted", ok: true });
    } catch (error) {
      password = "";
      const code =
        error instanceof AccountDeletionStageError
          ? error.code
          : "auth_deletion_failed";
      logStageFailure(code);

      const status =
        code === "reauthentication_rate_limited"
          ? 429
          : code === "reauthentication_failed"
            ? 401
            : code === "reauthentication_unavailable"
              ? 503
              : code === "storage_cleanup_failed" ||
                  code === "storage_cleanup_incomplete"
                ? 503
                : 500;
      return errorResponse(origin, status, code);
    }
  },
};
