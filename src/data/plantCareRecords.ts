import { supabase } from "../lib/supabase";
import { deletePlantCareRecordPhotoFile } from "./plantCareRecordPhotos";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const plantConditionOptions = [
  { code: "healthy", label: "元気" },
  { code: "new_growth", label: "新芽・新しい成長あり" },
  { code: "leaf_discoloration", label: "葉の変色" },
  { code: "wilting", label: "しおれている" },
  { code: "pest_damage", label: "害虫の被害" },
  { code: "disease_sign", label: "病気の兆候" },
  { code: "other", label: "その他" },
] as const;

export const plantCareWorkOptions = [
  { code: "watering", label: "水やり" },
  { code: "fertilizing", label: "肥料" },
  { code: "pruning", label: "剪定" },
  { code: "repotting", label: "植え替え" },
  { code: "pest_control", label: "害虫対策" },
  { code: "observation", label: "観察のみ" },
  { code: "other", label: "その他" },
] as const;

export type PlantConditionCode = (typeof plantConditionOptions)[number]["code"];
export type PlantCareWorkCode = (typeof plantCareWorkOptions)[number]["code"];

export interface PlantCareRecord {
  conditionOther: string | null;
  createdAt: string;
  id: string;
  memo: string | null;
  plantCondition: string;
  recordDate: string;
  workOther: string | null;
  workTypes: string[];
}

type PlantCareRecordRow = {
  condition_other: string | null;
  created_at: string;
  id: string;
  memo: string | null;
  plant_condition: string;
  record_date: string;
  work_other: string | null;
  work_types: string[];
};

type PlantCareRecordVerificationRow = {
  condition_other: string | null;
  id: string;
  memo: string | null;
  plant_condition: string;
  record_date: string;
  user_id: string;
  user_plant_id: string;
  work_other: string | null;
  work_types: string[];
};

const plantCareRecordColumns =
  "id, record_date, plant_condition, condition_other, work_types, work_other, memo, created_at";

export interface CreatePlantCareRecordInput {
  conditionOther: string | null;
  memo: string | null;
  plantCondition: string;
  recordId: string;
  recordDate: string;
  userId: string;
  userPlantId: string;
  workOther: string | null;
  workTypes: string[];
}

export type UpdatePlantCareRecordInput = CreatePlantCareRecordInput;

export type CreatePlantCareRecordResult =
  | { recordId: string; status: "saved" }
  | { recordId: string; status: "not_found" | "unknown" | "conflict" };

function toPlantCareRecord(row: PlantCareRecordRow): PlantCareRecord {
  return {
    conditionOther: row.condition_other,
    createdAt: row.created_at,
    id: row.id,
    memo: row.memo,
    plantCondition: row.plant_condition,
    recordDate: row.record_date,
    workOther: row.work_other,
    workTypes: row.work_types,
  };
}

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabaseの接続設定がありません。環境変数を確認してください。",
    );
  }
  return supabase;
}

