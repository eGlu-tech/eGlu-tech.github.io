# eGlu.tech | Agent Context & Engineering Manifesto

## 1. Project Philosophy
- **Minimalist Engineering:** Prioritize simplicity and performance over feature bloat.
- **The Vanilla Web:** Use standard Web APIs and Vanilla CSS. No Tailwind, no CSS-in-JS, no unnecessary dependencies.
- **Warm Minimalism:** Dark stone aesthetics (`#1c1917`) with amber accents (`#d97706`). Human-centric, technical, but approachable.

## 2. Technical Stack
- **Framework:** Astro (Static Site Generation).
- **Deployment:** GitHub Pages (via GitHub Actions).
- **Site URL:** `https://eglu.tech`
- **Constants:** `src/constants.ts` (Centralized config for social links and site info).
- **Typography:** 
  - Headings/Meta: `Space Grotesk` (Technical, Geometric).
  - Body: `Inter` (Legibility, modern).
- **CSS Architecture:**
  - `global.css`: Shared tokens, layout, branding (header/footer).
  - `index.css`: Front-page article list and card-specific styles.
  - `blog.css`: Long-form prose and post-specific meta-logic.

## 3. Design Tokens & Constraints
- **Max Width:** `680px` (Optimized for reading rhythm).
- **Transitions:** `all 0.25s cubic-bezier(0.4, 0, 0.2, 1)`.
- **Glow Effect:** `text-shadow: 0 0 20px rgba(217, 119, 6, 0.3)`.
- **Typography Ratios:** 
  - Front Page Date: `0.85rem` / `500` weight.
  - Blog Meta: `1rem` / `500` weight.
  - Prose Line-Height: `1.7`.

## 4. Engineering Mandates (GEMINI.md)
- **Autonomous Commits:** Stage and commit immediately after changes.
- **Conventional Commits:** Use `feat:`, `fix:`, `style:`, `refactor:`.
- **Validation:** No formal build/type-check steps required before committing.
- **Directives:** Fulfill requests autonomously without asking for approval on minor refinements.

## 5. Metadata Logic
- **Author:** Always required (Zod schema enforced).
- **Alignment:** Use `align-items: baseline` for all meta-rows to handle optical alignment naturally.
- **Easter Eggs:** Footer brand link should be invisible (inherit all styles) in normal state, revealing full branding only on hover.
