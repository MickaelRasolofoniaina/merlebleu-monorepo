# Copilot Instructions for Merlebleu Monorepo

## Overview

This monorepo contains three main projects managed with npm workspaces:

- **merlebleu-api**: NestJS backend API (see `packages/merlebleu-api/`)
- **merlebleu-app**: Angular frontend (see `packages/merlebleu-app/`)
- **merlebleu-shared**: Shared TypeScript types, interfaces, and classes (see `packages/merlebleu-shared/`)

All projects use strict TypeScript settings and leverage path aliases for clean imports (see root `tsconfig.json`).

## Key Workflows

- **Install all dependencies:**
  ```bash
  npm install
  ```
- **Build all projects:**
  ```bash
  npm run build
  ```
- **Build shared library first:**
  ```bash
  npm run build:shared
  ```
- **Start API (dev):**
  ```bash
  npm run start:dev -w merlebleu-api
  ```
- **Start App (dev):**
  ```bash
  npm start:app
  ```
- **Run all tests:**
  ```bash
  npm test
  ```
- **Add dependencies to a workspace:**
  ```bash
  npm install <package> -w @merlebleu/api
  ```

## Project Conventions

- **TypeScript:** Use strict types, avoid `any`, prefer type inference, and use path aliases (e.g. `import { User } from "@merlebleu/shared"`).
- **Angular (merlebleu-app):**
  - Use standalone components (do not set `standalone: true` explicitly)
  - Use signals for state management
  - Prefer `input()`/`output()` functions, not decorators
  - Use `NgOptimizedImage` for static images
  - Avoid `ngClass`/`ngStyle`; use `class`/`style` bindings
  - Use native control flow (`@if`, `@for`, `@switch`)
  - Use the async pipe for observables
  - Prefer `inject()` over constructor injection in services
- **NestJS (merlebleu-api):**
  - Organize features by domain (see `src/features/`)
  - Use dependency injection for services
  - Place DTOs, entities, and modules in their respective subfolders
  - Use the shared library for all cross-project types

## Structure & Patterns

- **Shared code:** All cross-project types/interfaces/classes live in `packages/merlebleu-shared/src/`
- **API features:** Each domain (identity, inventory, sale) is a subfolder in `src/features/` with its own module, controller, service, and DTO/entity files
- **App features:** Mirrored structure in `src/app/features/` for Angular
- **Testing:**
  - API: Use `.spec.ts` files for unit/e2e tests (see `src/features/**/`)
  - App: Use Angular CLI test commands (`ng test`, `ng e2e`)

## Integration & Communication

- **API ↔ App:** All shared types/interfaces must be defined in `@merlebleu/shared` and imported via path aliases
- **No direct imports** between API and App; always use the shared package

## References

- See root and project-level `README.md` for more details
- Example import:
  ```typescript
  import { User } from "@merlebleu/shared";
  ```

## Project specific instructions

- **Angular (merlebleu-app):**
  - Use PrimeNG component when possible: https://primeng.org/

---

If any conventions or workflows are unclear, please consult the relevant `README.md` or ask for clarification.
