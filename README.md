# Merlebleu Monorepo

This is a monorepo containing three interconnected projects built with npm workspaces:

## Projects

### 1. **merlebleu-shared** (`@merlebleu/shared`)

Shared library containing reusable types, interfaces, and classes used by both the API and App.

**Location:** `packages/merlebleu-shared/`

**Contents:**

- Types in `src/types.ts`
- Interfaces in `src/interfaces.ts`
- Classes in `src/classes.ts`

### 2. **merlebleu-api** (`@merlebleu/api`)

NestJS backend API that depends on `@merlebleu/shared`.

**Location:** `packages/merlebleu-api/`

**Scripts:**

- `npm run build:api` - Build the API
- `npm start:api` - Start the API in production mode
- `npm run start:dev -w merlebleu-api` - Start the API in development mode with watch

### 3. **merlebleu-app** (`@merlebleu/app`)

Angular frontend application that depends on `@merlebleu/shared`.

**Location:** `packages/merlebleu-app/`

**Scripts:**

- `npm run build:app` - Build the app for production
- `npm start:app` - Start the development server

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher, for workspace support)

### Installation

1. Install dependencies for all workspaces:

   ```bash
   npm install
   ```

2. Build the shared library:
   ```bash
   npm run build:shared
   ```

## Available Scripts

Run these from the root directory:

### All Projects

- `npm run build` - Build all projects
- `npm test` - Run tests in all workspaces
- `npm run lint` - Lint all projects

### Specific Projects

- `npm run build:shared` - Build only merlebleu-shared
- `npm run build:api` - Build only merlebleu-api
- `npm run build:app` - Build only merlebleu-app
- `npm start:api` - Start merlebleu-api
- `npm start:app` - Start merlebleu-app

### For Individual Project Commands

Use the `-w` flag with npm commands:

```bash
npm run <command> -w @merlebleu/shared
npm run <command> -w @merlebleu/api
npm run <command> -w @merlebleu/app
```

## TypeScript Path Aliases

The monorepo is configured with TypeScript path aliases for clean imports:

```typescript
// Import from shared
import { User, IEntity, BaseEntity } from "@merlebleu/shared";

// Instead of:
import { User } from "../../../packages/merlebleu-shared/src";
```

## Workspace Structure

```
merlebleu-monorepo/
├── packages/
│   ├── merlebleu-shared/      (Shared types, interfaces, classes)
│   │   ├── src/
│   │   ├── dist/              (Generated)
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── merlebleu-api/         (NestJS API)
│   │   ├── src/
│   │   ├── dist/              (Generated)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── merlebleu-app/         (Angular App)
│       ├── src/
│       ├── dist/              (Generated)
│       ├── package.json
│       └── tsconfig.json
├── package.json               (Root config with workspaces)
├── tsconfig.json              (Root TypeScript config with path aliases)
├── .gitignore
└── README.md
```

## Adding Dependencies

To add a dependency to a specific workspace:

```bash
npm install <package-name> -w @merlebleu/shared
npm install <package-name> -w @merlebleu/api
npm install <package-name> -w @merlebleu/app
```

To add a dev dependency:

```bash
npm install <package-name> --save-dev -w @merlebleu/api
```

## Next Steps

1. Copy your NestJS API source code to `packages/merlebleu-api/src/`
2. Copy your Angular app source code to `packages/merlebleu-app/src/`
3. Update the shared library with your types, interfaces, and classes
4. Install any additional dependencies for each project
5. Run `npm install` from the root to ensure all workspaces are properly linked

## Notes

- Both `merlebleu-api` and `merlebleu-app` automatically depend on `@merlebleu/shared`
- The shared library must be built before the other projects can import from it
- All three projects use TypeScript with strict type checking
- The monorepo uses npm workspaces for dependency management and linking
