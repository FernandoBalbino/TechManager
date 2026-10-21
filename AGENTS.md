# Prototype Instructions

## TechManager decisions

Approved reference: `design/approved.png`. Use light mode, Inter, cobalt blue and coral, left navigation, three Kanban columns (Novos / Em atendimento / Resolvidos), ranking at right. Top contains only online students, time remaining and next-ticket countdown. Never add a logo, project name or room code to the student board header. Target Chromebook 1366×768; client chat collapses during Windows operation.

Windows is the vendored current OSLab, with learning activities, trails and assistant hidden. Keep simulations local and isolated by room, student and ticket. Never move full PC snapshots or bot conversations to Render. Keep backend tests on loopback; never direct load tests or prolonged sessions at Render. Public smoke budget 50 MB additional, absolute test ceiling 2 GB. Do not modify existing classroom services.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
