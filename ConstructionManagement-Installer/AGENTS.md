# Repository Guidelines

This document helps contributors work effectively in this repo.

## Project Structure & Module Organization
- Source: `src/`
  - Pages (routes): `src/pages/*` (TypeScript preferred)
  - Components (shared UI): `src/components/*`
  - State: `src/contexts/*`
  - Utilities: `src/utils/*`
  - Services/API: `src/services/*`
- Public assets: `public/` (includes Electron entry `public/electron.js`)
- Build output: `build/`
- Docs & tools: `docs/` (generated files), `scripts/` (e.g., `scripts/generate-ppt.js`)

## Build, Test, and Development Commands
- Install deps: `npm install`
- Dev server: `npm start` (CRACO + CRA)
- Build (web): `npm run build` → outputs to `build/`
- Tests: `npm test` (CRA/Jest runner)
- Electron (dev): `npm run electron-dev`
- Packages (desktop): `npm run dist-win | dist-mac | dist-all`
- User manual PPT: `node scripts/generate-ppt.js` → `docs/사용설명서.pptx`

## Coding Style & Naming Conventions
- Language: React 18; TypeScript (`.tsx`) preferred, JS allowed (`allowJs`).
- Indentation: 2 spaces; keep diffs minimal and readable.
- Components: PascalCase (e.g., `ClientList.tsx`), hooks start with `use*`.
- Routing: define in `src/App.tsx` and page files under `src/pages`.
- Styling: Tailwind utility classes; avoid deep custom CSS.
- Linting: CRA ESLint defaults (`react-app`).

## Testing Guidelines
- Framework: CRA/Jest.
- Location: colocate tests near source (`*.test.tsx|ts|js`).
- Scope: unit/component tests for core logic; snapshot tests sparingly.
- Run: `npm test` (watch) or `CI=true npm test` (non-interactive).

## Commit & Pull Request Guidelines
- Commit style: Conventional Commits where possible
  - Examples: `feat(invoices): add status control`, `fix(router): hash toggle`.
- PRs should include: purpose, key changes, screenshots/GIFs for UI, and linked issues.
- Keep PRs focused (avoid mixing refactors with features).

## Security & Configuration Tips
- Data persistence: stored in `localStorage` per origin. Use Dashboard “백업/복원” for export/import.
- Routing base: `REACT_APP_BASE_PATH=/cms` (auto-detected if unset).
- Hash router: `REACT_APP_USE_HASH_ROUTER=1` when history API is unavailable.
- Dev port: `.env.development` (e.g., `PORT=3003`).
- Production build uses CRACO + Million.js optimizations.
