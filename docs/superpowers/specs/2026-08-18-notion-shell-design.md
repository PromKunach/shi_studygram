# Notion Shell — Sidebar, Home Page & Theme System

**Date:** 2026-08-18  
**Status:** Approved  
**Scope:** v1 UI shell — layout, theming, placeholder content

## Summary

Build a Notion-inspired app shell for shistudygram: a fixed sidebar with navigation and a minimal home page with a time-based greeting. All UI elements share a single theme system with light/dark mode switching. Content and database integration are deferred.

## Requirements

| Requirement | Decision |
|-------------|----------|
| Theme switching | Light / dark only |
| Data source | Static placeholder data in code |
| Home page | Greeting + empty content area |
| Sidebar | Primary focus — nav links + theme toggle |
| UI library | shadcn/ui + next-themes |
| Styling | Tailwind CSS v4 with semantic CSS variables |

## Architecture

### Layout

```
┌─────────────────────────────────────────┐
│  App Shell (full viewport height)       │
│ ┌──────────┬──────────────────────────┐ │
│ │ Sidebar  │  Main Content Area       │ │
│ │ (240px)  │                          │ │
│ │          │  "Good afternoon"        │ │
│ │ Home     │                          │ │
│ │ ───────  │  (empty content area)    │ │
│ │ Page 1   │                          │ │
│ │ Page 2   │                          │ │
│ │          │                          │ │
│ │ [theme]  │                          │ │
│ └──────────┴──────────────────────────┘ │
└─────────────────────────────────────────┘
```

- **App shell** wraps every page via a route group layout (`src/app/(app)/layout.tsx`)
- **Sidebar** is fixed-width (~240px), not collapsible in v1
- **Main area** scrolls independently
- **Home page** shows a time-based greeting and an empty content zone
- Sidebar page links are placeholders with no real routes

### Theme System

`next-themes` manages light/dark state, persisted in `localStorage`. All colors are CSS variables in `globals.css` — no hardcoded hex in components.

| Token | Light | Dark | Used for |
|-------|-------|------|----------|
| `--background` | `#ffffff` | `#191919` | Main content area |
| `--sidebar` | `#f7f7f5` | `#202020` | Sidebar background |
| `--foreground` | `#37352f` | `#e6e6e5` | Primary text |
| `--muted` | `#9b9a97` | `#7a7a78` | Secondary text, icons |
| `--border` | `#e9e9e7` | `#2f2f2f` | Dividers, card edges |
| `--accent` | `#2383e2` | `#529cca` | Active nav item, links |
| `--hover` | `#efefef` | `#2a2a2a` | Row hover states |

**Rules:**
- Toggle adds/removes `dark` class on `<html>`
- Components use only semantic tokens via Tailwind (`bg-sidebar`, `text-muted`, etc.)
- No raw color utilities (`bg-zinc-800`, `text-gray-400`)
- Theme toggle is a sun/moon button at the bottom of the sidebar
- First visit respects system preference; choice is remembered across sessions

### File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root: fonts, ThemeProvider
│   ├── globals.css             # Design tokens (light + dark)
│   └── (app)/
│       ├── layout.tsx          # App shell: Sidebar + main area
│       └── page.tsx            # Home: greeting + empty zone
├── components/
│   ├── app-sidebar.tsx         # Sidebar nav + page list + theme toggle
│   ├── theme-provider.tsx      # next-themes wrapper
│   ├── theme-toggle.tsx        # Sun/moon button
│   └── ui/                     # shadcn primitives
└── lib/
    └── utils.ts                # shadcn cn() helper
```

### Components

| Component | Responsibility |
|-----------|---------------|
| `AppSidebar` | Workspace name, Home link, placeholder page list, theme toggle at bottom |
| `ThemeToggle` | Sun/moon icon button calling `next-themes` |
| `ThemeProvider` | Wraps app, handles persistence and system default |
| Home page (`page.tsx`) | Time-based greeting ("Good morning/afternoon/evening") + empty content div |

### Placeholder Data

Sidebar shows 3–4 hardcoded pages with emoji icons (e.g. "English", "Idioms", "Best-pick"). Links are non-functional placeholders.

## Dependencies to Install

- `next-themes` — theme state management
- `shadcn/ui` — Sidebar, Button, and base primitives
- `lucide-react` — icons (sun, moon, home, file)
- `class-variance-authority`, `clsx`, `tailwind-merge` — shadcn utilities

## Out of Scope (v1)

- Supabase / database
- Authentication
- Page editing or creation
- Search
- Collapsible sidebar
- Mobile responsive layout (desktop-first)
- Recently visited cards, upcoming events
- Real page routing

## Success Criteria

1. App loads with sidebar on the left and greeting on the right
2. Light/dark toggle works and persists across page reloads
3. Every visible element uses semantic theme tokens — no hardcoded colors
4. Sidebar shows Home + placeholder pages with hover states
5. Greeting changes based on time of day
6. `npm run build` passes with no errors

## Future Considerations

- Swap placeholder data for Supabase-backed pages
- Add `(app)/[pageId]/page.tsx` dynamic routing
- Collapsible sidebar and mobile layout
- Recently visited section on home page
