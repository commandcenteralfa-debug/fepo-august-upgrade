# FEPO Digital — Front End Details

> "Your digital partner. Create stunning visuals for your business in seconds."
> Festival-themed business greeting-poster editor.

---

## 1. Overview

| Layer       | Tech |
|-------------|------|
| Framework   | Next.js 16.2.12 (App Router, Turbopack) |
| UI          | React 19.2.7 |
| Language    | TypeScript 6.0.3 |
| Styling     | Tailwind CSS 4.3.3 (`@theme` tokens in `globals.css`) |
| Motion      | framer-motion (12.x) |
| Icons       | lucide-react |
| State       | React Context + `useReducer` (`src/context/DesignContext.tsx`) |
| Canvas      | HTML5 `<canvas>` 2D rendering (`src/components/CanvasRenderer.tsx`) |
| Fonts       | Google Fonts (Material Symbols Outlined) + Outfit / Georgia serif / script |

**Pages/Routes**

- `/` — Landing (home) page
- `/create` — Poster editor
- `/festival/[festivalName]` — Festival detail page
- `/templates/[festivalName]` — Templates browser
- `/api/festivals` — Festival + template JSON endpoint

---

## 2. Wireframe Sketches

### 2.1 Landing Page (`src/app/page.tsx`)

```
+--------------------------------------------------------------+
| [NavBar — logo | search | dropdown | CTA]          fixed?     |
+--------------------------------------------------------------+
|  HeroBannerCarousel                                           |
|  [ big slide image + headline + sub + CTA buttons ]          |
|  (auto-rotates, resumes after 4s idle)                       |
+--------------------------------------------------------------+
|  HorizontalScrollSection — "Festival Templates"              |
|  [t1][t2][t3][t4][t5]→ auto-scrolling strip (resume 5s)     |
+--------------------------------------------------------------+
|  HorizontalScrollSection — "Business Categories"              |
|  [cat1][cat2][cat3][cat4]→                                   |
+--------------------------------------------------------------+
|  FestiveCalendar (section id="festival-section")             |
|  [month grid  |  selected-day panel:                          |
|   Su Mo Tu We    - name + logo                                |
|   ...        ]    - occasion chips (multi-festival)           |
|                   - "Create Greeting" CTA                     |
+--------------------------------------------------------------+
|  BusinessHolidaySection / How-it-works cards                  |
|  [Card][Card][Card]  (icons: Code, TrendingUp, Megaphone…)   |
+--------------------------------------------------------------+
|  Footer (id="footer") — 4 cols: brand | quick links | company | connect |
+--------------------------------------------------------------+
```

### 2.2 Editor (`src/app/create` → `ClientHome.tsx`)

```
+-------------------------------------------------------------------+
| EditorNavbar (h-16 fixed, top)  [FEPO | 🔍 search(max-w-xl) | …] |
+--------+----------------------------------------------+-----------+
| Sidebar|          Main canvas area                     | BusinessDetails
| (w-56  |  +----------------------------------------+   | (right panel)
| fixed) |  |  PosterPreview / MainPreview            |   |  accordions:
|        |  |  max-w-[340→350→425] centered           |   |  - Details
| Home   |  |  CanvasRenderer 729x729 → scaled        |   |  - Branding
| Templs |  |  ring-blue-400 (editing) / saffron ring |   |  - Settings
| Element|  +----------------------------------------+   |  font presets
| Text   |                                               |  country codes
| Uploads|                                               |
| Brand  |  (template variant thumbnails row below)      |
| Kit    |                                               |
| Projec |                                               |
|--------|                                               |
| Settings (bottom)                                      |
+--------+----------------------------------------------+-----------+
| BottomNav (h-16, mobile only, md:hidden)  Home|Templates|Projects|Profile |
+-------------------------------------------------------------------+
```

### 2.3 NavBar (top, all pages)

```
+------------------------------------------------------------------+
| [logo]  [search input........]  [Festival ▾ dropdown]  [Create]  |
+------------------------------------------------------------------+
| search filters festival list by title; dropdown navigates via    |
| hardcoded FESTIVAL_SLUGS map; mobile → SearchOverlay (slide-down)|
+------------------------------------------------------------------+
```

### 2.4 Mobile SearchOverlay

```
+------------------------------+   (z-60, md:hidden, backdrop blur)
| ⓧ+ [🔍 input...............] [✕] |   slides down from top, focus auto,
| Type to search...               |   Esc/backdrop closes, locks body scroll
+------------------------------+
```

---

## 3. Feature List

### Landing / Content
- **Hero carousel** — banner slides auto-rotate; interaction pauses auto-play, resumes after ~4s.
- **Auto-scrolling strips** — horizontal festival templates & business categories; resume after ~5s.
- **Festive calendar** — month grid; tapping a day shows festival + logo; **multi-occasion days render separate chips** (titles split on `/`, e.g. "Vaisakhi / Baisakhi / Vishu / Tamil New Year"); each chip is clickable ("Create Greeting").
- **Business holiday section** + how-it-works cards with feature icons.
- **Footer** — brand blurb, smooth-scroll quick links, company links, socials, contact (fepodigitals@gmail.com / +91 7777991909).

