"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabaseClient"

export type CurrentUser = {
  studentId: string
  displayName: string
  email: string
  avatarUrl?: string
}

/** Temporary guest author while login is not required — matches demo seed data. */
export const GUEST_AUTHOR_PBRI_ID = "demo"

export function getAuthorPbriId(user: CurrentUser | null | undefined) {
  return user?.studentId ?? GUEST_AUTHOR_PBRI_ID
}

export const PROFILE_IMAGES_BUCKET = "images"
const PROFILE_IMAGE_PREFIX = "profile_images"

export function getPfpUrlForProfileId(profileId: number) {
  const normalizedId = Number(profileId)
  if (!Number.isFinite(normalizedId) || normalizedId < 1) return undefined

  const path = `${PROFILE_IMAGE_PREFIX}/pfp_${normalizedId}.JPG`
  const { data } = supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .getPublicUrl(path)
  return data.publicUrl
}

export function pbriIdFromEmail(email: string) {
  return email.split("@")[0]?.trim() ?? ""
}

type ProfileRow = {
  id: number
  full_name_th: string | null
  nickname_th: string | null
  pbri_id: string | number
}

async function fetchProfileByPbriId(studentId: string) {
  const normalizedId = studentId.trim()
  if (!normalizedId) return null

  const select = "id, full_name_th, nickname_th, pbri_id"

  if (/^\d+$/.test(normalizedId)) {
    const numericId = Number(normalizedId)
    const { data, error } = await supabase
      .from("profiles")
      .select(select)
      .eq("pbri_id", numericId)
      .maybeSingle()

    if (error) throw error
    if (data) return data as ProfileRow
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(select)
    .eq("pbri_id", normalizedId)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as ProfileRow | null
}

function avatarUrlForProfile(profile: ProfileRow | null) {
  if (profile?.id == null) return undefined
  return getPfpUrlForProfileId(profile.id)
}

export async function resolveAuthorForPbriId(studentId: string): Promise<CurrentUser | null> {
  const normalizedId = studentId.trim()
  if (!normalizedId) return null

  const profile = await fetchProfileByPbriId(normalizedId)
  const resolvedStudentId =
    profile?.pbri_id != null ? String(profile.pbri_id) : normalizedId
  const displayName =
    profile?.nickname_th?.trim() ||
    profile?.full_name_th?.trim() ||
    resolvedStudentId
  const avatarUrl = avatarUrlForProfile(profile)

  return {
    studentId: resolvedStudentId,
    displayName,
    email: "",
    avatarUrl,
  }
}

export async function resolveUserProfile(email: string): Promise<CurrentUser | null> {
  const studentId = pbriIdFromEmail(email)
  if (!studentId) return null

  const profile = await fetchProfileByPbriId(studentId)
  const resolvedStudentId = profile?.pbri_id != null ? String(profile.pbri_id) : studentId
  const displayName =
    profile?.nickname_th?.trim() ||
    profile?.full_name_th?.trim() ||
    resolvedStudentId
  const avatarUrl = avatarUrlForProfile(profile)

  const user: CurrentUser = {
    studentId: resolvedStudentId,
    displayName,
    email,
    avatarUrl,
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("pistar_user", JSON.stringify(user))
  }

  return user
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const applyUser = async (email: string | undefined | null) => {
      if (!email) {
        if (!cancelled) {
          setUser(null)
          localStorage.removeItem("pistar_user")
        }
        return
      }

      try {
        const cached = localStorage.getItem("pistar_user")
        if (cached) {
          const parsed = JSON.parse(cached) as CurrentUser
          if (parsed.email === email && parsed.displayName && !cancelled) {
            setUser(parsed)
          }
        }
      } catch {
        /* ignore bad cache */
      }

      try {
        const profile = await resolveUserProfile(email)
        if (!cancelled) setUser(profile)
      } catch (error) {
        console.error("Failed to resolve user profile", error)
        if (!cancelled) {
          const studentId = pbriIdFromEmail(email)
          if (studentId) {
            setUser({
              studentId,
              displayName: studentId,
              email,
            })
          }
        }
      }
    }

    const init = async () => {
      const { data } = await supabase.auth.getSession()
      await applyUser(data.session?.user?.email)
      if (!cancelled) setReady(true)
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyUser(session?.user?.email)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return { user, ready }
}
