"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import {
  FeedImageLightbox,
  type LightboxImage,
} from "@/app/(app)/news/feed-image-lightbox"
import type { FeedPostImageRecord } from "@/lib/feedPosts"
import { getFeedPostImageUrl } from "@/lib/feedPosts"
import { cn } from "@/lib/utils"

export function FeedImageCarousel({ images }: { images: FeedPostImageRecord[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const lightboxImages = useMemo<LightboxImage[]>(
    () =>
      images.map((image) => ({
        id: image.id,
        url: getFeedPostImageUrl(image.storage_path),
      })),
    [images]
  )

  const syncActiveIndex = useCallback(() => {
    const container = scrollRef.current
    if (!container || images.length <= 1) return

    const width = container.clientWidth
    if (width <= 0) return

    const index = Math.round(container.scrollLeft / width)
    setActiveIndex(Math.min(images.length - 1, Math.max(0, index)))
  }, [images.length])

  useEffect(() => {
    const container = scrollRef.current
    if (!container || images.length <= 1) return

    let scrollTimer: number | undefined

    const onScroll = () => {
      if (scrollTimer) window.clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(syncActiveIndex, 150)
    }

    container.addEventListener("scroll", onScroll, { passive: true })
    container.addEventListener("scrollend", syncActiveIndex)

    return () => {
      container.removeEventListener("scroll", onScroll)
      container.removeEventListener("scrollend", syncActiveIndex)
      if (scrollTimer) window.clearTimeout(scrollTimer)
    }
  }, [images.length, syncActiveIndex])

  if (images.length === 0) return null

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current
    if (!container) return

    const nextIndex = Math.min(images.length - 1, Math.max(0, index))
    container.scrollTo({
      left: nextIndex * container.clientWidth,
      behavior: "smooth",
    })
    setActiveIndex(nextIndex)
  }

  return (
    <>
      <div className="relative">
        <div
          ref={scrollRef}
          className={cn(
            "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar",
            "[-webkit-overflow-scrolling:touch]"
          )}
        >
          {lightboxImages.map((image, index) => (
            <div
              key={image.id}
              className="w-full min-w-full shrink-0 snap-center snap-always"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="group relative block w-full cursor-zoom-in"
                aria-label="ดูรูปขนาดเต็ม"
              >
                <div className="aspect-[4/3] w-full bg-hover sm:aspect-auto sm:h-[420px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt=""
                    draggable={false}
                    className="h-full w-full object-contain transition-opacity group-hover:opacity-95"
                  />
                </div>
              </button>
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="รูปก่อนหน้า"
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="absolute top-1/2 left-2 hidden -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white disabled:opacity-30 sm:inline-flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="รูปถัดไป"
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex === images.length - 1}
              className="absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white disabled:opacity-30 sm:inline-flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="mt-2 flex justify-center gap-1.5">
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
          </>
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
