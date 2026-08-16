export interface PlantCareRecordPhoto {
  createdAt: string;
  height: number;
  id: string;
  mimeType: "image/jpeg" | "image/webp";
  plantCareRecordId: string;
  sizeBytes: number;
  storagePath: string;
  userId: string;
  userPlantId: string;
  width: number;
}
