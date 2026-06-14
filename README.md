# mikesnutrition

Recipes, weekly meal-prep, and a light nutrition log — split out of mikesfitness.

- Stack: React 19 + Vite + Firebase (owner-locked Google auth) + plain CSS, PWA.
- Data: one doc `nutrition/{uid}` → `recipes[]`, `mealPrep[]`, `log[]`. Rupert writes
  recipes/mealPrep; Mike adds log entries.
- Runs in DEMO mode (seed data) when Firebase env vars are absent.
- Setup: see ../NEW-APPS-SETUP.md.

Dev: `npm install && npm run dev`. Build: `npm run build`.
