import {
  decodePlantPhoto,
  PlantPhotoProcessingError,
  validatePlantPhotoFile,
} from "./plantPhotoCompression";

const MAX_LONG_EDGE = 1280;
const MAX_OUTPUT_SIZE = 5 * 1024 * 1024;
const OUTPUT_QUALITY = 0.9;

export interface PreparedPlantIdentificationPhoto {
  file: File;
  height: number;
  originalHeight: number;
  originalSize: number;
  originalWidth: number;
  previewUrl: string;
  width: number;
}

export class PlantIdentificationPhotoError extends Error {
  constructor(
    public readonly code: "canvas" | "encode" | "heic-decode" | "output-too-large",
    message: string,
  ) {
    super(message);
    this.name = "PlantIdentificationPhotoError";
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve, reject) => {
    try {
      canvas.toBlob(resolve, "image/jpeg", OUTPUT_QUALITY);
    } catch {
      reject(
        new PlantIdentificationPhotoError(
          "encode",
          "写真をJPEGへ変換できませんでした。別の写真を選択してください。",
        ),
      );
    }
  });
}

export async function preparePlantIdentificationPhoto(
  sourceFile: File,
): Promise<PreparedPlantIdentificationPhoto> {
  const inputKind = validatePlantPhotoFile(sourceFile);
  let decoded;

  try {
    decoded = await decodePlantPhoto(sourceFile);
  } catch (error) {
    if (
      inputKind === "heic" &&
      error instanceof PlantPhotoProcessingError &&
      error.code === "decode"
    ) {
      throw new PlantIdentificationPhotoError(
        "heic-decode",
        "この端末またはブラウザでは、HEIC・HEIF形式の写真をJPEGへ変換できませんでした。別の写真を選択するか、JPEG形式の写真をお試しください。",
      );
    }
    throw error;
  }

  const scale = Math.min(1, MAX_LONG_EDGE / Math.max(decoded.width, decoded.height));
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));
  const canvas = document.createElement("canvas");

  try {
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new PlantIdentificationPhotoError(
        "canvas",
        "このブラウザでは写真を処理できませんでした。別のブラウザまたは端末をお試しください。",
      );
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    try {
      context.drawImage(decoded.source, 0, 0, width, height);
    } catch {
      throw new PlantIdentificationPhotoError(
        "canvas",
        "写真を変換できませんでした。別の写真を選択してください。",
      );
    }

    const blob = await canvasToJpeg(canvas);
    if (!blob || blob.size === 0 || blob.type.toLowerCase() !== "image/jpeg") {
      throw new PlantIdentificationPhotoError(
        "encode",
        "写真をJPEGへ変換できませんでした。別の写真を選択してください。",
      );
    }
    if (blob.size > MAX_OUTPUT_SIZE) {
      throw new PlantIdentificationPhotoError(
        "output-too-large",
        "JPEGへ変換した写真が5MBを超えたため送信できません。別の写真を選択してください。",
      );
    }

    const file = new File([blob], `${crypto.randomUUID()}.jpg`, {
      lastModified: Date.now(),
      type: "image/jpeg",
    });
    let previewUrl: string;
    try {
      previewUrl = URL.createObjectURL(file);
    } catch {
      throw new PlantIdentificationPhotoError(
        "encode",
        "変換した写真をプレビューできませんでした。別の写真を選択してください。",
      );
    }

    return {
      file,
      height,
      originalHeight: decoded.height,
      originalSize: sourceFile.size,
      originalWidth: decoded.width,
      previewUrl,
      width,
    };
  } finally {
    canvas.width = 1;
    canvas.height = 1;
    decoded.release();
  }
}

export function releasePlantIdentificationPhoto(
  photo: PreparedPlantIdentificationPhoto,
) {
  URL.revokeObjectURL(photo.previewUrl);
}
