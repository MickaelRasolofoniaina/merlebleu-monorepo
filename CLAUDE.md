# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

npm workspaces monorepo with three packages:

- `packages/merlebleu-shared` (`@merlebleu/shared`) — shared TypeScript types, DTOs, classes; built first as a dependency
- `packages/merlebleu-api` (`@merlebleu/api`) — NestJS 11 REST API with PostgreSQL/TypeORM and JWT auth
- `packages/merlebleu-app` (`@merlebleu/ui`) — Angular 20 SPA with PrimeNG and Tailwind CSS

All cross-project types must live in `@merlebleu/shared` — no direct imports between API and App.

## Commands

Run from the repo root unless noted.

```bash
# Install
npm install

# Build (shared must build before api/app)
npm run build:shared
npm run build             # builds all

# Development
npm run start:dev -w merlebleu-api    # API on :3000 with watch
npm start -w @merlebleu/ui            # Angular dev server on :4200

# Tests
npm test                              # all workspaces
npm test -w @merlebleu/api            # API unit tests (Jest)
npm run test:e2e -w @merlebleu/api    # API e2e tests
npm test -w @merlebleu/ui             # Angular tests (Karma/Jasmine)

# Lint & format
npm run lint                          # all workspaces (ESLint)
npm run format -w @merlebleu/api      # Prettier

# Shared library barrel exports (run after adding new exports)
npm run generate:barrels
```

Add a dependency to a specific workspace:
```bash
npm install <package> -w @merlebleu/api
npm install <package> --save-dev -w @merlebleu/ui
```

## Architecture

### Shared (`merlebleu-shared`)

Domain-organized under `src/domain/{identity,inventory,sale,shared}/`. Barrel exports are auto-generated — run `npm run generate:barrels` after adding new public exports. Import via path alias: `import { User } from "@merlebleu/shared"`.

### API (`merlebleu-api`)

Feature modules under `src/features/{identity,inventory,sale}/`, each containing module, controller, service, entity, and DTO files. Global Zod validation pipe is active — use `nestjs-zod` for DTO validation instead of class-validator decorators. Swagger docs served at `/api`. Database configured via env vars: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

### App (`merlebleu-app`)

Feature-based routing under `src/app/features/{identity,inventory,sale}/` with lazy-loaded routes. Auth guard protects all authenticated routes. Two global HTTP interceptors: `credentialsInterceptor` and `httpErrorInterceptor` (shows Toast on errors via PrimeNG `MessageService`).

Path aliases in the app: `@shared/*`, `@core/*`, `@features/*`, `@layout/*`, `@env/*`.

## Angular Conventions

See [docs/angular.md](docs/angular.md).

## NestJS Conventions

See [docs/nestjs.md](docs/nestjs.md).

## Shared Library Conventions

See [docs/shared.md](docs/shared.md).
