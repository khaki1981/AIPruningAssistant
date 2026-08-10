import { supabase } from "../lib/supabase";

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

const plantCareRecordColumns =
  "id, record_date, plant_condition, condition_other, work_types, work_other, memo, created_at";

export interface CreatePlantCareRecordInput {
  conditionOther: string | null;
  memo: string | null;
  plantCondition: string;
  recordDate: string;
  userId: string;
  userPlantId: string;
  workOther: string | null;
  workTypes: string[];
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
): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("plant_care_records").insert({
    user_plant_id: input.userPlantId,
    user_id: input.userId,
    record_date: input.recordDate,
    plant_condition: input.plantCondition,
    condition_other: input.conditionOther,
    work_types: input.workTypes,
    work_other: input.workOther,
    memo: input.memo,
  });

  if (error) {
    console.error("[plant-care-records] Insert failed", { code: error.code });
    throw new Error(
      "記録を保存できませんでした。通信状態を確認し、時間をおいてもう一度お試しください。",
    );
  }
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

  return (data as PlantCareRecordRow[]).map((row) => ({
    conditionOther: row.condition_other,
    createdAt: row.created_at,
    id: row.id,
    memo: row.memo,
    plantCondition: row.plant_condition,
    recordDate: row.record_date,
    workOther: row.work_other,
    workTypes: row.work_types,
  }));
}
