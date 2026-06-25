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
- In tables, right-align all numeric columns (quantities, prices, totals, etc.) by using tailwind css class text-right!
- In tables, center-align the Actions column header by using tailwind css class text-center!
- Add `appendTo="body"` on every `p-select` (and other PrimeNG overlay-panel components) placed inside a `p-dialog` — without it, the dropdown panel is clipped/scrolls incorrectly inside the dialog's overflow container, causing a vertical scroll bug
- Form `<label>` elements must include `dark:text-white` alongside their light-mode text color class (e.g. `class="font-semibold text-slate-900 dark:text-white"`) so labels stay readable in dark mode
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
