import { ObjectId, type Db } from "mongodb";

export const IMAGES_COL = "product_images";

/** Uploaded images are resized client-side; this caps what the server will store. */
export const MAX_IMAGE_BYTES = 500 * 1024;

export const IMAGE_PATH_PREFIX = "/api/products/images/";

const UPLOADED_REF = /^\/api\/products\/images\/([a-f\d]{24})$/i;

/** Magic-byte signatures for the formats we accept. The Content-Type header alone is not trusted. */
export function sniffImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "image/png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  ) return "image/webp";
  return null;
}

/**
 * Hosts a pasted image URL may point to. Must match the CSP `img-src` in middleware.ts
 * (and `images.remotePatterns` in next.config.ts) — the browser blocks any other host.
 */
export const ALLOWED_IMAGE_HOSTS = ["images.unsplash.com"];

/**
 * A product `image` is either empty, a path to an uploaded image, or an https URL
 * on an allowed host. Returns true when the value is acceptable to store.
 */
export function isValidImageRef(value: string): boolean {
  if (value === "") return true;
  if (value.length > 500) return false;
  if (UPLOADED_REF.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_IMAGE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

/** The ObjectId of an uploaded image, or null if the ref points elsewhere. */
export function uploadedImageId(ref: unknown): ObjectId | null {
  if (typeof ref !== "string") return null;
  const m = UPLOADED_REF.exec(ref);
  return m ? new ObjectId(m[1]) : null;
}

/** Deletes an uploaded image once no product references it. No-op for external URLs. */
export async function deleteImageIfUnused(db: Db, ref: unknown): Promise<void> {
  const oid = uploadedImageId(ref);
  if (!oid) return;
  const stillUsed = await db.collection("products").findOne({ image: ref }, { projection: { _id: 1 } });
  if (!stillUsed) await db.collection(IMAGES_COL).deleteOne({ _id: oid });
}
