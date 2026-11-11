# World mod placeholder

No implementation in this starter. This folder is the installable mod: its name is the installed ID `office-startup-world` (ADR-019).

Create View/adapter/reducer/scene/routes/animations during [scene](../../plans/01-poc-scene.md), [states](../../plans/02-states.md), [wandering](../../plans/03-idle-coffee-wander.md) milestones. Keep `main.js` and `mod.json` absent until the local host contract is verified. [Architecture](../../docs/ARCHITECTURE.md). Art pipeline output lives at repository-root `assets/`; a tested sync step copies the runtime subset into this folder's `assets/`. Do not reference box paths at runtime.
