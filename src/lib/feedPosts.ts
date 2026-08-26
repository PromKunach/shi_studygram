import type { CurrentUser } from "@/lib/userProfile"
import { getAuthorPbriId } from "@/lib/userProfile"
import { supabase } from "@/lib/supabaseClient"

export const MAX_FEED_IMAGES = 10
const FEED_IMAGE_BUCKET = "images"
const FEED_IMAGE_PREFIX = "images/feed"

export type FeedPostRecord = {
  id: string
  author_pbri_id: string
  body: string
  created_at: string
  updated_at: string
}

export type FeedPostImageRecord = {
  id: string
  post_id: string
  storage_path: string
  position: number
  created_at: string
}

export type FeedPostWithImages = FeedPostRecord & {
  images: FeedPostImageRecord[]
}

type FeedPostRow = FeedPostRecord & {
  feed_post_images: FeedPostImageRecord[] | null
}

type FetchFeedPostsOptions = {
  limit?: number
  cursor?: string | null
}

type CreateFeedPostInput = {
  body: string
  imageFiles: File[]
  author: CurrentUser
}

type UpdateFeedPostInput = {
  body: string
  newImageFiles: File[]
  keepImageIds: string[]
  author: CurrentUser
}

function sortImages(images: FeedPostImageRecord[]) {
  return [...images].sort((left, right) => left.position - right.position)
}

function rowToFeedPost(row: FeedPostRow): FeedPostWithImages {
  return {
    id: row.id,
    author_pbri_id: row.author_pbri_id,
    body: row.body,
    created_at: row.created_at,
    updated_at: row.updated_at,
    images: sortImages(row.feed_post_images ?? []),
  }
}

function encodeCursor(post: FeedPostRecord) {
  return btoa(JSON.stringify({ created_at: post.created_at, id: post.id }))
}

function decodeCursor(cursor: string) {
  const parsed = JSON.parse(atob(cursor)) as { created_at?: string; id?: string }
  if (!parsed.created_at || !parsed.id) {
    throw new Error("ไม่สามารถโหลดโพสต์เพิ่มเติมได้")
  }
  return { created_at: parsed.created_at, id: parsed.id }
}

function extensionForFile(file: File) {
  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  return "jpg"
}

function buildStoragePath(postId: string, imageId: string, file: File) {
  return `${FEED_IMAGE_PREFIX}/${postId}/${imageId}.${extensionForFile(file)}`
}

export function getFeedPostImageUrl(storagePath: string) {
  const { data } = supabase.storage.from(FEED_IMAGE_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export function isFeedPostEmpty(body: string, imageCount: number) {
  return body.trim().length === 0 && imageCount === 0
}

export function formatFeedPostTime(iso: string) {
  const date = new Date(iso)
  const now = Date.now()
  const diffMs = now - date.getTime()

  if (diffMs < 60_000) return "เมื่อสักครู่"
  if (diffMs < 3_600_000) {
    const minutes = Math.max(1, Math.floor(diffMs / 60_000))
    return `${minutes} นาทีที่แล้ว`
  }
  if (diffMs < 86_400_000) {
    const hours = Math.max(1, Math.floor(diffMs / 3_600_000))
    return `${hours} ชั่วโมงที่แล้ว`
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "เมื่อวาน"
  }

  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  })
}

export function formatFeedPostDateTime(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function feedPostMutationErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message)
    if (message.includes("feed_posts")) {
      return "ไม่สามารถบันทึกโพสต์ได้ กรุณาลองใหม่"
    }
    if (message.includes("storage")) {
      return "ไม่สามารถอัปโหลดรูปได้ กรุณาลองใหม่"
    }
    if (message) return message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return "เกิดข้อผิดพลาด กรุณาลองใหม่"
}

async function uploadFeedImages(postId: string, imageFiles: File[], startPosition: number) {
  const uploaded: FeedPostImageRecord[] = []

  for (const [index, file] of imageFiles.entries()) {
    const imageId = crypto.randomUUID()
    const storagePath = buildStoragePath(postId, imageId, file)

    const { error: uploadError } = await supabase.storage
      .from(FEED_IMAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      })

    if (uploadError) throw uploadError

    const { data, error } = await supabase
      .from("feed_post_images")
      .insert({
        id: imageId,
        post_id: postId,
        storage_path: storagePath,
        position: startPosition + index,
      })
      .select("id, post_id, storage_path, position, created_at")
      .single()

    if (error) throw error
    uploaded.push(data as FeedPostImageRecord)
  }

  return uploaded
}

