import Image from "next/image"

export function FeedPostAvatar({
  avatarUrl,
  label,
}: {
  avatarUrl?: string
  label: string
}) {
  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-sidebar">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          fill
          unoptimized
          className="object-cover"
          sizes="44px"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-hover text-sm font-medium text-muted">
          {label.slice(0, 1)}
        </div>
      )}
    </div>
  )
}
