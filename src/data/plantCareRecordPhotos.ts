import { supabase } from "../lib/supabase";
import type { CompressedPlantPhoto } from "../lib/plantPhotoCompression";
import type { PlantCareRecordPhoto } from "../types/plantCareRecordPhoto";

export const plantCarePhotoBucket = "plant-care-photos";
export const plantCarePhotoSignedUrlExpiresIn = 15 * 60;

const maxStoredPhotoSize = 5 * 1024 * 1024;
const maxStoredPhotoDimension = 1600;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const photoFileNamePattern = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(webp|jpg)$/;

type PlantCareRecordPhotoRow = {
  created_at: string;
  height: number;
  id: string;
  mime_type: "image/jpeg" | "image/webp";
  plant_care_record_id: string;
  size_bytes: number;
  storage_path: string;
  user_id: string;
  user_plant_id: string;
  width: number;
};

type PhotoIdentity = {
  photo: CompressedPlantPhoto;
  recordId: string;
  storagePath: string;
  userId: string;
  userPlantId: string;
};

type MetadataCheckResult =
  | { status: "found"; photo: PlantCareRecordPhoto }
  | { status: "not_found" }
  | { status: "unknown" };

type StorageCheckResult = "exists" | "not_found" | "unknown";

export type SavePlantCareRecordPhotoResult = {
  cleanupFailed: boolean;
  status: "saved" | "failed" | "unknown" | "conflict";
};

export type PlantCareRecordPhotoSignedUrlResult = {
  photo: PlantCareRecordPhoto;
  signedUrl: string | null;
};

export type ReplacePlantCareRecordPhotoResult = {
  cleanupFailed: boolean;
  photo?: PlantCareRecordPhoto;
  previousStoragePath?: string;
  status: "saved" | "failed" | "unknown" | "conflict";
};

export type DeletePlantCareRecordPhotoResult = {
  status: "deleted" | "failed" | "unknown" | "conflict";
};

export type CleanupPreviousPlantCareRecordPhotoResult = {
  status: "cleaned" | "failed" | "unknown" | "conflict";
};

const photoColumns =
  "id, user_id, user_plant_id, plant_care_record_id, storage_path, mime_type, size_bytes, width, height, created_at";

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "写真を保存できませんでした。通信状態を確認し、時間をおいてもう一度お試しください。",
    );
  }
  return supabase;
}

function toPlantCareRecordPhoto(
  row: PlantCareRecordPhotoRow,
): PlantCareRecordPhoto {
  return {
    createdAt: row.created_at,
    height: row.height,
    id: row.id,
    mimeType: row.mime_type,
    plantCareRecordId: row.plant_care_record_id,
    sizeBytes: row.size_bytes,
    storagePath: row.storage_path,
    userId: row.user_id,
    userPlantId: row.user_plant_id,
    width: row.width,
  };
}

function validateUuid(value: string) {
  return uuidPattern.test(value);
}

function getExpectedExtension(mimeType: string) {
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/jpeg") return "jpg";
  return null;
}

export function validateCompressedPlantCarePhoto(
  photo: CompressedPlantPhoto,
) {
  const expectedExtension = getExpectedExtension(photo.outputMimeType);
  const fileNameMatch = photoFileNamePattern.exec(photo.file.name);
  if (
    !expectedExtension ||
    !fileNameMatch ||
    fileNameMatch[2] !== expectedExtension ||
    photo.outputFileName !== photo.file.name ||
    photo.file.type !== photo.outputMimeType ||
    photo.file.size !== photo.compressedSize ||
    photo.file.size < 1 ||
    photo.file.size > maxStoredPhotoSize ||
    !Number.isInteger(photo.compressedWidth) ||
    !Number.isInteger(photo.compressedHeight) ||
    photo.compressedWidth < 1 ||
    photo.compressedHeight < 1 ||
    photo.compressedWidth > maxStoredPhotoDimension ||
    photo.compressedHeight > maxStoredPhotoDimension
  ) {
    throw new Error(
      "圧縮済み写真を保存できません。別の写真を選択してください。",
    );
  }
}