export async function createPlantCareRecord(
  input: CreatePlantCareRecordInput,
): Promise<CreatePlantCareRecordResult> {
  const client = requireSupabase();
  if (!uuidPattern.test(input.recordId)) {
    return { recordId: input.recordId, status: "conflict" };
  }

  const { data, error } = await client
    .from("plant_care_records")
    .insert({
      id: input.recordId,
      user_plant_id: input.userPlantId,
      user_id: input.userId,
      record_date: input.recordDate,
      plant_condition: input.plantCondition,
      condition_other: input.conditionOther,
      work_types: input.workTypes,
      work_other: input.workOther,
      memo: input.memo,
    })
    .select("id")
    .single();

  if (!error && data?.id === input.recordId) {
    return { recordId: input.recordId, status: "saved" };
  }

  if (error) {
    console.error("[plant-care-records] Insert failed", { code: error.code });
  } else {
    console.error("[plant-care-records] Insert returned an unexpected ID");
  }

  const { data: existingRecord, error: verificationError } = await client
    .from("plant_care_records")
    .select(
      "id, user_plant_id, user_id, record_date, plant_condition, condition_other, work_types, work_other, memo",
    )
    .eq("id", input.recordId)
    .eq("user_plant_id", input.userPlantId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (verificationError) {
    console.error("[plant-care-records] Insert verification failed", {
      code: verificationError.code,
    });
    return { recordId: input.recordId, status: "unknown" };
  }
  if (!existingRecord) {
    return { recordId: input.recordId, status: "not_found" };
  }

  const row = existingRecord as PlantCareRecordVerificationRow;
  const workTypesMatch =
    row.work_types.length === input.workTypes.length &&
    row.work_types.every((value, index) => value === input.workTypes[index]);
  const recordMatches =
    row.id === input.recordId &&
    row.user_id === input.userId &&
    row.user_plant_id === input.userPlantId &&
    row.record_date === input.recordDate &&
    row.plant_condition === input.plantCondition &&
    row.condition_other === input.conditionOther &&
    workTypesMatch &&
    row.work_other === input.workOther &&
    row.memo === input.memo;

  return {
    recordId: input.recordId,
    status: recordMatches ? "saved" : "conflict",
  };
}

export async function listPlantCareRecords(input: {
  userId: string;
  userPlantId: string;
}): Promise<PlantCareRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("plant_care_records")
    .select(plantCareRecordColumns)
    .eq("user_plant_id", input.userPlantId)
    .eq("user_id", input.userId)
    .order("record_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[plant-care-records] Fetch failed", { code: error.code });
    throw new Error(
      "過去の記録を取得できませんでした。通信状態を確認して、もう一度お試しください。",
    );
  }

  return (data as PlantCareRecordRow[]).map(toPlantCareRecord);
}

export async function getPlantCareRecord(input: {
  recordId: string;
  userId: string;
  userPlantId: string;
}): Promise<PlantCareRecord | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("plant_care_records")
    .select(plantCareRecordColumns)
    .eq("id", input.recordId)
    .eq("user_plant_id", input.userPlantId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    console.error("[plant-care-records] Fetch by ID failed", { code: error.code });
    throw new Error(
      "記録を取得できませんでした。通信状態を確認して、もう一度お試しください。",
    );
  }

  return data ? toPlantCareRecord(data as PlantCareRecordRow) : null;
}

export async function updatePlantCareRecord(
  input: UpdatePlantCareRecordInput,
): Promise<boolean> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("plant_care_records")
    .update({
      record_date: input.recordDate,
      plant_condition: input.plantCondition,
      condition_other: input.conditionOther,
      work_types: input.workTypes,
      work_other: input.workOther,
      memo: input.memo,
    })
    .eq("id", input.recordId)
    .eq("user_plant_id", input.userPlantId)
    .eq("user_id", input.userId)
    .select("id");

  if (error) {
    console.error("[plant-care-records] Update failed", { code: error.code });
    throw new Error(
      "記録を更新できませんでした。通信状態を確認し、時間をおいてもう一度お試しください。",
    );
  }

  return data.length === 1;
}

export async function deletePlantCareRecord(input: {
  recordId: string;
  userId: string;
  userPlantId: string;
}): Promise<boolean> {
  if (
    !uuidPattern.test(input.recordId) ||
    !uuidPattern.test(input.userId) ||
    !uuidPattern.test(input.userPlantId)
  ) {
    return false;
  }

  const client = requireSupabase();
  const { data: ownedRecord, error: ownershipError } = await client
    .from("plant_care_records")
    .select("id")
    .eq("id", input.recordId)
    .eq("user_plant_id", input.userPlantId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (ownershipError) {
    console.error("[plant-care-records] Delete ownership check failed", {
      code: ownershipError.code,
    });
    throw new Error(
      "記録を削除できませんでした。通信状態を確認し、時間をおいてもう一度お試しください。",
    );
  }
  if (!ownedRecord) return false;

  await deletePlantCareRecordPhotoFile(input);

  const { data, error } = await client
    .from("plant_care_records")
    .delete()
    .eq("id", input.recordId)
    .eq("user_plant_id", input.userPlantId)
    .eq("user_id", input.userId)
    .select("id");

  if (error) {
    console.error("[plant-care-records] Delete failed", { code: error.code });
    throw new Error(
      "記録を削除できませんでした。通信状態を確認し、時間をおいてもう一度お試しください。",
    );
  }

  return data.length === 1;
}
