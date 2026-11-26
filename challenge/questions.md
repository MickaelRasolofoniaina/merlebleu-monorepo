# Questions

Les liens sont relatifs au dossier `challenge/`.

---

## Niveau 1: Syntaxe TypeScript / outils

### Q1. `Parameters<...>` et paramètres rest

Fichier: [order.service.ts:522](../packages/merlebleu-api/src/features/sale/order/order.service.ts#L522)

```ts
private async notify(
  ...args: Parameters<NotificationService['create']>
): Promise<void>
```

- Que fait `Parameters<NotificationService['create']>`?
- Pourquoi ne pas avoir écrit les deux paramètres à la main?
- Que se passe-t-il si la signature de `create` change?

### Q2. Destructuration avec `rest`

Fichier: [order.service.ts:538](../packages/merlebleu-api/src/features/sale/order/order.service.ts#L538)

```ts
orderItems: (order.orderItems ?? []).map(({ order: _, ...item }) => item)
```

- Que fait cette destructuration?
- Quel problème concret, au moment de la réponse HTTP, `sanitizeOrder` évite-t-il?
- Pourquoi ce problème existe-t-il avec ces entités précises?

### Q3. Union avec `?: never`

Fichier: [expense-store.service.ts:20](../packages/merlebleu-app/src/app/features/expense/expense-store.service.ts#L20)

```ts
type CellTarget =
  | { categoryId: string; ingredientId?: never }
  | { ingredientId: string; categoryId?: never };
```

- À quoi sert `?: never`?
- Quel objet `{ categoryId: 'a', ingredientId: 'b' }` le compilateur refuse-t-il, et pourquoi?
- Pourquoi une interface avec deux champs optionnels ne suffirait-elle pas?

---

## Niveau 2: Logique métier et dates

### Q4. Intervalle de dates exclusif

Fichiers: [dashboard.period.ts:11](../packages/merlebleu-api/src/features/sale/dashboard/dashboard.period.ts#L11) et [dashboard.service.ts:424](../packages/merlebleu-api/src/features/sale/dashboard/dashboard.service.ts#L424)

- Pourquoi `to` est-il **exclusif** (`< :to`) plutôt que de calculer le dernier jour du mois avec `<=`?
- Que renvoie `getPeriodRange(DashboardView.MONTH, 2025, 12)`?
- Pourquoi les dates sont-elles manipulées comme des chaînes `YYYY-MM-DD` et non comme des `Date`?

### Q5. Début de semaine

Fichier: [dashboard.service.ts:309](../packages/merlebleu-api/src/features/sale/dashboard/dashboard.service.ts#L309)

```ts
const daysSinceMonday = (now.getDay() + 6) % 7;
```

- Calculez le résultat pour un dimanche, un lundi et un jeudi.
- Pourquoi `+ 6` et pas `- 1`?

### Q6. Copie des dépenses fixes

Fichier: [expense.service.ts:144](../packages/merlebleu-api/src/features/expense/expense.service.ts#L144) (`copyFixedFromPreviousMonth`)

- Comment la fonction empêche-t-elle les doublons si on l'appelle deux fois?
- Que fait `Math.min(Number(source.date.slice(8, 10)), maxDay)`? Donnez un exemple avec le 31 janvier.
- Pourquoi `daysInMonth` utilise-t-il `new Date(year, month, 0)`, et pourquoi cela marche-t-il avec un mois de 1 à 12?

### Q7. Écart de jours et heure d'été

Fichier: [order.ts:97](../packages/merlebleu-app/src/app/shared/utils/order.ts#L97) (`getDeliveryDayDiff`)

- Pourquoi passer par `Date.UTC(...)` et `Math.round(... / 86400000)` plutôt que de soustraire deux `Date` locales avec `Math.floor`?
- Quel bug apparaît deux fois par an, et dans quels pays?

---

## Niveau 3: Algorithmes et SQL

### Q8. Combler les trous d'une série

Fichier: [dashboard.period.ts:40](../packages/merlebleu-api/src/features/sale/dashboard/dashboard.period.ts#L40) (`fillYearPoints`)

- Pourquoi cette fonction existe-t-elle? Que ferait le graphique sans elle?
- Que valent `firstYear` et `lastYear` si `rows` est vide?
- Que valent-ils si les lignes contiennent 2023 et 2025 et que l'année courante est 2026?
- Pourquoi `Math.max(currentYear, ...years)` et non `Math.max(...years)`?

### Q9. Acompte, solde et encaissements

Fichiers: [dashboard.service.ts:358](../packages/merlebleu-api/src/features/sale/dashboard/dashboard.service.ts#L358) (`groupCollectionsByMethod`) et [order.service.ts:428](../packages/merlebleu-api/src/features/sale/order/order.service.ts#L428) (`deliverOrder`)

Une commande vaut 100 (sans frais de livraison), avec un acompte de 30 payé en espèces. Elle est livrée et le solde est payé par carte.

- Quelles valeurs prennent `paidAmount`, `balancePaidAmount`, `balanceAmount`, `paymentMethod` et `balancePaymentMethod` après `deliverOrder`?
- Que renvoie `groupCollectionsByMethod` pour cette commande?
- Cas piège: la commande n'avait **aucun** acompte (`paidAmount = 0`). Que devient `paymentMethod`, et pourquoi?

### Q10. `COUNT(DISTINCT ...)`

Fichier: [dashboard.service.ts:391](../packages/merlebleu-api/src/features/sale/dashboard/dashboard.service.ts#L391) (`getDistribution`)

- Pourquoi `COUNT(DISTINCT orders.id)` et non `COUNT(*)`?
- Donnez un exemple chiffré où les deux résultats diffèrent.
- Pourquoi faut-il ensuite faire `Number(row.count)`?

### Q11. Notifications lues par utilisateur

Fichier: [notification.service.ts:98](../packages/merlebleu-api/src/features/notification/notification.service.ts#L98) (`countUnread`) et [:112](../packages/merlebleu-api/src/features/notification/notification.service.ts#L112) (`markAsRead`)

- Que signifie `:role = ANY(notification.targetRoles)` et que dit-il sur le type de la colonne en base?
- `countUnread` calcule `total - lus`. Quel modèle de données explique qu'on ne stocke pas un booléen `isRead` sur la notification?
- `.insert()...orIgnore()` repose sur une contrainte en base. Laquelle? Quel scénario concurrent protège-t-elle?

---

## Niveau 4: Architecture et réactivité

### Q12. Notifications temps réel (SSE)

Fichiers: [notification.service.ts (API)](../packages/merlebleu-api/src/features/notification/notification.service.ts#L28), [notification.controller.ts:21](../packages/merlebleu-api/src/features/notification/notification.controller.ts#L21), [notification.service.ts (App)](../packages/merlebleu-app/src/app/shared/services/notification.service.ts#L21)

- Décrivez le trajet complet, de « une commande est enregistrée » jusqu'au son qui retentit dans le navigateur d'un autre utilisateur.
- Quel est le rôle du `Subject` et du `filter(...)` dans le contrôleur?
- Pourquoi `withCredentials: true` sur l'`EventSource`?
- **Piège:** si on déploie 2 instances de l'API derrière un load balancer, que se passe-t-il? Pourquoi?
- Pourquoi `notify()` avale-t-elle les erreurs (`try/catch`) alors que `create` peut échouer?

### Q13. Store des dépenses: `switchMap` et mise à jour optimiste

Fichier: [expense-store.service.ts:63](../packages/merlebleu-app/src/app/features/expense/expense-store.service.ts#L63) et [:91](../packages/merlebleu-app/src/app/features/expense/expense-store.service.ts#L91)

- Pourquoi `switchMap` et non `mergeMap` ou `concatMap` pour recharger le mois? Quel bug apparaît si on clique très vite deux fois sur « mois suivant »?
- `setCell` est une mise à jour **optimiste**: décrivez les trois étapes (avant l'appel, succès, échec).
- Pourquoi l'id temporaire `pending-...`, et que devient-il?
- Dans le `catchError`, pourquoi renvoyer `EMPTY` et recharger le mois plutôt que de restaurer l'ancienne valeur à la main?
- Pourquoi `toObservable(computed(...))` plutôt qu'un `effect`?

### Q14. Grille de saisie: focus, rendu et accessibilité

Fichier: [expense-grid.ts:99](../packages/merlebleu-app/src/app/features/expense/grid/expense-grid.ts#L99) et [:330](../packages/merlebleu-app/src/app/features/expense/grid/expense-grid.ts#L330)

- Pourquoi `afterNextRender(...)` est-il appelé **à l'intérieur** d'un `effect`, avec `{ injector }`? Que se passerait-il sans l'`injector`?
- Dans `move`, que fait le paramètre `wrap` et pourquoi seule la touche Tab l'active-t-elle?
- Dans `focusCell`, pourquoi tenter `focus()`, puis réessayer après le prochain rendu? Quelle situation de l'interface l'impose?
- `isTabStop` renvoie vrai pour **une seule** cellule. Quel principe d'accessibilité est appliqué et pourquoi?

---

## Bonus: audit de sécurité

### Q15. Le guard d'authentification

Fichier: [auth.guard.ts](../packages/merlebleu-api/src/features/identity/auth/auth.guard.ts)

- Pourquoi relire l'utilisateur en base à **chaque** requête alors que le JWT contient déjà un rôle? Quel est le coût, quel est le bénéfice?
- Pourquoi seule `NotFoundException` est-elle convertie en `UnauthorizedException`?
- `extractTokenFromCookie` fait `accessToken.split('=')[1]`. Dans quel cas ce code casse-t-il? Pourquoi est-ce sans danger pour un JWT standard?
- `BYPASS_AUTH`: quel risque y voyez-vous et comment le réduire?
