// --------------------------------------------------------------------------
// cropImage.ts – Canvas-based crop + resize + compress helper
// --------------------------------------------------------------------------

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Output constants ──────────────────────────────────────────────────────
/** Final avatar dimension (square). */
export const AVATAR_OUTPUT_SIZE = 512;
/** MIME type for the compressed output blob. */
export const AVATAR_OUTPUT_TYPE = "image/webp";
/** Compression quality (0–1) for the output blob. */
export const AVATAR_OUTPUT_QUALITY = 0.8;

// ─────────────────────────────────────────────────────────────────────────

/** Load an image URL into an HTMLImageElement, respecting CORS. */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

/**
 * Crop the `imageSrc` data-URL to `pixelCrop`, resize to `outputSize`×`outputSize`,
 * compress with `outputQuality`, and return a Blob ready for upload.
 *
 * @param imageSrc       data-URL of the source image (from FileReader)
 * @param pixelCrop      exact pixel coordinates produced by react-easy-crop
 * @param outputSize     edge length of the square output (default: AVATAR_OUTPUT_SIZE)
 * @param outputType     MIME type of the compressed blob (default: AVATAR_OUTPUT_TYPE)
 * @param outputQuality  compression quality 0–1 (default: AVATAR_OUTPUT_QUALITY)
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  outputSize: number = AVATAR_OUTPUT_SIZE,
  outputType: string = AVATAR_OUTPUT_TYPE,
  outputQuality: number = AVATAR_OUTPUT_QUALITY,
): Promise<Blob> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to obtain 2D canvas rendering context.");
  }

  // Draw the crop region scaled to the desired output dimensions
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("canvas.toBlob() returned null – canvas may be empty."));
          return;
        }
        resolve(blob);
      },
      outputType,
      outputQuality,
    );
  });
}
