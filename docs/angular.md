# Angular Conventions

- Standalone components only — `standalone: true` is the default in Angular 20, do not write it explicitly
- Use `input()`/`output()` functions — not `@Input()`/`@Output()` decorators
- Use signals for local state management
- Use `inject()` for dependency injection in services and components — not constructor injection
- Native control flow: `@if`, `@for`, `@switch` — not `*ngIf`, `*ngFor`
- Avoid `ngClass`/`ngStyle`; use `[class]`/`[style]` bindings
- Use the `async` pipe for observables in templates
- Use `NgOptimizedImage` for static images
- Use PrimeNG components whenever a UI component is needed
