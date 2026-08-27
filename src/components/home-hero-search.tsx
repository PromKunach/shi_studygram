"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { HomeAiButton } from "@/components/home-ai-button";
import { Input } from "@/components/ui/input";

const AI_PLACEHOLDER = "ยกระดับการค้นหาด้วย AI, ลอง /ค้นหา";

function AiPlaceholderText({ text }: { text: string }) {
  return (
    <span className="home-ai-search-placeholder text-sm text-muted">
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          className="inline-block"
          style={char === " " ? { width: "0.3em" } : undefined}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.18,
            delay: index * 0.035,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

export function HomeHeroSearch() {
  const [aiActive, setAiActive] = useState(false);
  const [query, setQuery] = useState("");
  const showAiPlaceholder = aiActive && query.length === 0;

  return (
    <div className="flex w-full items-center gap-2.5">
      <HomeAiButton
        active={aiActive}
        onToggle={() => setAiActive((current) => !current)}
      />

      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={aiActive ? "" : "ค้นหา..."}
          className="h-10 rounded-full border-border bg-sidebar pl-9 shadow-none"
          aria-label={aiActive ? "ถาม AI" : "ค้นหา"}
        />
        <AnimatePresence>
          {showAiPlaceholder ? (
            <motion.div
              key="ai-placeholder"
              className="pointer-events-none absolute inset-y-0 left-9 flex items-center overflow-hidden pr-3"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <AiPlaceholderText text={AI_PLACEHOLDER} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
