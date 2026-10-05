import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { appConfigurations } from "../../../db/schema";

export type UploadSettings = {
  imageMaxMb: number;
  videoMaxMb: number;
  documentMaxMb: number;
  maxPropertyFiles: number;
  allowedExtensions: string[];
};

export const defaultUploadSettings: UploadSettings = {
  imageMaxMb: 15,
  videoMaxMb: 100,
  documentMaxMb: 50,
  maxPropertyFiles: 12,
  allowedExtensions: ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov", "m4v", "avi", "mkv", "pdf", "zip", "rar"],
};

const imageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
const videoExtensions = new Set(["mp4", "webm", "mov", "m4v", "avi", "mkv"]);
const documentExtensions = new Set(["pdf", "zip", "rar", ...imageExtensions, ...videoExtensions]);

export function cleanUploadSettings(value: Partial<UploadSettings> | null | undefined): UploadSettings {
  const number = (input: unknown, fallback: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number(input) || fallback)));
  const allowed = Array.isArray(value?.allowedExtensions)
    ? value.allowedExtensions.map(item => String(item).toLowerCase().replace(/^\./, "")).filter(item => documentExtensions.has(item))
    : defaultUploadSettings.allowedExtensions;
  return {
    imageMaxMb: number(value?.imageMaxMb, defaultUploadSettings.imageMaxMb, 1, 50),
    videoMaxMb: number(value?.videoMaxMb, defaultUploadSettings.videoMaxMb, 1, 500),
    documentMaxMb: number(value?.documentMaxMb, defaultUploadSettings.documentMaxMb, 1, 500),
    maxPropertyFiles: number(value?.maxPropertyFiles, defaultUploadSettings.maxPropertyFiles, 1, 30),
    allowedExtensions: Array.from(new Set(allowed)),
  };
}

export async function getUploadSettings() {
  const row = (await getDb().select().from(appConfigurations).where(eq(appConfigurations.id, "upload-settings")).limit(1))[0];
  return cleanUploadSettings(row?.value as Partial<UploadSettings> | undefined);
}

export function fileExtension(file: Pick<File, "name">) {
  return file.name.toLowerCase().split(".").pop()?.replace(/[^a-z0-9]/g, "") || "";
}

export function uploadCategory(file: Pick<File, "name" | "type">) {
  const extension = fileExtension(file);
  if (file.type.startsWith("image/") || imageExtensions.has(extension)) return "image" as const;
  if (file.type.startsWith("video/") || videoExtensions.has(extension)) return "video" as const;
  return "document" as const;
}

export function validateUpload(file: File, settings: UploadSettings, scope: "property" | "document" | "video") {
  const extension = fileExtension(file), category = uploadCategory(file);
  if (!settings.allowedExtensions.includes(extension)) return { ok: false as const, error: "FILE_TYPE_NOT_ALLOWED" };
  if (scope === "property" && category === "document") return { ok: false as const, error: "PROPERTY_MEDIA_ONLY" };
  if (scope === "video" && (category !== "video" || !videoExtensions.has(extension))) return { ok: false as const, error: "VIDEO_ONLY" };
  const maxMb = category === "image" ? settings.imageMaxMb : category === "video" ? settings.videoMaxMb : settings.documentMaxMb;
  if (file.size <= 0 || file.size > maxMb * 1024 * 1024) return { ok: false as const, error: "FILE_TOO_LARGE", maxMb };
  return { ok: true as const, category, extension, maxMb };
}
