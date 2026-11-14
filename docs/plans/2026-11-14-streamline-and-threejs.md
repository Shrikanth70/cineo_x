# Cinéo Streamline & Three.js Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Streamline Cinéo to 4 core high-utility features (Home, Watch Party, Discover, Movies Like, Watch Order), remove speculative/bloat AI routes, and implement a high-craft Three.js 3D cinematic film strip and particle vortex hero animation following Hallmark design rules.

**Architecture:** 
1. Install pinned `three` and `@types/three`.
2. Construct a responsive, performant Three.js WebGL canvas (`ThreeCinematicHero.tsx`) with 3D curved film ribbon, ambient amber/blue starlight particles, directional lighting, mouse parallax, pause controls, and `prefers-reduced-motion` compliance.
3. Cleanly remove unused routes (`/movie-map`, `/blend`, `/mood-match`, `/pick-for-me`, `/lists`).
4. Update `src/config/brand.ts`, `Navbar.tsx`, `Footer.tsx`, and `sitemap.ts` to feature only the core destinations.
5. Update unit and E2E test suites and execute the full verification gate (`typecheck`, `lint`, `build`, `test`, `e2e`).

**Tech Stack:** Next.js 14 (App Router), React 18, Three.js (`^0.170.0`), Tailwind CSS, TypeScript (strict), Vitest, Playwright.

**Spec:** `C:\Users\Bhukya Shrikanth\.gemini\antigravity\brain\62813737-a8c1-4ea1-abeb-134e20412e95\streamlined-cineo-spec.md`

## Global Constraints
- Brand name remains `Cinéo` via `src/config/brand.ts`.
- Dark cinematic theme `#0A0A0C` with warm amber `#F5C26B`.
- No generic AI-slop pastel cards or oversized blurred blobs; strict typography and layout hierarchy.
- No `transition: all`; explicit `:focus-visible` states.
- TypeScript `strict: true`.
- Zero unhandled exceptions or console errors across desktop & mobile viewports.
- All dependencies pinned to exact versions in `package.json`.

## Review Focus
1. **WebGL Context Management:** Ensure WebGL renderer and geometries are disposed on component unmount to prevent memory leaks during client-side navigation.
2. **Mobile GPU & Battery:** Limit `devicePixelRatio` to `Math.min(window.devicePixelRatio, 2)` and throttle render loops when out of view.
3. **Accessibility & Reduced Motion:** Respect `prefers-reduced-motion` by freezing animation, offering an accessible pause button, and providing a clean static fallback.
4. **Clean Navigation:** Ensure no dead links or 404s exist in the Navbar, mobile drawer, footer, or sitemap.
5. **E2E Test Stability:** Ensure Playwright tests reflect the streamlined navigation and pass cleanly across Chromium and mobile viewports.

---

### Task 1: Pinned Dependencies Installation
**Files:**
- Modify: `cineo/package.json`

**Steps:**
- [ ] Add `"three": "0.170.0"` to `dependencies` and `"@types/three": "0.170.0"` to `devDependencies`.
- [ ] Run `npm install` with `BypassSandbox: true` (network required for npm registry).
- [ ] Verify `package-lock.json` is updated and clean.

---

### Task 2: Hallmark Three.js Cinematic Hero Component
**Files:**
- Create: `cineo/src/components/home/ThreeCinematicHero.tsx`
- Modify: `cineo/src/app/page.tsx`
- Create: `cineo/tests/unit/three-hero.test.tsx`

**Steps:**
- [ ] Create `ThreeCinematicHero.tsx`:
  - WebGL canvas initialized with perspective camera and ambient + warm amber spotlight (`#F5C26B`).
  - 3D curved cinematic film strip geometry textured with real movie frames/posters.
  - Ambient particle vortex of 400 floating amber and subtle cool-blue starlight particles.
  - Interactive mouse/touch parallax offset with smooth damping.
  - Accessible pause/play toggle button and automatic detection of `prefers-reduced-motion`.
  - Comprehensive cleanup in `useEffect` return handler (`dispose()` on geometries, materials, textures, renderer).
- [ ] Replace the CSS 3D orbit carousel in `src/app/page.tsx` with `<ThreeCinematicHero />`.
- [ ] Write unit test in `tests/unit/three-hero.test.tsx` checking render safety, SSR compatibility, and pause toggle state.
- [ ] Run `npm run test:unit` to verify the new test passes.

---

### Task 3: Prune Unused Routes & Gimmick Pages
**Files:**
- Delete: `cineo/src/app/movie-map/`
- Delete: `cineo/src/app/blend/`
- Delete: `cineo/src/app/mood-match/`
- Delete: `cineo/src/app/pick-for-me/`
- Delete: `cineo/src/app/lists/`
- Delete: any unused subcomponents associated exclusively with these routes.

**Steps:**
- [ ] Remove route directories: `movie-map`, `blend`, `mood-match`, `pick-for-me`, `lists`.
- [ ] Check for any dangling component imports and remove orphaned files cleanly.

---

### Task 4: Streamline Brand Config, Navigation & Footer
**Files:**
- Modify: `cineo/src/config/brand.ts`
- Modify: `cineo/src/components/layout/Navbar.tsx`
- Modify: `cineo/src/components/layout/Footer.tsx`
- Modify: `cineo/src/app/sitemap.ts`

**Steps:**
- [ ] Update `MAIN_NAV_LINKS` in `src/config/brand.ts` to strictly:
  - `Discover` (`/discover`)
  - `Movies Like` (`/movies-like`)
  - `Watch Order` (`/watch-order`)
  - `Watch Party (Free)` (`/watch-party`)
- [ ] Update `Navbar.tsx` (desktop nav and mobile slide-out drawer) to render these clean items without clutter or obsolete AI dots.
- [ ] Update `Footer.tsx` links to point exclusively to existing routes.
- [ ] Update `sitemap.ts` to index only active routes.

---

### Task 5: Update Tests for Streamlined Routes
**Files:**
- Modify: `cineo/tests/e2e/routes.spec.ts`

**Steps:**
- [ ] Update route tests to verify the core routes (`/`, `/discover`, `/movies-like`, `/watch-order`, `/watch-party`) and verify navigation links.
- [ ] Remove test assertions targeting pruned routes (`/movie-map`, etc.).

---

### Task 6: Full Verification Gate
**Steps:**
- [ ] Run `npm run typecheck` (`tsc --noEmit`) - must exit 0.
- [ ] Run `npm run lint` (`next lint`) - must exit 0.
- [ ] Run `npm run build` (`next build`) - must exit 0.
- [ ] Run `npm test` (`vitest run`) - must pass 100%.
- [ ] Run `npm run e2e` (`playwright test`) - must pass 100%.
- [ ] Verify dev server runs cleanly without errors.

