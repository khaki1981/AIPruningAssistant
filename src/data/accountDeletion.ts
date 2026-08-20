import { FunctionsFetchError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

const serverFailureCodes = [
  "auth_deletion_failed",
  "database_cleanup_failed",
  "invalid_request",
  "method_not_allowed",
  "origin_not_allowed",
  "reauthentication_failed",
  "reauthentication_rate_limited",
  "reauthentication_unavailable",
  "storage_cleanup_failed",
  "storage_cleanup_incomplete",
  "unauthorized",
] as const;

type ServerFailureCode = (typeof serverFailureCodes)[number];

export type AccountDeletionFailureCode =
  | ServerFailureCode
  | "network_error"
  | "request_in_progress"
  | "unexpected_response";

export type AccountDeletionResult =
  | { ok: true; code: "account_deleted" }
  | { ok: false; code: AccountDeletionFailureCode };

const serverFailureCodeSet = new Set<string>(serverFailureCodes);

function readServerFailure(value: unknown): ServerFailureCode | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const response = value as { code?: unknown; ok?: unknown };
  return response.ok === false &&
    typeof response.code === "string" &&
    serverFailureCodeSet.has(response.code)
    ? (response.code as ServerFailureCode)
    : null;
}

function isSuccessfulDeletion(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const response = value as { code?: unknown; ok?: unknown };
  return (
    Object.keys(value).length === 2 &&
    response.ok === true &&
    response.code === "account_deleted"
  );
}

async function readFailureResponse(response?: Response) {
  if (!response) return null;

  try {
    return readServerFailure(await response.clone().json());
  } catch {
    return null;
  }
}

export async function deleteCurrentAccount(
  password: string,
): Promise<AccountDeletionResult> {
  if (!supabase) return { ok: false, code: "unexpected_response" };

  const { data, error, response } = await supabase.functions.invoke<unknown>(
    "delete-account",
    { body: { password } },
  );

  if (error) {
    const serverCode = await readFailureResponse(response);
    if (serverCode) return { ok: false, code: serverCode };
    if (error instanceof FunctionsFetchError) {
      return { ok: false, code: "network_error" };
    }
    return { ok: false, code: "unexpected_response" };
  }

  if (isSuccessfulDeletion(data)) {
    return { ok: true, code: "account_deleted" };
  }

  const serverCode = readServerFailure(data);
  return serverCode
    ? { ok: false, code: serverCode }
    : { ok: false, code: "unexpected_response" };
}
