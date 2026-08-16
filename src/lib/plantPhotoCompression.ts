const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_LONG_EDGE = 1600;
const MAX_SOURCE_DIMENSION = 32768;
const MAX_SOURCE_PIXELS = 50_000_000;
const OUTPUT_QUALITY = 0.8;

const supportedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
]);
const supportedExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
const heicMimeTypes = new Set(["image/heic", "image/heif"]);
const heicExtensions = new Set(["heic", "heif"]);

export type PlantPhotoInputKind = "standard" | "heic";
export type PlantPhotoOutputMimeType = "image/jpeg" | "image/webp";

export interface CompressedPlantPhoto {
  compressedHeight: number;
  compressedSize: number;
  compressedWidth: number;
  file: File;
  originalFileName: string;
  originalHeight: number;
  originalSize: number;
  originalWidth: number;
  outputFileName: string;
  outputMimeType: PlantPhotoOutputMimeType;
  previewUrl: string;
}

export class PlantPhotoProcessingError extends Error {
  constructor(
    public readonly code:
      | "canvas"
      | "decode"
      | "dimensions"
      | "encode"
      | "heic-decode"
      | "too-large"
      | "unsupported",
    message: string,
  ) {
    super(message);
    this.name = "PlantPhotoProcessingError";
  }
}

export interface DecodedPlantPhoto {
  height: number;
  release: () => void;
  source: CanvasImageSource;
  width: number;
}

interface EncodedPlantPhoto {
  blob: Blob;
  height: number;
  mimeType: PlantPhotoOutputMimeType;
  width: number;
}

function getFileExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot >= 0 ? fileName.slice(lastDot + 1).toLowerCase() : "";
}

export function validatePlantPhotoFile(file: File): PlantPhotoInputKind {
  if (file.size > MAX_FILE_SIZE) {
    throw new PlantPhotoProcessingError(
      "too-large",
      "写真の容量が大きすぎます。20MB以下の写真を選択してください。",
    );
  }

  const mimeType = file.type.toLowerCase();
  const extension = getFileExtension(file.name);
  const hasGenericMimeType = !mimeType || mimeType === "application/octet-stream";
  if (
    !hasGenericMimeType &&
    !supportedMimeTypes.has(mimeType) &&
    !heicMimeTypes.has(mimeType)
  ) {
    throw new PlantPhotoProcessingError(
      "unsupported",
      "この写真形式には対応していません。JPEG、PNG、WebP、HEIC、HEIF形式の写真を選択してください。",
    );
  }

  const isHeic =
    heicMimeTypes.has(mimeType) ||
    heicExtensions.has(extension);
  const isStandard =
    supportedMimeTypes.has(mimeType) ||
    (hasGenericMimeType && supportedExtensions.has(extension));

  if (isHeic) return "heic";
  if (isStandard) return "standard";

  throw new PlantPhotoProcessingError(
    "unsupported",
    "この写真形式には対応していません。JPEG、PNG、WebP、HEIC、HEIF形式の写真を選択してください。",
  );
}

function assertSafeDimensions(width: number, height: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1 ||
    width > MAX_SOURCE_DIMENSION ||
    height > MAX_SOURCE_DIMENSION ||
    width * height > MAX_SOURCE_PIXELS
  ) {
    throw new PlantPhotoProcessingError(
      "dimensions",
      "写真の縦横サイズが大きすぎるため処理できません。別の写真を選択してください。",
    );
  }
}

async function decodeWithImageElement(file: File): Promise<DecodedPlantPhoto> {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image element could not decode file"));
      image.src = objectUrl;
    });
    assertSafeDimensions(image.naturalWidth, image.naturalHeight);
    return {
      height: image.naturalHeight,
      release: () => {
        image.src = "";
        URL.revokeObjectURL(objectUrl);
      },
      source: image,
      width: image.naturalWidth,
    };
  } catch (error) {
    image.src = "";
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export async function decodePlantPhoto(file: File): Promise<DecodedPlantPhoto> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      try {
        assertSafeDimensions(bitmap.width, bitmap.height);
      } catch (error) {
        bitmap.close();
        throw error;
      }
      return {
        height: bitmap.height,
        release: () => bitmap.close(),
        source: bitmap,
        width: bitmap.width,
      };
    } catch (error) {
      if (error instanceof PlantPhotoProcessingError) throw error;
    }
  }

  try {
    return await decodeWithImageElement(file);
  } catch (error) {
    if (error instanceof PlantPhotoProcessingError) throw error;
    throw new PlantPhotoProcessingError(
      "decode",
      "写真を読み込めませんでした。別の写真を選択してください。",
    );
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve, reject) => {
    try {
      canvas.toBlob(resolve, type, OUTPUT_QUALITY);
    } catch {
      reject(
        new PlantPhotoProcessingError(
          "encode",
          "写真を圧縮できませんでした。別の写真を選択してください。",
        ),
      );
    }
  });
}

