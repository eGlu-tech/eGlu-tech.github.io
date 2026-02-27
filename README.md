# eGlu.tech

**Minimalist Engineering & The Vanilla Web.**

eGlu.tech is a high-performance, minimalist blog built with Astro. It adheres to a "Warm Minimalism" aesthetic—dark stone tones with amber accents—and prioritizes the "Vanilla Web" (Standard Web APIs and Vanilla CSS).

## 🪐 Philosophy

- **Minimalist Engineering:** Simplicity and performance over feature bloat.
- **The Vanilla Web:** No Tailwind, no CSS-in-JS, no unnecessary dependencies.
- **Warm Minimalism:** Human-centric, technical, but approachable design.

## 🛠 Technical Stack

- **Framework:** [Astro](https://astro.build) (Static Site Generation).
- **Styling:** Vanilla CSS with CSS Variables.
- **Typography:** 
  - Headings: `Space Grotesk`
  - Body: `Inter`
- **Content:** Markdown via Astro Content Collections.

## 🚀 Development

### Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Installs dependencies |
| `npm run dev` | Starts local dev server at `localhost:4321` |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the production build locally |

### Engineering Mandates

As defined in `GEMINI.md`:
- **Autonomous Workflow:** Changes are committed immediately after completion.
- **Conventional Commits:** Use `feat:`, `fix:`, `style:`, `refactor:`, etc.
- **Component Architecture:** Colocate logic and styles (e.g., `src/components/name/` contains `.astro` and `.css`).

## 📡 Deployment

Managed via GitHub Actions. Deployment is triggered manually via **Workflow Dispatch** on the `master` branch.