async function removeFeedImages(images: FeedPostImageRecord[]) {
  if (images.length === 0) return

  const paths = images.map((image) => image.storage_path)
  const ids = images.map((image) => image.id)

  const { error: storageError } = await supabase.storage
    .from(FEED_IMAGE_BUCKET)
    .remove(paths)

  if (storageError) throw storageError

  const { error } = await supabase.from("feed_post_images").delete().in("id", ids)
  if (error) throw error
}

async function fetchFeedPostById(postId: string) {
  const { data, error } = await supabase
    .from("feed_posts")
    .select(
      "id, author_pbri_id, body, created_at, updated_at, feed_post_images (id, post_id, storage_path, position, created_at)"
    )
    .eq("id", postId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error("ไม่พบโพสต์นี้")
  return rowToFeedPost(data as FeedPostRow)
}

export async function fetchFeedPosts({
  limit = 20,
  cursor = null,
}: FetchFeedPostsOptions = {}) {
  let query = supabase
    .from("feed_posts")
    .select(
      "id, author_pbri_id, body, created_at, updated_at, feed_post_images (id, post_id, storage_path, position, created_at)"
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    const { created_at, id } = decodeCursor(cursor)
    query = query.or(`created_at.lt.${created_at},and(created_at.eq.${created_at},id.lt.${id})`)
  }

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []) as FeedPostRow[]
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const posts = page.map(rowToFeedPost)
  const nextCursor = hasMore && page.length > 0 ? encodeCursor(page[page.length - 1]) : null

  return { posts, nextCursor }
}

export async function createFeedPost({
  body,
  imageFiles,
  author,
}: CreateFeedPostInput): Promise<FeedPostWithImages> {
  const authorPbriId = getAuthorPbriId(author)
  const trimmedBody = body.trim()

  if (isFeedPostEmpty(trimmedBody, imageFiles.length)) {
    throw new Error("กรุณาใส่ข้อความหรือรูปภาพ")
  }

  if (imageFiles.length > MAX_FEED_IMAGES) {
    throw new Error(`อัปโหลดรูปได้สูงสุด ${MAX_FEED_IMAGES} รูป`)
  }

  const { data: post, error } = await supabase
    .from("feed_posts")
    .insert({
      author_pbri_id: authorPbriId,
      body: trimmedBody,
    })
    .select("id, author_pbri_id, body, created_at, updated_at")
    .single()

  if (error) throw error

  const images = await uploadFeedImages(post.id, imageFiles, 0)
  return { ...(post as FeedPostRecord), images }
}

export async function updateFeedPost(
  postId: string,
  { body, newImageFiles, keepImageIds, author }: UpdateFeedPostInput
): Promise<FeedPostWithImages> {
  const authorPbriId = getAuthorPbriId(author)
  const trimmedBody = body.trim()
  const existing = await fetchFeedPostById(postId)

  if (existing.author_pbri_id !== authorPbriId) {
    throw new Error("คุณไม่มีสิทธิ์แก้ไขโพสต์นี้")
  }

  const keepIds = new Set(keepImageIds)
  const removedImages = existing.images.filter((image) => !keepIds.has(image.id))
  const keptImages = existing.images.filter((image) => keepIds.has(image.id))
  const totalImages = keptImages.length + newImageFiles.length

  if (isFeedPostEmpty(trimmedBody, totalImages)) {
    throw new Error("กรุณาใส่ข้อความหรือรูปภาพ")
  }

  if (totalImages > MAX_FEED_IMAGES) {
    throw new Error(`อัปโหลดรูปได้สูงสุด ${MAX_FEED_IMAGES} รูป`)
  }

  await removeFeedImages(removedImages)

  const { error: updateError } = await supabase
    .from("feed_posts")
    .update({ body: trimmedBody })
    .eq("id", postId)
    .eq("author_pbri_id", authorPbriId)

  if (updateError) throw updateError

  const uploadedImages = await uploadFeedImages(
    postId,
    newImageFiles,
    keptImages.length
  )

  return fetchFeedPostById(postId)
}

export async function deleteFeedPost(postId: string) {
  const existing = await fetchFeedPostById(postId)
  await removeFeedImages(existing.images)

  const { error } = await supabase.from("feed_posts").delete().eq("id", postId)
  if (error) throw error
}