export async function compressDecodedPlantPhoto(
  decoded: DecodedPlantPhoto,
): Promise<EncodedPlantPhoto> {
  const scale = Math.min(1, MAX_LONG_EDGE / Math.max(decoded.width, decoded.height));
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));
  const canvas = document.createElement("canvas");

  try {
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new PlantPhotoProcessingError(
        "canvas",
        "このブラウザでは写真を処理できませんでした。別のブラウザまたは端末をお試しください。",
      );
    }

    try {
      context.drawImage(decoded.source, 0, 0, width, height);
    } catch {
      throw new PlantPhotoProcessingError(
        "canvas",
        "写真を縮小できませんでした。別の写真を選択してください。",
      );
    }

    let webpBlob: Blob | null = null;
    try {
      webpBlob = await canvasToBlob(canvas, "image/webp");
    } catch {
      webpBlob = null;
    }
    if (webpBlob && webpBlob.size > 0 && webpBlob.type.toLowerCase() === "image/webp") {
      return { blob: webpBlob, height, mimeType: "image/webp", width };
    }

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(decoded.source, 0, 0, width, height);
    const jpegBlob = await canvasToBlob(canvas, "image/jpeg");
    if (
      !jpegBlob ||
      jpegBlob.size === 0 ||
      jpegBlob.type.toLowerCase() !== "image/jpeg"
    ) {
      throw new PlantPhotoProcessingError(
        "encode",
        "写真を圧縮できませんでした。別の写真を選択してください。",
      );
    }
    return { blob: jpegBlob, height, mimeType: "image/jpeg", width };
  } catch (error) {
    if (error instanceof PlantPhotoProcessingError) throw error;
    throw new PlantPhotoProcessingError(
      "canvas",
      "写真を処理できませんでした。縦横サイズの小さい写真をお試しください。",
    );
  } finally {
    canvas.width = 1;
    canvas.height = 1;
  }
}

export async function compressPlantPhoto(file: File): Promise<CompressedPlantPhoto> {
  const inputKind = validatePlantPhotoFile(file);
  let decoded: DecodedPlantPhoto;

  try {
    decoded = await decodePlantPhoto(file);
  } catch (error) {
    if (inputKind === "heic" && error instanceof PlantPhotoProcessingError && error.code === "decode") {
      throw new PlantPhotoProcessingError(
        "heic-decode",
        "この端末またはブラウザでは、HEIC・HEIF形式の写真を変換できませんでした。別の写真を選択するか、JPEG形式の写真をお試しください。",
      );
    }
    throw error;
  }

  try {
    const encoded = await compressDecodedPlantPhoto(decoded);
    const extension = encoded.mimeType === "image/webp" ? "webp" : "jpg";
    const outputFileName = `${crypto.randomUUID()}.${extension}`;
    const compressedFile = new File([encoded.blob], outputFileName, {
      lastModified: Date.now(),
      type: encoded.mimeType,
    });
    let previewUrl: string;
    try {
      previewUrl = URL.createObjectURL(compressedFile);
    } catch {
      throw new PlantPhotoProcessingError(
        "encode",
        "圧縮した写真をプレビューできませんでした。別の写真を選択してください。",
      );
    }

    return {
      compressedHeight: encoded.height,
      compressedSize: compressedFile.size,
      compressedWidth: encoded.width,
      file: compressedFile,
      originalFileName: file.name,
      originalHeight: decoded.height,
      originalSize: file.size,
      originalWidth: decoded.width,
      outputFileName,
      outputMimeType: encoded.mimeType,
      previewUrl,
    };
  } finally {
    decoded.release();
  }
}

export function releaseCompressedPlantPhoto(photo: CompressedPlantPhoto) {
  URL.revokeObjectURL(photo.previewUrl);
}
