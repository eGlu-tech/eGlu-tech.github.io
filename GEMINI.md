# Development Workflow Mandates

- **Autonomous Commits:** After completing a code change, feature, or refinement, autonomously stage and commit the changes immediately.
- **Commit Messages:** Use clear, concise commit messages following the Conventional Commits specification (e.g., `feat:`, `fix:`, `style:`, `refactor:`).
- **No Approval Required:** Do not wait for explicit user approval to commit if a task or sub-task is complete.
- **Simplified Workflow:** No formal validation (builds/type-checks) is required before committing for this project.
- **Component Architecture:** Colocate component logic and styles. Each component should have its own directory (e.g., `src/components/name/`) containing both the `.astro` file and its dedicated `.css` file.

## Project Vision: eGlu.tech

**Core Philosophy:** Minimalist Engineering & The Vanilla Web.

### Architectural Path
- **Framework:** Astro (Static Site Generation).
- **Styling:** Vanilla CSS with CSS Variables. No Tailwind, no CSS-in-JS.
- **Aesthetic:** Dark, technical but approachable.
- **Content:** Markdown-driven blog via Astro Content Collections.
