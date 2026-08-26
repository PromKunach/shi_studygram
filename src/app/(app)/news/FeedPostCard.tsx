"use client"

import { useState } from "react"
import { MoreHorizontal } from "lucide-react"

import { FeedImageCarousel } from "@/app/(app)/news/FeedImageCarousel"
import { FeedPostAvatar } from "@/app/(app)/news/feed-post-avatar"
import { Button } from "@/components/ui/button"
import {
  formatFeedPostDateTime,
  formatFeedPostTime,
  type FeedPostWithImages,
} from "@/lib/feedPosts"
import type { CurrentUser } from "@/lib/userProfile"
import { cn } from "@/lib/utils"

const BODY_PREVIEW_LENGTH = 300

export function FeedPostCard({
  post,
  author,
  currentUser,
  onEdit,
  onDelete,
}: {
  post: FeedPostWithImages
  author: CurrentUser | null
  currentUser: CurrentUser | null
  onEdit: (post: FeedPostWithImages) => void
  onDelete: (postId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const displayName = author?.displayName ?? post.author_pbri_id
  const isOwner = currentUser?.studentId === post.author_pbri_id
  const body = post.body.trim()
  const shouldTruncate = body.length > BODY_PREVIEW_LENGTH && !expanded
  const displayBody = shouldTruncate
    ? `${body.slice(0, BODY_PREVIEW_LENGTH).trimEnd()}…`
    : body
  const wasEdited = post.updated_at !== post.created_at

  return (
    <article className="p-5 transition-colors hover:bg-hover/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FeedPostAvatar avatarUrl={author?.avatarUrl} label={displayName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            <p className="text-xs text-muted">
              {formatFeedPostTime(post.created_at)}
              {wasEdited ? " · แก้ไขแล้ว" : ""}
            </p>
          </div>
        </div>

        {isOwner ? (
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="ตัวเลือกโพสต์"
              className="text-muted hover:bg-hover hover:text-foreground"
              onClick={() => {
                setMenuOpen((current) => !current)
                setConfirmDelete(false)
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {menuOpen ? (
              <div className="absolute top-full right-0 z-10 mt-1 min-w-36 overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-lg">
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-hover"
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit(post)
                  }}
                >
                  แก้ไข
                </button>
                {!confirmDelete ? (
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"
                    onClick={() => setConfirmDelete(true)}
                  >
                    ลบ
                  </button>
                ) : (
                  <div className="space-y-1 px-3 py-2">
                    <p className="text-xs text-muted">ลบโพสต์นี้?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs text-muted hover:text-foreground"
                        onClick={() => setConfirmDelete(false)}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-red-600 dark:text-red-400"
                        onClick={() => {
                          setMenuOpen(false)
                          onDelete(post.id)
                        }}
                      >
                        ยืนยัน
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {body ? (
        <div className="mt-3.5">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
            {displayBody}
          </p>
          {body.length > BODY_PREVIEW_LENGTH ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="mt-1.5 text-sm font-medium text-card-accent hover:underline"
            >
              {expanded ? "ย่อ" : "ดูเพิ่มเติม"}
            </button>
          ) : null}
        </div>
      ) : null}

      {post.images.length > 0 ? (
        <div className={cn("mt-3.5 overflow-hidden rounded-xl border border-border", !body && "mt-4")}>
          <FeedImageCarousel images={post.images} />
        </div>
      ) : null}

      <p className="mt-3 text-[11px] text-muted">
        {formatFeedPostDateTime(wasEdited ? post.updated_at : post.created_at)}
      </p>
    </article>
  )
}