function buildStoragePath(input: {
  fileName: string;
  recordId: string;
  userId: string;
  userPlantId: string;
}) {
  if (
    !validateUuid(input.userId) ||
    !validateUuid(input.userPlantId) ||
    !validateUuid(input.recordId) ||
    !photoFileNamePattern.test(input.fileName)
  ) {
    throw new Error(
      "写真を保存できませんでした。対象の記録を確認してください。",
    );
  }

  return `${input.userId}/${input.userPlantId}/${input.recordId}/${input.fileName}`;
}

function isExpectedStoragePath(input: {
  path: string;
  recordId: string;
  userId: string;
  userPlantId: string;
}) {
  const parts = input.path.split("/");
  return (
    parts.length === 4 &&
    parts[0] === input.userId &&
    parts[1] === input.userPlantId &&
    parts[2] === input.recordId &&
    photoFileNamePattern.test(parts[3])
  );
}

function isPhotoInExpectedScope(
  photo: PlantCareRecordPhoto,
  input: { userId: string; userPlantId: string },
) {
  return (
    photo.userId === input.userId &&
    photo.userPlantId === input.userPlantId &&
    isExpectedStoragePath({
      path: photo.storagePath,
      recordId: photo.plantCareRecordId,
      userId: input.userId,
      userPlantId: input.userPlantId,
    })
  );
}

function getStorageErrorField(error: unknown, field: string) {
  if (typeof error !== "object" || error === null || !(field in error)) {
    return undefined;
  }
  return (error as Record<string, unknown>)[field];
}

function getStorageErrorCode(error: unknown) {
  const code = getStorageErrorField(error, "code");
  if (typeof code === "string") return code;
  const statusCode = getStorageErrorField(error, "statusCode");
  return typeof statusCode === "string" ? statusCode : undefined;
}

function isStorageNotFoundError(error: unknown) {
  const status = getStorageErrorField(error, "status");
  const statusCode = getStorageErrorField(error, "statusCode");
  const code = getStorageErrorField(error, "code");
  return (
    status === 404 ||
    statusCode === 404 ||
    statusCode === "404" ||
    statusCode === "NoSuchKey" ||
    statusCode === "not_found" ||
    statusCode === "NotFound" ||
    code === 404 ||
    code === "404" ||
    code === "NoSuchKey" ||
    code === "not_found" ||
    code === "NotFound"
  );
}

function isExactExistsNotFoundError(error: unknown) {
  const notFoundValues = new Set<unknown>([
    400,
    "400",
    404,
    "404",
    "NoSuchKey",
    "not_found",
    "NotFound",
  ]);
  return (
    notFoundValues.has(getStorageErrorField(error, "status")) ||
    notFoundValues.has(getStorageErrorField(error, "statusCode")) ||
    notFoundValues.has(getStorageErrorField(error, "code"))
  );
}

async function checkStoragePath(path: string): Promise<StorageCheckResult> {
  const client = requireSupabase();
  const { data, error } = await client.storage
    .from(plantCarePhotoBucket)
    .exists(path);

  if (!error) {
    return data ? "exists" : "not_found";
  }
  if (data === false && isExactExistsNotFoundError(error)) {
    return "not_found";
  }

  console.error("[plant-care-record-photos] Storage existence check failed", {
    code: getStorageErrorCode(error),
  });
  return "unknown";
}

async function removeExactStoragePath(path: string) {
  const existence = await checkStoragePath(path);
  if (existence === "unknown") return false;

  // Even after an exists() not-found response, verify deletion permission and
  // the final state with remove(). This prevents an ambiguous 400 response
  // from allowing the database record to be deleted without Storage access.
  const client = requireSupabase();
  const { error } = await client.storage
    .from(plantCarePhotoBucket)
    .remove([path]);

  if (!error || isStorageNotFoundError(error)) return true;

  console.error("[plant-care-record-photos] Storage cleanup failed", {
    code: getStorageErrorCode(error),
  });
  return false;
}

