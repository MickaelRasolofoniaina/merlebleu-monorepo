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
- Use Tailwind utility classes exclusively for styling — do not write custom CSS classes
- Do not add an `error` callback in `.subscribe()` — errors are handled globally by `httpErrorInterceptor`; only provide `next` and `finalize` via `pipe` if needed for example to set loading indicator:
  ```ts
  this.orderService
    .listOrders({ page, limit }, filterParams)
    .pipe(
      finalize(() => {
        this.isLoading = false;
      }),
    )
    .subscribe({
      next: (response) => {
        this.orders.set(response.data);
        this.totalRecords = response.total;
      },
    });
  ```
