# Notion Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Notion-inspired app shell with a themed sidebar, minimal home page greeting, and light/dark mode switching.

**Architecture:** shadcn/ui Sidebar primitive inside a route-group app shell. All colors flow through semantic CSS variables in `globals.css`, toggled by `next-themes` via a `dark` class on `<html>`. Inter + Noto Sans Thai loaded via `next/font/google`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, next-themes, lucide-react, Vitest

## Global Constraints

- Theme switching: light / dark only
- Data source: static placeholder data in code
- Home page: greeting + empty content area
- Sidebar: primary focus — nav links + theme toggle at bottom
- UI library: shadcn/ui + next-themes
- Styling: Tailwind CSS v4 with semantic CSS variables — no raw color utilities (`bg-zinc-800`, `text-gray-400`)
- English font: Inter (weights 400, 500, 600, 700)
- Thai font: Noto Sans Thai (weights 400, 500, 600, 700)
- Sidebar width: ~240px, not collapsible in v1
- Placeholder pages: 3–4 items with emoji icons, non-functional links
- Out of scope: Supabase, auth, search, mobile responsive, real routing

## File Map

| File | Responsibility |
|------|---------------|
| `src/lib/utils.ts` | shadcn `cn()` helper |
| `src/lib/greeting.ts` | Pure function: time-of-day greeting |
| `src/lib/greeting.test.ts` | Unit tests for greeting |
| `src/lib/placeholder-pages.ts` | Static sidebar page list |
| `src/components/theme-provider.tsx` | `next-themes` wrapper |
| `src/components/theme-toggle.tsx` | Sun/moon toggle button |
| `src/components/app-sidebar.tsx` | Sidebar: workspace, nav, pages, toggle |
| `src/components/ui/*` | shadcn primitives (button, sidebar, etc.) |
| `src/app/globals.css` | All design tokens (light + dark) |
| `src/app/layout.tsx` | Root: fonts, ThemeProvider, metadata |
| `src/app/(app)/layout.tsx` | App shell: SidebarProvider + AppSidebar + main |
| `src/app/(app)/page.tsx` | Home: greeting + empty content zone |

---

### Task 1: Install dependencies and initialize shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx` (via shadcn CLI)
- Create: `src/components/ui/sidebar.tsx` (via shadcn CLI)
- Create: `src/components/ui/tooltip.tsx` (via shadcn CLI — sidebar dependency)
- Create: `src/components/ui/separator.tsx` (via shadcn CLI — sidebar dependency)
- Create: `src/components/ui/sheet.tsx` (via shadcn CLI — sidebar dependency)
- Create: `src/components/ui/skeleton.tsx` (via shadcn CLI — sidebar dependency)
- Create: `src/components/ui/input.tsx` (via shadcn CLI — sidebar dependency)
- Modify: `package.json`
- Test: N/A (setup task)

**Interfaces:**
- Consumes: nothing
- Produces: `cn(...inputs: ClassValue[]): string` from `src/lib/utils.ts`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install next-themes lucide-react clsx tailwind-merge class-variance-authority
```

- [ ] **Step 2: Install dev dependencies for testing**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -y -b neutral
```

When prompted or via defaults, confirm:
- Style: `new-york`
- Base color: `neutral`
- CSS variables: `yes`
- `src/` directory: `yes`
- Import alias: `@/*`

- [ ] **Step 4: Add shadcn components**

```bash
npx shadcn@latest add button sidebar tooltip separator sheet skeleton input -y
```

- [ ] **Step 5: Add Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 6: Add test script to package.json**

Add to `"scripts"` in `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Verify install**

```bash
npm run build
```

Expected: PASS (may still show default Next.js page)

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json components.json vitest.config.ts src/lib/utils.ts src/components/ui/
git commit -m "chore: install shadcn/ui, next-themes, and vitest"
```

---

### Task 2: Design tokens and theme provider

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/theme-provider.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `cn()` from `src/lib/utils.ts`
- Produces: `ThemeProvider` component — wraps children with `next-themes` `ThemeProvider`

- [ ] **Step 1: Replace globals.css with full token set**