async function checkPlantCareRecordPhoto(input: {
  recordId: string;
  userId: string;
  userPlantId: string;
}): Promise<MetadataCheckResult> {
  if (
    !validateUuid(input.recordId) ||
    !validateUuid(input.userId) ||
    !validateUuid(input.userPlantId)
  ) {
    return { status: "not_found" };
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("plant_care_record_photos")
    .select(photoColumns)
    .eq("plant_care_record_id", input.recordId)
    .eq("user_plant_id", input.userPlantId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    console.error("[plant-care-record-photos] Metadata fetch failed", {
      code: error.code,
    });
    return { status: "unknown" };
  }

  return data
    ? {
        status: "found",
        photo: toPlantCareRecordPhoto(data as PlantCareRecordPhotoRow),
      }
    : { status: "not_found" };
}

export async function getPlantCareRecordPhoto(input: {
  recordId: string;
  userId: string;
  userPlantId: string;
}): Promise<PlantCareRecordPhoto | null> {
  const result = await checkPlantCareRecordPhoto(input);
  if (result.status === "unknown") {
    throw new Error(
      "写真情報を確認できませんでした。通信状態を確認し、もう一度お試しください。",
    );
  }
  return result.status === "found" ? result.photo : null;
}

export async function listPlantCareRecordPhotos(input: {
  userId: string;
  userPlantId: string;
}): Promise<PlantCareRecordPhoto[]> {
  if (!validateUuid(input.userId) || !validateUuid(input.userPlantId)) {
    return [];
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("plant_care_record_photos")
    .select(photoColumns)
    .eq("user_plant_id", input.userPlantId)
    .eq("user_id", input.userId);

  if (error) {
    console.error("[plant-care-record-photos] Metadata list failed", {
      code: error.code,
    });
    throw new Error(
      "保存済み写真を確認できませんでした。通信状態を確認し、もう一度お試しください。",
    );
  }

  const photos = (data as PlantCareRecordPhotoRow[]).map(toPlantCareRecordPhoto);
  if (photos.some((photo) => !isPhotoInExpectedScope(photo, input))) {
    console.error("[plant-care-record-photos] Refused unexpected photo metadata");
    throw new Error(
      "保存済み写真を安全に表示できませんでした。時間をおいてもう一度お試しください。",
    );
  }
  return photos;
}

export async function createPlantCareRecordPhotoSignedUrl(input: {
  photo: PlantCareRecordPhoto;
  userId: string;
  userPlantId: string;
}): Promise<string> {
  if (!isPhotoInExpectedScope(input.photo, input)) {
    throw new Error(
      "保存済み写真を安全に表示できませんでした。時間をおいてもう一度お試しください。",
    );
  }

  const client = requireSupabase();
  const { data, error } = await client.storage
    .from(plantCarePhotoBucket)
    .createSignedUrl(
      input.photo.storagePath,
      plantCarePhotoSignedUrlExpiresIn,
    );

  if (error || !data?.signedUrl) {
    console.error("[plant-care-record-photos] Signed URL creation failed", {
      code: getStorageErrorCode(error),
    });
    throw new Error(
      "保存済み写真を表示できませんでした。通信状態を確認し、もう一度お試しください。",
    );
  }
  return data.signedUrl;
}

export async function createPlantCareRecordPhotoSignedUrls(input: {
  photos: PlantCareRecordPhoto[];
  userId: string;
  userPlantId: string;
}): Promise<PlantCareRecordPhotoSignedUrlResult[]> {
  if (input.photos.length === 0) return [];
  if (input.photos.some((photo) => !isPhotoInExpectedScope(photo, input))) {
    throw new Error(
      "保存済み写真を安全に表示できませんでした。時間をおいてもう一度お試しください。",
    );
  }

  const client = requireSupabase();
  const { data, error } = await client.storage
    .from(plantCarePhotoBucket)
    .createSignedUrls(
      input.photos.map((photo) => photo.storagePath),
      plantCarePhotoSignedUrlExpiresIn,
    );

  if (error || !data) {
    console.error("[plant-care-record-photos] Signed URL batch failed", {
      code: getStorageErrorCode(error),
    });
    throw new Error(
      "保存済み写真を表示できませんでした。通信状態を確認し、もう一度お試しください。",
    );
  }

  const signedUrlsByPath = new Map(
    data.map((item) => [
      item.path,
      item.error === null && item.signedUrl ? item.signedUrl : null,
    ]),
  );
  return input.photos.map((photo) => ({
    photo,
    signedUrl: signedUrlsByPath.get(photo.storagePath) ?? null,
  }));
}

function photoMetadataMatches(
  storedPhoto: PlantCareRecordPhoto,
  expected: PhotoIdentity,
) {
  return (
    storedPhoto.plantCareRecordId === expected.recordId &&
    storedPhoto.userPlantId === expected.userPlantId &&
    storedPhoto.userId === expected.userId &&
    storedPhoto.storagePath === expected.storagePath &&
    storedPhoto.mimeType === expected.photo.outputMimeType &&
    storedPhoto.sizeBytes === expected.photo.file.size &&
    storedPhoto.width === expected.photo.compressedWidth &&
    storedPhoto.height === expected.photo.compressedHeight
  );
}

function plantCareRecordPhotosMatch(
  left: PlantCareRecordPhoto,
  right: PlantCareRecordPhoto,
) {
  return (
    left.id === right.id &&
    left.plantCareRecordId === right.plantCareRecordId &&
    left.userPlantId === right.userPlantId &&
    left.userId === right.userId &&
    left.storagePath === right.storagePath &&
    left.mimeType === right.mimeType &&
    left.sizeBytes === right.sizeBytes &&
    left.width === right.width &&
    left.height === right.height &&
    left.createdAt === right.createdAt
  );
}

async function uploadMissingStorageFile(expected: PhotoIdentity) {
  const client = requireSupabase();
  const { error } = await client.storage
    .from(plantCarePhotoBucket)
    .upload(expected.storagePath, expected.photo.file, {
      cacheControl: "3600",
      contentType: expected.photo.outputMimeType,
      upsert: false,
    });

  if (!error) return "exists" as const;

  console.error("[plant-care-record-photos] Storage upload failed", {
    code: getStorageErrorCode(error),
  });
  return checkStoragePath(expected.storagePath);
}

async function insertAndConfirmPhotoMetadata(
  expected: PhotoIdentity,
): Promise<SavePlantCareRecordPhotoResult> {
  const client = requireSupabase();
  const { error } = await client
    .from("plant_care_record_photos")
    .insert({
      user_id: expected.userId,
      user_plant_id: expected.userPlantId,
      plant_care_record_id: expected.recordId,
      storage_path: expected.storagePath,
      mime_type: expected.photo.outputMimeType,
      size_bytes: expected.photo.file.size,
      width: expected.photo.compressedWidth,
      height: expected.photo.compressedHeight,
    });

  if (error) {
    console.error("[plant-care-record-photos] Metadata insert failed", {
      code: error.code,
    });
  }

  const confirmation = await checkPlantCareRecordPhoto(expected);
  if (confirmation.status === "unknown") {
    return { status: "unknown", cleanupFailed: false };
  }
  if (confirmation.status === "found") {
    return {
      status: photoMetadataMatches(confirmation.photo, expected)
        ? "saved"
        : "conflict",
      cleanupFailed: false,
    };
  }

  // Delete only after a successful query has confirmed that no metadata row exists.
  const wasCleaned = await removeExactStoragePath(expected.storagePath);
  return { status: "failed", cleanupFailed: !wasCleaned };
}

export async function savePlantCareRecordPhoto(input: {
  photo: CompressedPlantPhoto;
  recordId: string;
  userId: string;
  userPlantId: string;
}): Promise<SavePlantCareRecordPhotoResult> {
  validateCompressedPlantCarePhoto(input.photo);
  const expected: PhotoIdentity = {
    ...input,
    storagePath: buildStoragePath({
      fileName: input.photo.file.name,
      recordId: input.recordId,
      userId: input.userId,
      userPlantId: input.userPlantId,
    }),
  };

  const metadata = await checkPlantCareRecordPhoto(input);
  if (metadata.status === "unknown") {
    return { status: "unknown", cleanupFailed: false };
  }
  if (
    metadata.status === "found" &&
    !photoMetadataMatches(metadata.photo, expected)
  ) {
    return { status: "conflict", cleanupFailed: false };
  }

  const storage = await checkStoragePath(expected.storagePath);
  if (storage === "unknown") {
    return { status: "unknown", cleanupFailed: false };
  }

  if (metadata.status === "found") {
    if (storage === "exists") {
      return { status: "saved", cleanupFailed: false };
    }

    const uploadResult = await uploadMissingStorageFile(expected);
    return {
      status:
        uploadResult === "exists"
          ? "saved"
          : uploadResult === "unknown"
            ? "unknown"
            : "failed",
      cleanupFailed: false,
    };
  }

  if (storage === "not_found") {
    const uploadResult = await uploadMissingStorageFile(expected);
    if (uploadResult !== "exists") {
      return {
        status: uploadResult === "unknown" ? "unknown" : "failed",
        cleanupFailed: false,
      };
    }
  }

  // Reuse an exact-path orphan when it exists; otherwise use the new upload.
  return insertAndConfirmPhotoMetadata(expected);
}

async function ensureExpectedStorageFile(expected: PhotoIdentity) {
  const storage = await checkStoragePath(expected.storagePath);
  if (storage === "unknown") return "unknown" as const;
  if (storage === "exists") return "exists" as const;
  return uploadMissingStorageFile(expected);
}

export async function replacePlantCareRecordPhoto(input: {
  currentPhoto: PlantCareRecordPhoto;
  photo: CompressedPlantPhoto;
  recordId: string;
  userId: string;
  userPlantId: string;
}): Promise<ReplacePlantCareRecordPhotoResult> {
  validateCompressedPlantCarePhoto(input.photo);
  if (
    input.currentPhoto.plantCareRecordId !== input.recordId ||
    !isPhotoInExpectedScope(input.currentPhoto, input)
  ) {
    return { status: "conflict", cleanupFailed: false };
  }

  const expected: PhotoIdentity = {
    photo: input.photo,
    recordId: input.recordId,
    userId: input.userId,
    userPlantId: input.userPlantId,
    storagePath: buildStoragePath({
      fileName: input.photo.file.name,
      recordId: input.recordId,
      userId: input.userId,
      userPlantId: input.userPlantId,
    }),
  };
  if (expected.storagePath === input.currentPhoto.storagePath) {
    return { status: "conflict", cleanupFailed: false };
  }

  const beforeUpdate = await checkPlantCareRecordPhoto(input);
  if (beforeUpdate.status === "unknown") {
    return { status: "unknown", cleanupFailed: false };
  }
  if (beforeUpdate.status === "not_found") {
    return { status: "conflict", cleanupFailed: false };
  }

  if (photoMetadataMatches(beforeUpdate.photo, expected)) {
    const storage = await ensureExpectedStorageFile(expected);
    if (storage !== "exists") {
      return {
        status: storage === "unknown" ? "unknown" : "failed",
        cleanupFailed: false,
      };
    }
    return {
      status: "saved",
      cleanupFailed: false,
      photo: beforeUpdate.photo,
      previousStoragePath: input.currentPhoto.storagePath,
    };
  }

  if (!plantCareRecordPhotosMatch(beforeUpdate.photo, input.currentPhoto)) {
    return { status: "conflict", cleanupFailed: false };
  }

  const storage = await ensureExpectedStorageFile(expected);
  if (storage !== "exists") {
    return {
      status: storage === "unknown" ? "unknown" : "failed",
      cleanupFailed: false,
    };
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("plant_care_record_photos")
    .update({
      storage_path: expected.storagePath,
      mime_type: expected.photo.outputMimeType,
      size_bytes: expected.photo.file.size,
      width: expected.photo.compressedWidth,
      height: expected.photo.compressedHeight,
    })
    .eq("id", input.currentPhoto.id)
    .eq("plant_care_record_id", input.recordId)
    .eq("user_plant_id", input.userPlantId)
    .eq("user_id", input.userId)
    .eq("storage_path", input.currentPhoto.storagePath)
    .select(photoColumns)
    .maybeSingle();

  if (error) {
    console.error("[plant-care-record-photos] Metadata update failed", {
      code: error.code,
    });
  }

  if (data) {
    const updatedPhoto = toPlantCareRecordPhoto(data as PlantCareRecordPhotoRow);
    if (photoMetadataMatches(updatedPhoto, expected)) {
      return {
        status: "saved",
        cleanupFailed: false,
        photo: updatedPhoto,
        previousStoragePath: input.currentPhoto.storagePath,
      };
    }
  }

  const confirmation = await checkPlantCareRecordPhoto(input);
  if (confirmation.status === "unknown") {
    return { status: "unknown", cleanupFailed: false };
  }
  if (
    confirmation.status === "found" &&
    photoMetadataMatches(confirmation.photo, expected)
  ) {
    return {
      status: "saved",
      cleanupFailed: false,
      photo: confirmation.photo,
      previousStoragePath: input.currentPhoto.storagePath,
    };
  }
  if (
    confirmation.status === "found" &&
    plantCareRecordPhotosMatch(confirmation.photo, input.currentPhoto)
  ) {
    const wasCleaned = await removeExactStoragePath(expected.storagePath);
    return { status: "failed", cleanupFailed: !wasCleaned };
  }
  return { status: "conflict", cleanupFailed: false };
}

export async function cleanupPreviousPlantCareRecordPhotoFile(input: {
  currentPhoto: PlantCareRecordPhoto;
  previousStoragePath: string;
  recordId: string;
  userId: string;
  userPlantId: string;
}): Promise<CleanupPreviousPlantCareRecordPhotoResult> {
  if (
    input.currentPhoto.plantCareRecordId !== input.recordId ||
    input.currentPhoto.storagePath === input.previousStoragePath ||
    !isPhotoInExpectedScope(input.currentPhoto, input) ||
    !isExpectedStoragePath({
      path: input.previousStoragePath,
      recordId: input.recordId,
      userId: input.userId,
      userPlantId: input.userPlantId,
    })
  ) {
    return { status: "conflict" };
  }

  const current = await checkPlantCareRecordPhoto(input);
  if (current.status === "unknown") return { status: "unknown" };
  if (
    current.status === "not_found" ||
    !plantCareRecordPhotosMatch(current.photo, input.currentPhoto)
  ) {
    return { status: "conflict" };
  }

  return {
    status: (await removeExactStoragePath(input.previousStoragePath))
      ? "cleaned"
      : "failed",
  };
}

export async function deletePlantCareRecordPhoto(input: {
  expectedPhoto: PlantCareRecordPhoto;
  recordId: string;
  userId: string;
  userPlantId: string;
}): Promise<DeletePlantCareRecordPhotoResult> {
  if (
    input.expectedPhoto.plantCareRecordId !== input.recordId ||
    !isPhotoInExpectedScope(input.expectedPhoto, input)
  ) {
    return { status: "conflict" };
  }

  const latest = await checkPlantCareRecordPhoto(input);
  if (latest.status === "unknown") return { status: "unknown" };
  if (latest.status === "not_found") return { status: "deleted" };
  if (!plantCareRecordPhotosMatch(latest.photo, input.expectedPhoto)) {
    return { status: "conflict" };
  }

  if (!(await removeExactStoragePath(latest.photo.storagePath))) {
    return { status: "failed" };
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("plant_care_record_photos")
    .delete()
    .eq("id", latest.photo.id)
    .eq("plant_care_record_id", input.recordId)
    .eq("user_plant_id", input.userPlantId)
    .eq("user_id", input.userId)
    .eq("storage_path", latest.photo.storagePath)
    .select("id");

  if (error) {
    console.error("[plant-care-record-photos] Metadata delete failed", {
      code: error.code,
    });
  }
  if (data && data.length > 0) return { status: "deleted" };

  const confirmation = await checkPlantCareRecordPhoto(input);
  if (confirmation.status === "unknown") return { status: "unknown" };
  if (confirmation.status === "not_found") return { status: "deleted" };
  return {
    status: plantCareRecordPhotosMatch(confirmation.photo, latest.photo)
      ? "failed"
      : "conflict",
  };
}

export async function deletePlantCareRecordPhotoFile(input: {
  recordId: string;
  userId: string;
  userPlantId: string;
}): Promise<void> {
  const photo = await getPlantCareRecordPhoto(input);
  if (!photo) return;

  if (
    !isExpectedStoragePath({
      path: photo.storagePath,
      recordId: input.recordId,
      userId: input.userId,
      userPlantId: input.userPlantId,
    })
  ) {
    console.error("[plant-care-record-photos] Refused unexpected storage path");
    throw new Error(
      "写真を安全に削除できないため、記録は削除されませんでした。時間をおいてもう一度お試しください。",
    );
  }

  const wasDeleted = await removeExactStoragePath(photo.storagePath);
  if (!wasDeleted) {
    throw new Error(
      "写真を削除できないため、記録は削除されませんでした。通信状態を確認し、もう一度お試しください。",
    );
  }
}
