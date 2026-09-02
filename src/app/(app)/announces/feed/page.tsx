"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { LayoutGrid, Megaphone, Plus } from "lucide-react"

import {
  AnnouncementFeedCard,
  AnnouncementFeedSkeleton,
  AnnouncementViewToggle,
} from "@/components/announces/announcement-feed-card"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  announcementMutationErrorMessage,
  fetchAnnouncements,
  resolveAuthorsForRecords,
  type AnnouncementRecord,
} from "@/lib/announcements"
import { PAGE_MAIN } from "@/lib/layout"
import { useCurrentUser, type CurrentUser } from "@/lib/userProfile"
import { cn } from "@/lib/utils"

export default function AnnouncementBoardFeedPage() {
  const { user } = useCurrentUser()
  const [records, setRecords] = useState<AnnouncementRecord[]>([])
  const [authors, setAuthors] = useState<Map<string, CurrentUser>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const nextRecords = await fetchAnnouncements()
      const nextAuthors = await resolveAuthorsForRecords(nextRecords)
      setRecords(nextRecords)
      setAuthors(nextAuthors)
    } catch (error) {
      setLoadError(announcementMutationErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const emptyState = useMemo(
    () => !isLoading && records.length === 0 && !loadError,
    [isLoading, records.length, loadError]
  )

  return (
    <main className={cn(PAGE_MAIN, "pb-10")}>
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-hover text-foreground">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  ฟีดโน้ตประกาศ
                </h1>
                <p className="mt-0.5 text-sm text-muted">
                  ดูโน้ตและบอร์ดล่าสุดแบบฟีด
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <AnnouncementViewToggle active="feed" />
              {user ? (
                <Link
                  href="/announces"
                  className={buttonVariants({ size: "sm" })}
                >
                  <Plus className="me-1.5 h-4 w-4" />
                  เพิ่ม
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        {loadError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-300">{loadError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => void load()}
            >
              ลองใหม่
            </Button>
          </div>
        ) : null}

        {isLoading ? <AnnouncementFeedSkeleton /> : null}

        {emptyState ? (
          <div className="rounded-2xl border border-dashed border-border bg-hover/40 px-6 py-14 text-center">
            <LayoutGrid className="mx-auto mb-3 h-8 w-8 text-muted" />
            <p className="text-sm text-muted">ยังไม่มีโน้ตประกาศ</p>
            {user ? (
              <Link href="/announces" className={buttonVariants({ className: "mt-4" })}>
                สร้างโน้ตแรก
              </Link>
            ) : null}
          </div>
        ) : null}

        {records.length > 0 ? (
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
            {records.map((record) => (
              <AnnouncementFeedCard
                key={record.id}
                record={record}
                author={authors.get(record.author_pbri_id) ?? null}
              />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  )
}
