"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Bell,
  Calendar,
  FileText,
  Globe,
  Keyboard,
  Megaphone,
  Rocket,
  Star,
  type LucideIcon,
} from "lucide-react"

import { FeedPostAvatar } from "@/app/(app)/news/feed-post-avatar"
import {
  formatAnnouncementDateTime,
  formatAnnouncementTime,
  getAnnouncementImageUrl,
  normalizeImageFocus,
  type AnnouncementRecord,
} from "@/lib/announcements"
import type { CurrentUser } from "@/lib/userProfile"
import { cn } from "@/lib/utils"

const ICON_BY_ID: Record<string, LucideIcon> = {
  file: FileText,
  input: Keyboard,
  globe: Globe,
  calendar: Calendar,
  bell: Bell,
  speaker: Megaphone,
  rocket: Rocket,
  star: Star,
}

export function AnnouncementFeedCard({
  record,
  author,
}: {
  record: AnnouncementRecord
  author: CurrentUser | null
}) {
  const displayName = author?.displayName ?? record.author_pbri_id
  const Icon = ICON_BY_ID[record.icon_id] ?? Megaphone
  const imageUrl = getAnnouncementImageUrl(record.image_storage_path)
  const focus = normalizeImageFocus(record.image_focus)
  const description = record.description.trim()

  return (
    <Link
      href={`/announces/${record.id}`}
      className="block p-5 transition-colors hover:bg-hover/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FeedPostAvatar avatarUrl={author?.avatarUrl} label={displayName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            <p className="text-xs text-muted">
              {formatAnnouncementTime(record.created_at)}
            </p>
          </div>
        </div>

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 shadow-sm"
          style={{
            backgroundColor: record.card_color,
            color: record.text_color,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <h2 className="text-base font-semibold text-foreground">{record.name}</h2>
        {description ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted">
            {description}
          </p>
        ) : null}
      </div>

      {imageUrl ? (
        <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-xl border border-border bg-muted">
          <Image
            src={imageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
            style={{
              objectPosition: `${focus.x}% ${focus.y}%`,
              transform: `scale(${focus.zoom})`,
            }}
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>
      ) : null}

      <p className="mt-3 text-xs text-muted">
        {formatAnnouncementDateTime(record.created_at)}
      </p>
    </Link>
  )
}

export function AnnouncementFeedSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-border rounded-2xl border border-border bg-background">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-hover" />
            <div className="space-y-2">
              <div className="h-3 w-28 rounded-md bg-hover" />
              <div className="h-2.5 w-20 rounded-md bg-hover" />
            </div>
          </div>
          <div className="mt-4 h-5 w-2/3 rounded-md bg-hover" />
          <div className="mt-2 h-16 rounded-xl bg-hover" />
        </div>
      ))}
    </div>
  )
}

export function AnnouncementViewToggle({
  active,
  className,
}: {
  active: "grid" | "feed"
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-border bg-muted/40 p-1",
        className
      )}
    >
      <Link
        href="/announces"
        className={cn(
          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          active === "grid"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted hover:text-foreground"
        )}
      >
        กริด
      </Link>
      <Link
        href="/announces/feed"
        className={cn(
          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          active === "feed"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted hover:text-foreground"
        )}
      >
        ฟีด
      </Link>
    </div>
  )
}
