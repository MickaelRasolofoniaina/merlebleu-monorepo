# NestJS Conventions

- One feature module per domain in `src/features/`
- DTOs validated with Zod via `nestjs-zod` (not `class-validator`)
- Shared types imported from `@merlebleu/shared`, never duplicated in the API
