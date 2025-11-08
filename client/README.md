# Client Architecture Overview

## Tech Stack
- HTMX for hypermedia-driven interactions
- Tailwind CSS for utility-first styling
- Vanilla JavaScript modules for enhancements (no framework runtime)

## High-Level Structure
- `public/` – static assets, entry HTML shell, favicon
- `src/`
  - `styles/` – Tailwind config & generated CSS
  - `components/` – reusable HTML partials & HTMX fragments
  - `pages/` – top-level views stitched from fragments
  - `scripts/` – lightweight JS modules for progressive enhancements

## Build & Tooling
- Tailwind CLI (`tailwindcss@3.x`) for utility generation
- PostCSS + Autoprefixer pipeline wired via npm scripts
- `live-server` for zero-config static preview
- `npm-run-all` to coordinate concurrent watch tasks

### Commands
- `npm run dev` – watch Tailwind CSS and serve `public/` at `http://127.0.0.1:8080`
- `npm run css:build` – produce a minified stylesheet at `public/assets/tailwind.css`

## Deployment Targets
- Ship the contents of `public/` through Express static middleware or any static host
- Commit generated CSS via CI/CD (or rebuild at deploy time with the same commands)

