import { supabase } from "../lib/supabase";
import type { UserPlant } from "../types/userPlant";

type UserPlantRow = {
  id: string;
  user_id: string;
  plant_id: string;
  nickname: string | null;
  created_at: string;
  updated_at: string;
};

const userPlantColumns =
  "id, user_id, plant_id, nickname, created_at, updated_at";

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabaseの接続設定がありません。環境変数を確認してください。",
    );
  }
  return supabase;
}

function toUserPlant(row: UserPlantRow): UserPlant {
  return {
    id: row.id,
    userId: row.user_id,
    plantId: row.plant_id,
    nickname: row.nickname,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listUserPlants(): Promise<UserPlant[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("user_plants")
    .select(userPlantColumns)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[user-plants] Fetch failed", error);
    throw new Error(
      "自分の植物を読み込めませんでした。時間をおいてもう一度お試しください。",
    );
  }

  return (data as UserPlantRow[]).map(toUserPlant);
}

export async function createUserPlant(input: {
  userId: string;
  plantId: string;
  nickname: string;
}): Promise<UserPlant> {
  const client = requireSupabase();
  const nickname = input.nickname.trim();
  const { data, error } = await client
    .from("user_plants")
    .insert({
      user_id: input.userId,
      plant_id: input.plantId,
      nickname: nickname || null,
    })
    .select(userPlantColumns)
    .single();

  if (error) {
    console.error("[user-plants] Insert failed", error);
    throw new Error(
      "自分の植物として登録できませんでした。時間をおいてもう一度お試しください。",
    );
  }

  return toUserPlant(data as UserPlantRow);
}

