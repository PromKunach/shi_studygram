"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Newspaper, PenLine } from "lucide-react"

import { FeedComposerDialog } from "@/app/(app)/news/FeedComposerDialog"
import { FeedPostCard } from "@/app/(app)/news/FeedPostCard"
import { Button } from "@/components/ui/button"
import {
  deleteFeedPost,
  feedPostMutationErrorMessage,
  fetchFeedPosts,
  type FeedPostWithImages,
} from "@/lib/feedPosts"
import { PAGE_MAIN } from "@/lib/layout"
import {
  resolveAuthorForPbriId,
  useCurrentUser,
  type CurrentUser,
} from "@/lib/userProfile"
import { cn } from "@/lib/utils"

function FeedSkeleton() {
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
          <div className="mt-4 h-20 rounded-xl bg-hover" />
        </div>
      ))}
    </div>
  )
}

export default function NewsFeedPage() {
  const { user, ready } = useCurrentUser()
  const [posts, setPosts] = useState<FeedPostWithImages[]>([])
  const [authors, setAuthors] = useState<Record<string, CurrentUser | null>>({})
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerMode, setComposerMode] = useState<"create" | "edit">("create")
  const [editingPost, setEditingPost] = useState<FeedPostWithImages | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const resolveAuthors = useCallback(async (items: FeedPostWithImages[]) => {
    const uniqueIds = [...new Set(items.map((post) => post.author_pbri_id))]
    const entries = await Promise.all(
      uniqueIds.map(async (studentId) => [studentId, await resolveAuthorForPbriId(studentId)] as const)
    )
    setAuthors((current) => ({
      ...current,
      ...Object.fromEntries(entries),
    }))
  }, [])

  const loadInitial = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const result = await fetchFeedPosts({ limit: 20 })
      setPosts(result.posts)
      setCursor(result.nextCursor)
      setHasMore(Boolean(result.nextCursor))
      await resolveAuthors(result.posts)
    } catch (error) {
      setLoadError(feedPostMutationErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [resolveAuthors])

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || isLoadingMore) return
    setIsLoadingMore(true)
    setLoadError(null)
    try {
      const result = await fetchFeedPosts({ cursor, limit: 20 })
      setPosts((current) => [...current, ...result.posts])
      setCursor(result.nextCursor)
      setHasMore(Boolean(result.nextCursor))
      await resolveAuthors(result.posts)
    } catch (error) {
      setLoadError(feedPostMutationErrorMessage(error))
    } finally {
      setIsLoadingMore(false)
    }
  }, [cursor, hasMore, isLoadingMore, resolveAuthors])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore])

  const openCreate = () => {
    setComposerMode("create")
    setEditingPost(null)
    setComposerOpen(true)
  }

  const openEdit = (post: FeedPostWithImages) => {
    setComposerMode("edit")
    setEditingPost(post)
    setComposerOpen(true)
  }

  const handleSaved = (saved: FeedPostWithImages) => {
    setPosts((current) => {
      const index = current.findIndex((post) => post.id === saved.id)
      if (index === -1) return [saved, ...current]
      const next = [...current]
      next[index] = saved
      return next
    })
    void resolveAuthors([saved])
  }

  const handleDelete = async (postId: string) => {
    setActionError(null)
    try {
      await deleteFeedPost(postId)
      setPosts((current) => current.filter((post) => post.id !== postId))
    } catch (error) {
      setActionError(feedPostMutationErrorMessage(error))
    }
  }

  const emptyState = useMemo(
    () => !isLoading && posts.length === 0 && !loadError,
    [isLoading, posts.length, loadError]
  )

  return (
    <main className={cn(PAGE_MAIN, "pb-10")}>
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-hover text-foreground">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                ฟีดข่าวสาร
              </h1>
              <p className="mt-0.5 text-sm text-muted">
                แชร์ข่าวสารและภาพกิจกรรมกับสมาชิก
              </p>
            </div>
          </div>
        </header>

        {ready && user ? (
          <button
            type="button"
            onClick={openCreate}
            className="mb-6 flex w-full items-center gap-3 rounded-2xl border border-border bg-sidebar px-4 py-3.5 text-left transition-colors hover:bg-hover"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-background">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-hover text-xs font-medium text-muted">
                  {user.displayName.slice(0, 1)}
                </div>
              )}
            </div>
            <span className="flex flex-1 items-center gap-2 text-sm text-muted">
              <PenLine className="h-4 w-4 shrink-0 opacity-70" />
              คุณกำลังคิดอะไรอยู่?
            </span>
          </button>
        ) : null}

      {actionError ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {actionError}
        </p>
      ) : null}

      {loadError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm text-red-700 dark:text-red-300">{loadError}</p>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void loadInitial()}>
            ลองใหม่
          </Button>
        </div>
      ) : null}

      {isLoading ? <FeedSkeleton /> : null}

      {emptyState ? (
        <div className="rounded-2xl border border-dashed border-border bg-hover/40 px-6 py-14 text-center">
          <p className="text-sm text-muted">
            ยังไม่มีโพสต์ — เป็นคนแรกที่แชร์ข่าวสาร
          </p>
          {user ? (
            <Button type="button" className="mt-4" onClick={openCreate}>
              สร้างโพสต์แรก
            </Button>
          ) : null}
        </div>
      ) : null}

      {posts.length > 0 ? (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
          {posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              author={authors[post.author_pbri_id] ?? null}
              currentUser={user}
              onEdit={openEdit}
              onDelete={(postId) => void handleDelete(postId)}
            />
          ))}
        </div>
      ) : null}

      {hasMore ? <div ref={sentinelRef} className="h-8" aria-hidden /> : null}
      {isLoadingMore ? (
        <p className="py-6 text-center text-sm text-muted">กำลังโหลด...</p>
      ) : null}

      {user ? (
        <FeedComposerDialog
          open={composerOpen}
          mode={composerMode}
          post={editingPost}
          author={user}
          onClose={() => setComposerOpen(false)}
          onSaved={handleSaved}
        />
      ) : null}
      </div>
    </main>
  )
}
