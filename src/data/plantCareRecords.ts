import { supabase } from "../lib/supabase";

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
