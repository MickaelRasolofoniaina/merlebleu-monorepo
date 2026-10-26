# Guide d'apprentissage : `feature/dashboard`

**Branche** : `feature/dashboard`
**Date** : 2026-10-26
**Commits en avance sur `origin/develop`** : aucun. Tout le travail de la branche est encore **non commité** (fichiers modifiés et fichiers non suivis). Ce guide analyse donc le working tree par rapport à `origin/develop`.

---

## Table des matières

1. [Nouvelles librairies](#nouvelles-librairies)
2. [Nouveaux concepts](#nouveaux-concepts)
3. [Chart.js et `p-chart` (PrimeNG)](#1-chartjs-et-p-chart-primeng)
4. [`toSignal` / `toObservable` et le pattern `loadOnChange`](#2-tosignal--toobservable-et-le-pattern-loadonchange)
5. [Validation des paramètres de requête avec `z.coerce` (Zod)](#3-validation-des-paramètres-de-requête-avec-zcoerce-zod)
6. [Agrégations SQL avec le QueryBuilder de TypeORM](#4-agrégations-sql-avec-le-querybuilder-de-typeorm)
7. [Défi de synthèse](#défi-de-synthèse)

---

## Nouvelles librairies

| Librairie | Version | Workspace | Rôle dans la branche |
|---|---|---|---|
| `chart.js` | `^4.6.1` | `merlebleu-app` | Moteur de rendu des graphiques (barres, camembert) dans un `<canvas>` |

`chart.js` est ajouté dans `packages/merlebleu-app/package.json`. Le composant `p-chart` (module `primeng/chart`) est un wrapper PrimeNG autour de Chart.js. Il n'est pas une dépendance npm supplémentaire, mais il est utilisé pour la première fois sur `develop`.

## Nouveaux concepts

Les concepts suivants sont absents de `origin/develop` :

| # | Concept | Où dans la branche |
|---|---|---|
| 1 | Chart.js et `p-chart` | `features/dashboard/order/components/orders-bar-chart/` |
| 2 | `toSignal` / `toObservable` (rxjs-interop) et `switchMap` + `catchError` | `features/dashboard/order/order-dashboard.ts` |
| 3 | `z.coerce` (Zod) pour les query params | `merlebleu-shared/src/domain/sale/dashboard/dashboard.dto.ts` |
| 4 | Agrégations SQL via le QueryBuilder TypeORM (`EXTRACT`, `COUNT(DISTINCT)`, `getRawMany`) | `merlebleu-api/src/features/sale/dashboard/dashboard.service.ts` |

Concepts volontairement **exclus** car déjà utilisés sur `develop` : les signals `input.required` et `computed` (ex. `features/ingredient/unit/unit.ts`), `getRawMany` et le QueryBuilder (ex. `notification.service.ts`), `z.enum` (ex. `user.dto.ts`).

---

## 1. Chart.js et `p-chart` (PrimeNG)

### Où

- Composant : [orders-bar-chart.ts](../../packages/merlebleu-app/src/app/features/dashboard/order/components/orders-bar-chart/orders-bar-chart.ts)
- Template : [orders-bar-chart.html](../../packages/merlebleu-app/src/app/features/dashboard/order/components/orders-bar-chart/orders-bar-chart.html)
- Camembert : `features/dashboard/order/components/orders-pie-chart/`
- Regroupement des petites tranches : [dashboard-chart.utils.ts](../../packages/merlebleu-app/src/app/features/dashboard/order/dashboard-chart.utils.ts)

### Code

Le template délègue tout le rendu à `p-chart` :

```html
<p-chart type="bar" [data]="data()" [options]="options()" height="18rem" />
```

Les données et les options sont deux **signals calculés** :

```ts
// orders-bar-chart.ts (l.17-28) : les données suivent les inputs
protected readonly data: Signal<ChartData<'bar'>> = computed(() => ({
  labels: this.labels(),
  datasets: [
    {
      label: 'Commandes',
      data: this.values(),
      backgroundColor: '#3b82f6',
      borderRadius: 4,
      maxBarThickness: 64,
    },
  ],
}));

// orders-bar-chart.ts (l.31-48) : les couleurs suivent le thème
protected readonly options: Signal<ChartOptions<'bar'>> = computed(() => {
  const isDark = this.themeService.isDarkMode();
  const textColor = isDark ? '#cbd5e1' : '#475569';
  // ...
  return {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { /* ... */ },
  };
});
```

Le regroupement des petites tranches du camembert est une fonction pure :

```ts
// dashboard-chart.utils.ts (l.6-20), résumé
export function groupSmallSlices(points, maxSlices = 7) {
  const sorted = [...points].sort((a, b) => b.count - a.count);
  if (sorted.length <= maxSlices) return sorted;
  const kept = sorted.slice(0, maxSlices - 1);
  const othersCount = sorted.slice(maxSlices - 1).reduce((sum, point) => sum + point.count, 0);
  return [...kept, { label: OTHERS_LABEL, count: othersCount }];
}
```

### Fonctionnement en détail

1. **Chart.js dessine dans un `<canvas>`.** Il ne produit pas de DOM pour les barres : il reçoit un objet de configuration qui décrit les `labels`, les `datasets` (les séries de valeurs) et les `options` (axes, légende, couleurs). Il calcule le dessin à partir de ces données.
2. **`p-chart` fait le lien avec Angular.** Le composant PrimeNG crée le graphique Chart.js sur le `<canvas>`, lit les entrées `type`, `data` et `options`, et met le graphique à jour quand elles changent. Il ne faut donc pas recréer le graphique à la main.
3. **Pourquoi `computed` ?** Chaque `computed` ne se recalcule que si ses dépendances changent. Ici, `data` dépend de `labels()` et `values()`. `options` dépend de `themeService.isDarkMode()`. Quand l'utilisateur bascule le thème, seules les options sont recalculées, et les couleurs des axes se mettent à jour. Les données ne sont pas touchées.
4. **`maintainAspectRatio: false`** indique à Chart.js de respecter la hauteur du conteneur (ici `height="18rem"`) au lieu de garder son ratio par défaut. Sans cette option, la hauteur fixée n'a pas d'effet visible.
5. **Les couleurs sont en JavaScript, pas en CSS.** Chart.js dessine sur un canvas : les classes Tailwind ne s'appliquent pas à ses éléments. D'où la lecture de `isDarkMode()` dans le code.

### Documentation officielle

- Chart.js : [Getting Started](https://www.chartjs.org/docs/latest/getting-started/) et [Installation](https://www.chartjs.org/docs/latest/getting-started/installation.html)
- PrimeNG Chart (v20) : [primeng.org/chart](https://v20.primeng.org/chart)

### Pourquoi ce choix

- **Chart.js plutôt qu'une librairie de graphiques en SVG** : Chart.js est la librairie utilisée par le composant `p-chart` de PrimeNG, déjà présent dans le projet. Elle est mature, légère pour les graphiques simples, et couvre les barres et le camembert sans configuration lourde.
- **Un composant dédié `OrdersBarChart`** plutôt qu'un `p-chart` directement dans `order-dashboard.html` : le composant isole la configuration (couleurs, options) et ne prend que des entrées simples (`labels`, `values`). Il est réutilisable et testable sans le reste du tableau de bord.
- **Des couleurs codées en dur (`#3b82f6`) pour la série** et des couleurs de thème pour les axes : la série garde la même identité dans les deux thèmes, tandis que le texte doit rester lisible sur fond clair et sombre.

### Défi

1. **Pourquoi `options` est-il un `computed` et non un objet constant ?**
   <details>
   <summary>Réponse</summary>

   Parce qu'il dépend de `themeService.isDarkMode()`. Quand le thème change, le `computed` se recalcule, et `p-chart` reçoit de nouvelles options avec les bonnes couleurs. Un objet constant figerait les couleurs au premier rendu.
   </details>

2. **Que se passe-t-il si on retire `maintainAspectRatio: false` ?**
   <details>
   <summary>Réponse</summary>

   Chart.js garde son ratio par défaut et calcule la hauteur à partir de la largeur. La hauteur `18rem` n'a plus d'effet visible.
   </details>

3. **Ajoutez une seconde série « Montant » au graphique en barres.**
   <details>
   <summary>Réponse</summary>

   Ajoutez un deuxième objet dans `datasets`, avec son propre `label` et ses propres `data` :

   ```ts
   datasets: [
     { label: 'Commandes', data: this.values(), backgroundColor: '#3b82f6', borderRadius: 4, maxBarThickness: 64 },
     { label: 'Montant', data: this.amounts(), backgroundColor: '#10b981', borderRadius: 4, maxBarThickness: 64 },
   ],
   ```

   Il faut aussi activer la légende (`plugins.legend.display`) pour distinguer les deux séries.
   </details>

---

## 2. `toSignal` / `toObservable` et le pattern `loadOnChange`

### Où

- [order-dashboard.ts](../../packages/merlebleu-app/src/app/features/dashboard/order/order-dashboard.ts) : l.73-80 (`countResult`), l.91-107 (`amount`, `typePoints`, `shapePoints`), l.128-148 (`toQuery` et `loadOnChange`)
- [dashboard.service.ts](../../packages/merlebleu-app/src/app/features/dashboard/dashboard.service.ts) : appels HTTP, l.43-51 (`toParams`)

### Code

Le composant ne fait pas d'appel HTTP directement. Il déclare des signals qui se recalculent quand les filtres changent :

```ts
// order-dashboard.ts (l.91-95)
protected readonly amount: Signal<DashboardAmount> = this.loadOnChange(
  computed(() => this.toQuery(this.amountView())),
  (query) => this.dashboardService.getOrdersAmount(query),
  { total: 0, ordersCount: 0 },
);
```

Le helper qui relie les deux mondes :

```ts
// order-dashboard.ts (l.137-148)
// errors are already reported by httpErrorInterceptor, so a failed request keeps the widget empty
private loadOnChange<TParams, TResult>(
  params: Signal<TParams>,
  request: (params: TParams) => Observable<TResult>,
  initialValue: TResult,
): Signal<TResult> {
  return toSignal(
    toObservable(params).pipe(
      switchMap((value) => request(value).pipe(catchError(() => of(initialValue)))),
    ),
    { initialValue },
  );
}
```

Et les paramètres dépendent de l'année et du mois sélectionnés :

```ts
// order-dashboard.ts (l.128-134)
private toQuery(view: DashboardView): DashboardQueryDto {
  return {
    view,
    year: this.selectedYear(),
    month: view === DashboardView.MONTH ? this.selectedMonth() : undefined,
  };
}
```

### Fonctionnement en détail

Le pattern fait passer une valeur de **signal → Observable → requête HTTP → signal** :

1. **`toObservable(params)`** transforme le signal `params` en Observable. À chaque changement de `selectedYear`, `selectedMonth`, `countView`, etc., un nouveau `DashboardQueryDto` est émis.
2. **`switchMap`** appelle `request(value)` pour chaque nouvelle valeur, et **annule la requête précédente** si elle est encore en cours. Si l'utilisateur change de mois deux fois vite, seule la dernière réponse est gardée. Sans `switchMap`, une réponse plus ancienne pourrait arriver après la bonne et écraser l'affichage.
3. **`catchError(() => of(initialValue))`** est placé **à l'intérieur** du `switchMap`. Si une requête échoue, l'erreur est remplacée par la valeur initiale (widget vide), mais le flux externe continue. Le prochain changement de filtre déclenche donc une nouvelle requête.
4. **`toSignal(..., { initialValue })`** convertit le flux en signal. La valeur initiale évite d'avoir `undefined` avant la première réponse, ce qui simplifie les templates.

Le piège à connaître : si `catchError` était placé **après** le `switchMap`, la première erreur terminerait le flux externe. Le signal resterait figé et ne réagirait plus aux filtres.

### Documentation officielle

- Angular, interop RxJS : [angular.dev/ecosystem/rxjs-interop](https://angular.dev/ecosystem/rxjs-interop)
- `toSignal` : [angular.dev/api/core/rxjs-interop/toSignal](https://angular.dev/api/core/rxjs-interop/toSignal)
- `toObservable` : [angular.dev/api/core/rxjs-interop/toObservable](https://angular.dev/api/core/rxjs-interop/toObservable)
- RxJS `switchMap` : [rxjs.dev/api/operators/switchMap](https://rxjs.dev/api/operators/switchMap)
- RxJS `catchError` : [rxjs.dev/api/operators/catchError](https://rxjs.dev/api/operators/catchError)

### Pourquoi ce choix

- **Pourquoi pas un `subscribe()` dans `ngOnInit` ?** Il faudrait gérer soi-même le désabonnement, stocker la valeur dans un `signal` à la main, et relancer la requête à chaque changement de filtre. `toSignal` gère le désabonnement automatiquement à la destruction du composant.
- **Pourquoi `switchMap` et pas `mergeMap` ?** Avec `mergeMap`, toutes les réponses seraient gardées, et une réponse lente pourrait écraser une réponse plus récente. `switchMap` garantit que seule la dernière demande compte.
- **Pourquoi un helper générique `loadOnChange` ?** Quatre widgets suivent exactement le même schéma. Le helper évite de répéter la plomberie quatre fois, et centralise la gestion d'erreur.
- **Pourquoi `catchError` dans le composant et non dans l'intercepteur ?** Le commentaire du code l'indique : l'intercepteur HTTP `httpErrorInterceptor` affiche déjà le toast. Ici, il ne reste qu'à vider le widget, ce qui est une décision d'affichage propre au tableau de bord.

### Défi

1. **Pourquoi `toSignal` reçoit-il un `initialValue` ici ?**
   <details>
   <summary>Réponse</summary>

   Sans `initialValue`, le signal vaut `undefined` jusqu'à la première émission. Le template attend des nombres et des tableaux. `initialValue` évite donc les `undefined` au premier rendu, et sert aussi de valeur de repli quand une requête échoue.
   </details>

2. **Si `catchError` est déplacé après le `switchMap`, que se passe-t-il à la première erreur HTTP ?**
   <details>
   <summary>Réponse</summary>

   Le `catchError` capture l'erreur du flux externe, renvoie `of(initialValue)`, et ce flux se termine. Le signal ne reçoit plus aucune mise à jour : le widget reste sur la valeur initiale et ne réagit plus au changement de mois ou d'année, même si les filtres changent.
   </details>

3. **Pourquoi `switchMap` est-il préférable à `mergeMap` quand l'utilisateur change vite de filtre ?**
   <details>
   <summary>Réponse</summary>

   `switchMap` annule la requête précédente dès qu'une nouvelle valeur arrive. Seule la réponse à la dernière demande est affichée. Avec `mergeMap`, une réponse plus ancienne et plus lente pourrait arriver après la bonne et afficher des données périmées.
   </details>

---

## 3. Validation des paramètres de requête avec `z.coerce` (Zod)

### Où

- [dashboard.dto.ts](../../packages/merlebleu-shared/src/domain/sale/dashboard/dashboard.dto.ts) : l.4-10
- Utilisé par [dashboard.controller.ts](../../packages/merlebleu-api/src/features/sale/dashboard/dashboard.controller.ts) (l.10 à l.25) via `@Query()`

### Code

```ts
// dashboard.dto.ts (l.4-10)
export const dashboardQuerySchema = z.object({
  view: z.enum(DashboardView),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export type DashboardQueryDto = z.infer<typeof dashboardQuerySchema>;
```

Le contrôleur reçoit un objet déjà validé :

```ts
// dashboard.controller.ts (l.9-12)
@Get('orders-count')
getOrdersCount(@Query() query: DashboardQueryDto) {
  return this.dashboardService.getOrdersCount(query);
}
```

### Fonctionnement en détail

1. **Une query string est toujours du texte.** `GET /dashboard/orders-count?year=2026` reçoit `year` sous la forme `"2026"`, une chaîne. Un `z.number()` classique refuserait cette valeur.
2. **`z.coerce.number()` convertit d'abord, puis valide.** Zod applique `Number(input)` avant les vérifications. `"2026"` devient `2026`, puis `.int()` et `.min(2000).max(2100)` s'appliquent. Une valeur comme `"abc"` devient `NaN`, que Zod rejette.
3. **`.optional()` court-circuite la conversion pour `undefined`.** Si `month` est absent, la valeur reste `undefined` et le schéma l'accepte.
4. **`z.infer` dérive le type TypeScript** `DashboardQueryDto` du schéma. Il n'y a pas de type écrit à la main qui pourrait diverger de la validation. Le même type est utilisé côté front dans [dashboard.service.ts](../../packages/merlebleu-app/src/app/features/dashboard/dashboard.service.ts), ce qui respecte la règle du monorepo : les types partagés vivent dans `@merlebleu/shared`.

### Documentation officielle

- Zod, coercition : [zod.dev/api](https://zod.dev/api) (section « Defining schemas », qui recommande `z.coerce`)
- Zod, migration v4 (changements sur `z.coerce`) : [zod.dev/v4/changelog](https://zod.dev/v4/changelog?id=zcoerce-updates)

### Pourquoi ce choix

- **`z.coerce` plutôt qu'un `parseInt` manuel dans le contrôleur** : la validation et la conversion sont déclarées une seule fois, dans le schéma partagé. Le front et l'API utilisent la même règle.
- **Pourquoi `year` a des bornes (2000 à 2100)** : un paramètre aberrant (`year=99999`) produirait des dates invalides dans `getPeriodRange`. La borne protège la requête SQL en amont.
- **Piège à connaître** : avec `z.coerce.boolean()`, toute chaîne non vide devient `true`, y compris `"false"`. Ce n'est pas un problème ici, car on ne convertit que des nombres.

### Défi

1. **Sans `z.coerce`, quelle serait la validation de `year` pour `?year=2026` ?**
   <details>
   <summary>Réponse</summary>

   Le schéma serait `z.number()`, et la valeur reçue `"2026"` est une chaîne. La validation échouerait avec une erreur de type. Il faudrait convertir à la main avant de valider.
   </details>

2. **Que renvoie la validation pour `?view=YEAR&year=2026` (sans `month`) ?**
   <details>
   <summary>Réponse</summary>

   Elle réussit. `month` vaut `undefined`, et `.optional()` accepte cette valeur. `getPeriodRange` reçoit alors `month === undefined` et renvoie la plage de l'année entière.
   </details>

3. **Que se passe-t-il pour `?year=abc` ?**
   <details>
   <summary>Réponse</summary>

   `Number("abc")` vaut `NaN`. Zod rejette `NaN` pour un `number`, et la requête renvoie une erreur de validation avant d'atteindre le service.
   </details>

---

## 4. Agrégations SQL avec le QueryBuilder de TypeORM

### Où

- [dashboard.service.ts](../../packages/merlebleu-api/src/features/sale/dashboard/dashboard.service.ts) : `getOrdersCount` l.33-64, `getOrdersAmount` l.74-94, `getDistribution` l.97-120, `filterByRange` l.130-138
- [dashboard.period.ts](../../packages/merlebleu-api/src/features/sale/dashboard/dashboard.period.ts) : `getPeriodRange` l.11-27, `fillMonthPoints` l.29-38, `fillYearPoints` l.40-53

### Code

Compter les commandes par mois, avec `EXTRACT` :

```ts
// dashboard.service.ts (l.36-47)
const queryBuilder = this.orderRepository
  .createQueryBuilder('orders')
  .select(
    `EXTRACT(${isYearView ? 'YEAR' : 'MONTH'} FROM orders.orderDate)`,
    'period',
  )
  .addSelect('COUNT(*)', 'count')
  .where('orders.orderStatus != :cancelled', {
    cancelled: OrderStatus.CANCELLED,
  })
  .groupBy('period')
  .orderBy('period', 'ASC');
```

Compter les commandes par type sans double comptage :

```ts
// dashboard.service.ts (l.96-110)
// an order with several items of the same type or shape is counted once
const queryBuilder = this.orderItemRepository
  .createQueryBuilder('orderItems')
  .innerJoin('orderItems.order', 'orders')
  .select(`orderItems.${column}`, 'label')
  .addSelect('COUNT(DISTINCT orders.id)', 'count')
  .where('orders.orderStatus != :cancelled', {
    cancelled: OrderStatus.CANCELLED,
  })
  .groupBy(`orderItems.${column}`)
  .orderBy('count', 'DESC');
```

Compléter les mois absents, côté API :

```ts
// dashboard.period.ts (l.29-38)
export function fillMonthPoints(rows: DashboardCountPoint[]): DashboardCountPoint[] {
  const countByMonth = new Map(rows.map((row) => [row.period, row.count]));

  return Array.from({ length: 12 }, (_, index) => ({
    period: index + 1,
    count: countByMonth.get(index + 1) ?? 0,
  }));
}
```

### Fonctionnement en détail

1. **Le QueryBuilder construit le SQL pas à pas.** `createQueryBuilder('orders')` crée un alias `orders` sur l'entité. `.select`, `.where`, `.groupBy` ajoutent chacun une clause. Rien n'est exécuté avant l'appel final.
2. **Les requêtes brutes renvoient des objets simples.** `getRawMany()` ne reconstruit pas d'entités : il renvoie les lignes telles que PostgreSQL les produit, avec les alias donnés (`period`, `count`). Les valeurs numériques arrivent souvent sous forme de chaînes, d'où les `Number(row.count)`.
3. **`EXTRACT(MONTH FROM ...)` est une fonction PostgreSQL.** Elle extrait le mois ou l'année d'une date. Le `GROUP BY period` regroupe les commandes par cette valeur.
4. **`COUNT(DISTINCT orders.id)` évite le double comptage.** La requête part des lignes d'articles (`orderItems`) et joint la commande. Une commande avec deux articles de même type produit deux lignes. `COUNT(*)` compterait deux fois la commande ; `COUNT(DISTINCT orders.id)` la compte une seule fois.
5. **Les plages de dates sont semi-ouvertes.** `filterByRange` utilise `>= from AND < to`. `getPeriodRange` renvoie le premier jour du mois suivant comme `to`. Cela évite d'oublier ou de dupliquer les commandes du dernier jour.
6. **SQL ne renvoie que les groupes non vides.** Si aucune commande n'existe en mars, la ligne de mars n'apparaît pas. `fillMonthPoints` recrée les 12 mois avec `0` pour les absents, ce qui donne un graphique stable.

### Documentation officielle

- TypeORM, Select Query Builder : [typeorm.io/docs/query-builder/select-query-builder](https://typeorm.io/docs/query-builder/select-query-builder/)
- TypeORM, requêtes brutes (`getRawMany`) : même page, section « raw results »
- PostgreSQL, `EXTRACT` : [postgresql.org/docs/current/functions-datetime.html](https://www.postgresql.org/docs/current/functions-datetime.html)

### Pourquoi ce choix

- **Agrégation en base plutôt qu'en mémoire** : charger toutes les commandes puis les compter en TypeScript coûterait beaucoup plus de bande passante et de mémoire. La base sait compter efficacement.
- **QueryBuilder plutôt que du SQL brut** : les noms d'entités et de colonnes restent liés au modèle TypeORM, et les paramètres (`:cancelled`, `:from`, `:to`) sont échappés. Le SQL brut n'est utilisé que pour `EXTRACT`, qui n'a pas d'équivalent direct dans l'API du QueryBuilder.
- **`fillMonthPoints` côté API et non côté front** : le contrat de l'API est « toujours 12 points ». Le front n'a pas à savoir quels mois existent en base.
- **`getPeriodRange` en dates texte (`YYYY-MM-DD`)** : sans heure ni fuseau, la comparaison est simple et ne dépend pas du fuseau du serveur.

### Défi

1. **Pourquoi `COUNT(DISTINCT orders.id)` et pas `COUNT(*)` dans `getDistribution` ?**
   <details>
   <summary>Réponse</summary>

   La requête part des articles et joint la commande. Une commande de deux articles du même type donne deux lignes. `COUNT(*)` compterait la commande deux fois. `COUNT(DISTINCT orders.id)` ne compte chaque commande qu'une fois.
   </details>

2. **Pourquoi la borne haute de `filterByRange` est-elle exclusive (`<`) ?**
   <details>
   <summary>Réponse</summary>

   Parce que `to` est le premier jour de la période suivante (par exemple `2026-09-01` pour août). Avec `<=`, les commandes du 1er septembre seraient comptées dans août. Avec `< to`, chaque commande appartient à une seule période.
   </details>

3. **Pourquoi `fillMonthPoints` est-il nécessaire alors que SQL renvoie déjà les mois ?**
   <details>
   <summary>Réponse</summary>

   SQL ne renvoie que les mois qui ont au moins une commande. Le graphique doit afficher 12 barres, y compris les mois vides. `fillMonthPoints` recrée les 12 mois et met `0` pour ceux qui manquent.
   </details>

---

## Défi de synthèse

L'utilisateur est sur la vue « Mois » avec **août 2026** sélectionné, sur le tableau de bord. Il change l'année pour **2025**.

Décrivez :

1. Quelles requêtes HTTP sont envoyées, et avec quels paramètres de query string.
2. Lesquelles des quatre parties du tableau de bord (graphique en barres, montant, camembert par type, camembert par forme) sont rechargées, et pourquoi.
3. Ce qui change à l'écran pour le graphique en barres, et pourquoi le paramètre `month` n'a pas le même effet sur toutes les requêtes.

<details>
<summary>Réponse</summary>

1. `selectedYear` est un signal lu par `toQuery`. Son changement fait réémettre les quatre `computed` de requête. Les requêtes envoyées sont :
   - `GET /dashboard/orders-count?view=MONTH&year=2025&month=8`
   - `GET /dashboard/orders-amount?view=MONTH&year=2025&month=8`
   - `GET /dashboard/orders-by-type?view=MONTH&year=2025&month=8`
   - `GET /dashboard/orders-by-shape?view=MONTH&year=2025&month=8`

   Les quatre vues sont en mode « Mois » (leurs signaux `countView`, `amountView`, etc. valent `MONTH`), donc `month` est inclus dans chaque requête.

2. Les quatre parties sont rechargées, parce que toutes les quatre lisent `selectedYear()` dans `toQuery`. Chaque `switchMap` annule une requête en cours si une nouvelle arrive.

3. Le graphique en barres affiche désormais les 12 mois de 2025. Le paramètre `month` est **ignoré** par `getOrdersCount` pour la vue mois : cette méthode n'utilise que l'année (`getPeriodRange(DashboardView.YEAR, query.year)`) et regroupe par mois. En revanche, `amount` et les deux camemberts utilisent `resolveRange`, qui applique `month`. Ils ne montrent donc que août 2025.
</details>
