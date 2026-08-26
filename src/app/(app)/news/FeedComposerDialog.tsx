"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { FeedPostAvatar } from "@/app/(app)/news/feed-post-avatar"
import {
  FeedImageLightbox,
  type LightboxImage,
} from "@/app/(app)/news/feed-image-lightbox"
import { Button } from "@/components/ui/button"
import {
  MAX_UPLOAD_BYTES,
  compressImageFile,
  formatFileSize,
} from "@/lib/compressImage"
import {
  MAX_FEED_IMAGES,
  createFeedPost,
  feedPostMutationErrorMessage,
  getFeedPostImageUrl,
  isFeedPostEmpty,
  updateFeedPost,
  type FeedPostWithImages,
} from "@/lib/feedPosts"
import type { CurrentUser } from "@/lib/userProfile"
import { cn } from "@/lib/utils"

type ComposerMode = "create" | "edit"

type ComposerImage = {
  id: string
  url: string
  isPending?: boolean
}

type PendingImage = {
  id: string
  file: File
  previewUrl: string
}

function ComposerImageStrip({
  images,
  onRemove,
}: {
  images: ComposerImage[]
  onRemove: (id: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const lightboxImages: LightboxImage[] = images.map((image) => ({
    id: image.id,
    url: image.url,
  }))

  if (images.length === 0) return null

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current
    if (!container) return
    const child = container.children[index] as HTMLElement | undefined
    child?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    setActiveIndex(index)
  }

  const handleScroll = () => {
    const container = scrollRef.current
    if (!container || images.length <= 1) return
    const width = container.clientWidth
    if (width <= 0) return
    const index = Math.round(container.scrollLeft / width)
    setActiveIndex(Math.min(images.length - 1, Math.max(0, index)))
  }

  return (
    <>
      <div className="mt-3.5 overflow-hidden rounded-xl border border-border">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={cn(
            "flex snap-x snap-mandatory overflow-x-auto no-scrollbar",
            images.length > 1 && "scroll-smooth"
          )}
        >
          {images.map((image, index) => (
            <div key={image.id} className="relative w-full shrink-0 snap-center">
              <button
                type="button"
                aria-label="ดูรูปขนาดเต็ม"
                onClick={() => setLightboxIndex(index)}
                className="block w-full cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt=""
                  className="max-h-[360px] w-full bg-hover object-contain"
                />
              </button>
              <button
                type="button"
                aria-label="ลบรูป"
                onClick={() => onRemove(image.id)}
                className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/75"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <div className="flex justify-center gap-1.5 border-t border-border py-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={`รูปที่ ${index + 1}`}
                onClick={() => scrollToIndex(index)}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  index === activeIndex ? "bg-foreground" : "bg-border"
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      <FeedImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  )
}

export function FeedComposerDialog({
  open,
  mode,
  post,
  author,
  onClose,
  onSaved,
}: {
  open: boolean
  mode: ComposerMode
  post: FeedPostWithImages | null
  author: CurrentUser
  onClose: () => void
  onSaved: (post: FeedPostWithImages) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [body, setBody] = useState("")
  const [existingImages, setExistingImages] = useState<ComposerImage[]>([])
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    setBody(post?.body ?? "")
    setExistingImages(
      (post?.images ?? []).map((image) => ({
        id: image.id,
        url: getFeedPostImageUrl(image.storage_path),
      }))
    )
    setPendingImages([])
    setError(null)
    setIsSubmitting(false)
  }, [open, post])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 120)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    return () => {
      for (const image of pendingImages) {
        URL.revokeObjectURL(image.previewUrl)
      }
    }
  }, [pendingImages])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  const totalImages = existingImages.length + pendingImages.length
  const canAddMore = totalImages < MAX_FEED_IMAGES
  const pendingTotalBytes = pendingImages.reduce((sum, image) => sum + image.file.size, 0)
  const previewImages: ComposerImage[] = [
    ...existingImages,
    ...pendingImages.map((image) => ({
      id: image.id,
      url: image.previewUrl,
      isPending: true,
    })),
  ]
  const hasContent = body.trim().length > 0 || totalImages > 0

  const removePreviewImage = (id: string) => {
    if (existingImages.some((image) => image.id === id)) {
      setExistingImages((current) => current.filter((image) => image.id !== id))
      return
    }
    removePending(id)
  }

  const removePending = (id: string) => {
    setPendingImages((current) => {
      const target = current.find((image) => image.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return current.filter((image) => image.id !== id)
    })
  }

  const handlePickFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setError(null)

    const remaining = MAX_FEED_IMAGES - totalImages
    const picked = Array.from(files).slice(0, remaining)
    let runningTotal = pendingTotalBytes
    const nextPending: PendingImage[] = []

    for (const file of picked) {
      let compressed: File
      try {
        compressed = await compressImageFile(file)
      } catch {
        setError("ไม่สามารถอ่านไฟล์รูปนี้ได้")
        continue
      }

      if (runningTotal + compressed.size > MAX_UPLOAD_BYTES) {
        setError(
          `รูปรวมเกินไป สูงสุด ${formatFileSize(MAX_UPLOAD_BYTES)} ต่อโพสต์`
        )
        break
      }

      runningTotal += compressed.size
      nextPending.push({
        id: crypto.randomUUID(),
        file: compressed,
        previewUrl: URL.createObjectURL(compressed),
      })
    }

    if (nextPending.length > 0) {
      setPendingImages((current) => [...current, ...nextPending])
    }
  }

  const handleSubmit = async () => {
    if (isFeedPostEmpty(body, totalImages)) {
      setError("กรุณาใส่ข้อความหรือรูปภาพ")
      return
    }

    if (pendingTotalBytes > MAX_UPLOAD_BYTES) {
      setError(
        `รูปรวมเกินไป สูงสุด ${formatFileSize(MAX_UPLOAD_BYTES)} ต่อโพสต์`
      )
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const saved =
        mode === "create"
          ? await createFeedPost({
              body,
              imageFiles: pendingImages.map((image) => image.file),
              author,
            })
          : await updateFeedPost(post!.id, {
              body,
              newImageFiles: pendingImages.map((image) => image.file),
              keepImageIds: existingImages.map((image) => image.id),
              author,
            })

      onSaved(saved)
      onClose()
    } catch (submitError) {
      setError(feedPostMutationErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="ปิดหน้าต่าง"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.85 }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
              <p className="text-sm font-medium text-muted">
                {mode === "create" ? "สร้างโพสต์" : "แก้ไขโพสต์"}
              </p>
              <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
              <article className="p-5">
                <div className="flex items-start gap-3">
                  <FeedPostAvatar
                    avatarUrl={author.avatarUrl}
                    label={author.displayName}
                  />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {author.displayName}
                    </p>
                    <p className="text-xs text-muted">เมื่อสักครู่</p>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  id="feed-post-body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={3}
                  placeholder="คุณกำลังคิดอะไรอยู่?"
                  className={cn(
                    "mt-3.5 w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-relaxed",
                    "text-foreground outline-none placeholder:text-muted",
                    "field-sizing-content min-h-[4.5rem]"
                  )}
                />

                <ComposerImageStrip
                  images={previewImages}
                  onRemove={removePreviewImage}
                />

                {!hasContent ? (
                  <p className="mt-4 text-xs text-muted">
                    เพิ่มข้อความหรือรูปภาพเพื่อโพสต์
                  </p>
                ) : null}
              </article>
            </div>

            {error ? (
              <p className="border-t border-border px-5 py-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    void handlePickFiles(event.target.files)
                    event.target.value = ""
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!canAddMore || isSubmitting}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted hover:text-foreground"
                >
                  <ImagePlus className="me-1.5 h-4 w-4" />
                  รูปภาพ
                </Button>
                <span className="truncate text-xs text-muted">
                  {totalImages}/{MAX_FEED_IMAGES} รูป
                  {pendingTotalBytes > 0
                    ? ` · ${formatFileSize(pendingTotalBytes)}/${formatFileSize(MAX_UPLOAD_BYTES)}`
                    : ` · รวมสูงสุด ${formatFileSize(MAX_UPLOAD_BYTES)}`}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting || !hasContent}
                >
                  {isSubmitting
                    ? "กำลังโพสต์..."
                    : mode === "create"
                      ? "โพสต์"
                      : "บันทึก"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
