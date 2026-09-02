"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, LayoutGrid, Loader2, Megaphone, Pencil, X } from "lucide-react";
import {
  fetchAnnouncements,
  type AnnouncementRecord,
} from "@/lib/announcements";
import { cn } from "@/lib/utils";

type DocumentBoardEmbedBlockProps = {
  boardId: string | null;
  boardName: string;
  readOnly?: boolean;
  onChange: (patch: { boardId: string | null; boardName: string }) => void;
  onRemove: () => void;
};

export function DocumentBoardEmbedBlock({
  boardId,
  boardName,
  readOnly = false,
  onChange,
  onRemove,
}: DocumentBoardEmbedBlockProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(!boardId);

  const loadAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const records = await fetchAnnouncements();
      setAnnouncements(records);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "โหลดรายการบอร์ดไม่สำเร็จ"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPickerOpen || boardId) return;
    void loadAnnouncements();
  }, [boardId, isPickerOpen, loadAnnouncements]);

  const handleSelect = (record: AnnouncementRecord) => {
    onChange({ boardId: record.id, boardName: record.name });
    setIsPickerOpen(false);
  };

  const openFullBoard = () => {
    if (!boardId) return;
    window.open(`/announces/${boardId}`, "_blank", "noopener,noreferrer");
  };

  if (!boardId || isPickerOpen) {
    return (
      <div className="my-2 w-full overflow-hidden rounded-xl border border-border bg-muted/30">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Megaphone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="truncate text-sm font-medium text-foreground">
              เลือกบอร์ดประกาศ
            </p>
          </div>
          {!readOnly ? (
            <button
              type="button"
              onClick={onRemove}
              className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="ลบบล็อกบอร์ด"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="max-h-72 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังโหลดบอร์ด...
            </div>
          ) : loadError ? (
            <div className="space-y-3 py-4 text-center">
              <p className="text-sm text-destructive">{loadError}</p>
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() => void loadAnnouncements()}
                  className="cursor-pointer text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  ลองอีกครั้ง
                </button>
              ) : null}
            </div>
          ) : announcements.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              ยังไม่มีบอร์ดประกาศ
            </p>
          ) : (
            <ul className="space-y-1.5">
              {announcements.map((record) => (
                <li key={record.id}>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => handleSelect(record)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors",
                      readOnly
                        ? "cursor-default opacity-70"
                        : "cursor-pointer hover:bg-muted"
                    )}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                      style={{
                        backgroundColor: record.card_color,
                        color: record.text_color,
                      }}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {record.name}
                      </span>
                      {record.description ? (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {record.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group/board my-2 w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Megaphone className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="truncate text-sm font-medium text-foreground">
            {boardName || "บอร์ดประกาศ"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={openFullBoard}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            เปิดเต็ม
          </button>
          {!readOnly ? (
            <>
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
                เปลี่ยน
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="ลบบล็อกบอร์ด"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="relative h-[28rem] w-full bg-sidebar sm:h-[32rem]">
        <iframe
          title={boardName ? `บอร์ด ${boardName}` : "บอร์ดประกาศ"}
          src={`/announces/${boardId}?embed=1`}
          className="pointer-events-auto h-full w-full border-0"
        />
      </div>
    </div>
  );
}