Replace entire contents of `src/app/globals.css`:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --sidebar: #f7f7f5;
  --foreground: #37352f;
  --muted: #9b9a97;
  --border: #e9e9e7;
  --accent: #2383e2;
  --hover: #efefef;
}

.dark {
  --background: #191919;
  --sidebar: #202020;
  --foreground: #e6e6e5;
  --muted: #7a7a78;
  --border: #2f2f2f;
  --accent: #529cca;
  --hover: #2a2a2a;
}

@theme inline {
  --color-background: var(--background);
  --color-sidebar: var(--sidebar);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-hover: var(--hover);
  --font-sans: var(--font-inter), var(--font-noto-sans-thai), ui-sans-serif, system-ui, sans-serif;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Create theme-provider.tsx**

Create `src/components/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

- [ ] **Step 3: Update root layout with fonts and ThemeProvider**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
});

export const metadata: Metadata = {
  title: "shi_studygram",
  description: "A Notion-inspired study workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/components/theme-provider.tsx
git commit -m "feat: add design tokens, Inter/Noto Sans Thai fonts, and theme provider"
```

---

### Task 3: Greeting utility (TDD)

**Files:**
- Create: `src/lib/greeting.ts`
- Create: `src/lib/greeting.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `getGreeting(date?: Date): string` — returns `"Good morning"`, `"Good afternoon"`, or `"Good evening"`

- [ ] **Step 1: Write the failing test**

Create `src/lib/greeting.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getGreeting } from "./greeting";

