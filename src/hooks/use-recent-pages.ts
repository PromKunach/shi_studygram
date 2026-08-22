"use client";

import { useSyncExternalStore } from "react";
import {
  getRecentPagesSnapshot,
  getServerRecentPagesSnapshot,
  subscribeRecentPages,
  type RecentPageRecord,
} from "@/lib/recent-pages";

export function useRecentPages(): RecentPageRecord[] {
  return useSyncExternalStore(
    subscribeRecentPages,
    getRecentPagesSnapshot,
    getServerRecentPagesSnapshot
  );
}