### Editor
- **Template variant swatches** — switching variant re-fetches template image + mapping JSON.
- **Live text override** — shop name, phone (with country code dropdown, default +91), email — rendered on canvas.
- **Logo upload** — drawn at anchor from active `matrixConfig` (top-left / top-center / bottom-center / badge).
- **Font presets** — Luxury, Vibrant, Minimal, Traditional → sets shop/phone/email colors + font category via `APPLY_PRESET`.
- **Canvas element editing (mapping JSON driven)**:
  - drag to reposition (clamped to canvas bounds & alignment),
  - drag 4 corner handles to resize (min 80×30),
  - two-finger pinch to scale (0.3–5×),
  - hit-testing with 40px padding, hover highlight + id tag overlay,
  - dashed edit-mode bounding box (blue → green while dragging/resizing).
- **Rendering engine** — template PNG + mapping overlay; fallback procedural gradient per festival (`diwali | holi | dussehra | navratri | rama_navami | finance | it-tech | marketing | sales`) with sparkles.
- **Text engine** — auto-fit font (floor 8px), word-wrap, text-transform (uppercase/lowercase), alignment-aware box layout, line-height 1.3.
- **4 layout matrix configs** — `logoAnchor × textLayout`: vertical-sidebar, centered-stack, split-header-footer, floating-minimalist.
- **Export** — PNG download via `#main-canvas` → `toDataURL`.
- **Save template** — POST with current design state.
- **Reset all** — clears element positions/scales/sizes and exits edit mode.

### Shell / UX
- Fixed left sidebar (desktop), fixed top bar, fixed mobile bottom nav (`pb-safe`).
- Search overlay with Escape/backdrop close + body scroll lock.
- Content protection CSS (no selection/drag on canvas & images; `@media print` hides body).
- Bento boxes / glass utilities, custom scrollbars, custom range + color inputs.

---

## 4. Ratios Used

### 4.1 Layout & Spacing (Tailwind)

| Item | Value | Source |
|------|-------|--------|
| Responsive horizontal padding | `px-4` → `md:px-8` → `lg:px-20` (footer `lg:px-12`) | page.tsx / Footer |
| Content container | `max-w-7xl` (landing) / `max-w-6xl` (footer) | page.tsx / Footer |
| Top nav bar height | `h-16` | NavBar, EditorNavbar |
| Mobile bottom nav height | `h-16` + `pb-safe` | BottomNav |
| Editor sidebar width | `w-56` fixed | EditorSidebar |
| Editor search max width | `max-w-xl` | EditorNavbar |
| Poster preview width | `max-w-[340px]` → `md:max-w-[350px]` → `lg:max-w-[425px]` | MainPreview |
| Footer columns | `grid-cols-1 md:grid-cols-4 gap-10` | Footer |
| Nav hit target | `min-h-[48px] min-w-[64px]` | BottomNav |
| Accordion / panel gap | `gap-*` 4/6 scale + `space-y-2` lists | BusinessDetails / Footer |
| Radius tokens | `--radius .125rem · lg .25 · xl .5 · full .75 · 2xl 1rem · 3xl 1.5rem` | globals.css |
| Brand colors | `saffron #F59E0B` · `purple-accent #7C3AED` · `purple-dark #5B21B6` · `primary #ab2d00` · M3 surface scale | globals.css |

### 4.2 Canvas & Design (CanvasRenderer / canvasUtils)

| Item | Value |
|------|-------|
| Canvas size | `CANVAS_SIZE = 729` × 729 (square) |
| Sub-canvas safe area | margin ratio `0.05` of size (~36.5px) |
| Vertical sidebar text width | `0.35` × canvas width |
| Line height | `LINE_HEIGHT_RATIO = 1.3` |
| Hit-test padding | `HIT_PADDING = 40px` |
| Resize handle | 12px squares at corners |
| Min text box | 80 × 30px |
| Pinch scale clamp | 0.3 – 5 (rounded to 0.01) |
| Logo box | 80×80 at (20,20) top-left (anchor moves per matrix config) |
| Auto-fit font | step −2px, floor 8px |
| Font presets | Luxury `#7C3AED→#5B21B6→#1E1B4B` · Vibrant `#EF4444→#F59E0B→#10B981` · Minimal `#1F2937→#4B5563→#9CA3AF` · Traditional `#B45309→#92400E→#78350F` |
| Fallback gradients | 3-stop linear (0 / 0.5 / 1) per festival (see `drawGradientBg`) |
| Default styles | shop `#F59E0B` 32px · phone `#FFFFFF` 16px · email `#FFFFFF` 14px |

---

*File generated from the actual component source (CanvasRenderer, page.tsx, ClientHome, EditorSidebar/EditorNavbar, BusinessDetails, NavBar, Footer, BottomNav, MainPreview, SearchOverlay, DesignContext, designMatrix, canvasUtils, globals.css).*