describe("getGreeting", () => {
  it("returns Good morning before noon", () => {
    expect(getGreeting(new Date("2026-01-01T08:00:00"))).toBe("Good morning");
  });

  it("returns Good afternoon between noon and 6pm", () => {
    expect(getGreeting(new Date("2026-01-01T14:00:00"))).toBe("Good afternoon");
  });

  it("returns Good evening after 6pm", () => {
    expect(getGreeting(new Date("2026-01-01T20:00:00"))).toBe("Good evening");
  });

  it("returns Good morning at exactly midnight", () => {
    expect(getGreeting(new Date("2026-01-01T00:00:00"))).toBe("Good morning");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL with "Cannot find module './greeting'" or "getGreeting is not defined"

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/greeting.ts`:

```typescript
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/greeting.ts src/lib/greeting.test.ts
git commit -m "feat: add time-based greeting utility with tests"
```

---

### Task 4: Theme toggle and placeholder data

**Files:**
- Create: `src/components/theme-toggle.tsx`
- Create: `src/lib/placeholder-pages.ts`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`, `useTheme` from `next-themes`, `Sun`/`Moon` from `lucide-react`
- Produces:
  - `ThemeToggle` — client component, no props, renders sun/moon button
  - `PLACEHOLDER_PAGES` — `readonly { icon: string; title: string }[]`

- [ ] **Step 1: Create placeholder data**

Create `src/lib/placeholder-pages.ts`:

```typescript
export const PLACEHOLDER_PAGES = [
  { icon: "🌐", title: "English" },
  { icon: "💋", title: "Idioms" },
  { icon: "⭐", title: "Best-pick" },
  { icon: "📄", title: "Notes" },
] as const;
```

- [ ] **Step 2: Create theme-toggle.tsx**

Create `src/components/theme-toggle.tsx`:

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted hover:bg-hover hover:text-foreground"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/theme-toggle.tsx src/lib/placeholder-pages.ts
git commit -m "feat: add theme toggle and placeholder page data"
```

---

### Task 5: App sidebar

**Files:**
- Create: `src/components/app-sidebar.tsx`

**Interfaces:**
- Consumes:
  - `PLACEHOLDER_PAGES` from `@/lib/placeholder-pages`
  - `ThemeToggle` from `@/components/theme-toggle`
  - shadcn `Sidebar`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupContent`, `SidebarGroupLabel`, `SidebarHeader`, `SidebarMenu`, `SidebarMenuButton`, `SidebarMenuItem` from `@/components/ui/sidebar`
  - `Home` from `lucide-react`
- Produces: `AppSidebar` — no props, renders full sidebar

- [ ] **Step 1: Create app-sidebar.tsx**

Create `src/components/app-sidebar.tsx`:

```tsx
"use client";

import { Home } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLACEHOLDER_PAGES } from "@/lib/placeholder-pages";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar className="border-border bg-sidebar text-foreground">
      <SidebarHeader className="px-3 py-4">
        <span className="text-sm font-medium text-muted">
          shi_studygram
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive
                  className="text-[14px] leading-[1.4] hover:bg-hover data-[active=true]:bg-hover data-[active=true]:text-accent"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted">
            Pages
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PLACEHOLDER_PAGES.map((page) => (
                <SidebarMenuItem key={page.title}>
                  <SidebarMenuButton
                    className="text-[14px] leading-[1.4] hover:bg-hover"
                    onClick={(e) => e.preventDefault()}
                  >
                    <span className="text-base">{page.icon}</span>
                    <span>{page.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="flex items-center justify-end px-2 py-2">
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/app-sidebar.tsx
git commit -m "feat: add app sidebar with nav and theme toggle"
```

---

### Task 6: App shell layout and home page

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/page.tsx`
- Delete: `src/app/page.tsx`

**Interfaces:**
- Consumes:
  - `AppSidebar` from `@/components/app-sidebar`
  - `getGreeting` from `@/lib/greeting`
  - `SidebarProvider`, `SidebarInset` from `@/components/ui/sidebar`
- Produces: route group layout wrapping all app pages; home page with greeting

- [ ] **Step 1: Create app shell layout**

Create `src/app/(app)/layout.tsx`:

```tsx
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="bg-background">{children}</SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 2: Create home page**

Create `src/app/(app)/page.tsx`:

```tsx
import { getGreeting } from "@/lib/greeting";

export default function HomePage() {
  const greeting = getGreeting();

  return (
    <main className="flex h-full flex-col px-16 py-12">
      <h1 className="text-[32px] font-semibold leading-[1.2] text-foreground">
        {greeting}
      </h1>
      <div className="mt-8 flex-1" />
    </main>
  );
}
```

- [ ] **Step 3: Delete old root page**

```bash
rm src/app/page.tsx
```

On Windows PowerShell:

```powershell
Remove-Item src/app/page.tsx
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/layout.tsx src/app/(app)/page.tsx
git rm src/app/page.tsx
git commit -m "feat: add app shell layout and home page with greeting"
```

---

### Task 7: Final verification

**Files:**
- Modify: none (verification only)
- Test: `src/lib/greeting.test.ts`

**Interfaces:**
- Consumes: all prior tasks
- Produces: verified, buildable app matching all success criteria

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: PASS (4 tests)

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: PASS (fix any errors before proceeding)

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: PASS

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Open http://localhost:3000 and verify:

1. Sidebar on the left (~240px) with "shi_studygram", Home, 4 placeholder pages
2. Greeting text on the right ("Good morning/afternoon/evening")
3. Click theme toggle — page switches light/dark, all elements use themed colors
4. Reload page — theme preference persists
5. Inspect sidebar item hover states

- [ ] **Step 5: Commit any lint fixes**

```bash
git add -A
git commit -m "chore: fix lint issues from notion shell implementation"
```

Only run this step if Step 2 required changes.

---

## Spec Coverage Checklist

| Spec requirement | Task |
|-----------------|------|
| Light/dark theme switching | Task 2, 4 |
| Semantic CSS tokens only | Task 2 |
| Inter + Noto Sans Thai fonts | Task 2 |
| Sidebar with Home + placeholders | Task 4, 5 |
| Theme toggle at sidebar bottom | Task 4, 5 |
| Greeting + empty content area | Task 3, 6 |
| Static placeholder data | Task 4 |
| `npm run build` passes | Task 7 |
| No Supabase/auth/routing | Out of scope — not included |

## Success Criteria Mapping

1. Sidebar left + greeting right → Task 6
2. Theme toggle persists → Task 2, 4, 7
3. Semantic tokens only → Task 2, 5, 6
4. Sidebar hover states → Task 5
5. Time-based greeting → Task 3, 6
6. Build passes → Task 7
7. Inter + Noto Sans Thai → Task 2
