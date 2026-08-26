export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // total per post, all images combined
const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.85

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("ไม่สามารถอ่านไฟล์รูปนี้ได้"))
    }
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("ไม่สามารถบีบอัดรูปนี้ได้"))
          return
        }
        resolve(blob)
      },
      type,
      quality
    )
  })
}

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("ไม่สามารถอ่านไฟล์รูปนี้ได้")
  }

  if (file.size <= MAX_UPLOAD_BYTES && file.type === "image/jpeg") {
    const image = await loadImage(file)
    if (image.width <= MAX_DIMENSION && image.height <= MAX_DIMENSION) {
      return file
    }
  }

  const image = await loadImage(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")
  if (!context) throw new Error("ไม่สามารถบีบอัดรูปนี้ได้")

  context.drawImage(image, 0, 0, width, height)

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg"
  const blob =
    outputType === "image/jpeg"
      ? await canvasToBlob(canvas, outputType, JPEG_QUALITY)
      : await canvasToBlob(canvas, outputType, 1)

  const extension = outputType === "image/png" ? "png" : "jpg"
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image"

  return new File([blob], `${baseName}.${extension}`, {
    type: outputType,
    lastModified: Date.now(),
  })
}
