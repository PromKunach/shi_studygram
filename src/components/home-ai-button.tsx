"use client";

import { Astroid } from "lucide-react";
import { GoogleGeminiThinkingLogo } from "@/components/google-gemini-thinking-logo";
import { cn } from "@/lib/utils";

type HomeAiButtonProps = {
  active: boolean;
  thinking?: boolean;
  onToggle: () => void;
};

export function HomeAiButton({ active, thinking = false, onToggle }: HomeAiButtonProps) {
  return (
    <button
      type="button"
      aria-label="AI assistant"
      aria-pressed={active}
      aria-busy={thinking}
      data-active={active ? "true" : "false"}
      data-thinking={thinking ? "true" : "false"}
      onClick={onToggle}
      className={cn("home-ai-button group relative isolate h-10 w-10 shrink-0")}
    >
      <span aria-hidden className="home-ai-button__aura overflow-hidden rounded-full">
        <span className="home-ai-button__gradient" />
      </span>

      <span
        className={cn(
          "home-ai-button__face relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-full",
          "border border-border bg-sidebar text-muted",
          "transition-colors duration-200 hover:bg-hover hover:text-foreground",
          active && "text-foreground"
        )}
      >
        {thinking ? (
          <GoogleGeminiThinkingLogo size={28} />
        ) : (
          <Astroid
            className={cn(
              "h-4 w-4 transition-[fill] duration-200",
              active && "fill-current"
            )}
            strokeWidth={active ? 2.25 : 1.75}
          />
        )}
      </span>
    </button>
  );
}
