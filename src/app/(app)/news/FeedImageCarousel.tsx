"use client"

import { useMemo, useRef, useState } from "react"
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
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={cn(
            "flex snap-x snap-mandatory overflow-x-auto no-scrollbar",
            images.length > 1 && "scroll-smooth"
          )}
        >
          {lightboxImages.map((image, index) => (
            <div key={image.id} className="w-full shrink-0 snap-center">
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="group relative block w-full cursor-zoom-in"
                aria-label="ดูรูปขนาดเต็ม"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt=""
                  className="max-h-[420px] w-full bg-hover object-contain transition-opacity group-hover:opacity-95"
                />
              </button>
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="รูปก่อนหน้า"
              onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="absolute top-1/2 left-2 hidden -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white disabled:opacity-30 sm:inline-flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="รูปถัดไป"
              onClick={() => scrollToIndex(Math.min(images.length - 1, activeIndex + 1))}
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
