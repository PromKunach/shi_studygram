"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type LightboxImage = {
  id: string
  url: string
}

export function FeedImageLightbox({
  images,
  initialIndex,
  open,
  onClose,
}: {
  images: LightboxImage[]
  initialIndex: number
  open: boolean
  onClose: () => void
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  useEffect(() => {
    if (open) setActiveIndex(initialIndex)
  }, [open, initialIndex])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
        return
      }
      if (images.length <= 1) return
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => Math.max(0, current - 1))
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => Math.min(images.length - 1, current + 1))
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, images.length, onClose])

  if (images.length === 0) return null

  const current = images[activeIndex]
  if (!current) return null

  const goPrev = () => setActiveIndex((index) => Math.max(0, index - 1))
  const goNext = () =>
    setActiveIndex((index) => Math.min(images.length - 1, index + 1))

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <motion.button
            type="button"
            aria-label="ปิด"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="ปิด"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>

          {images.length > 1 ? (
            <p className="absolute top-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
              {activeIndex + 1} / {images.length}
            </p>
          ) : null}

          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="relative z-10 flex max-h-[92vh] max-w-[min(96vw,1200px)] items-center justify-center px-12 py-16"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url}
              alt=""
              className="max-h-[92vh] max-w-full object-contain"
            />
          </motion.div>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="รูปก่อนหน้า"
                onClick={goPrev}
                disabled={activeIndex === 0}
                className={cn(
                  "absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors",
                  "hover:bg-black/70 disabled:opacity-30"
                )}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="รูปถัดไป"
                onClick={goNext}
                disabled={activeIndex === images.length - 1}
                className={cn(
                  "absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors",
                  "hover:bg-black/70 disabled:opacity-30"
                )}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </AnimatePresence>
  )
}
