# Corrigé

**Ne lisez ce fichier qu'après avoir répondu à toutes les questions.**

---

## Niveau 1

### Q1

- `Parameters<F>` extrait sous forme de tuple les types des paramètres de la fonction `F`. Ici: `[type: NotificationType, input: CreateNotificationInput]`.
- `...args` récupère ce tuple en bloc, puis `this.notificationService.create(...args)` le redonne tel quel. `notify` n'est qu'un enrobage qui ajoute le `try/catch`.
- Si la signature de `create` change, `notify` suit automatiquement: pas de duplication du type, et les appelants de `notify` sont vérifiés par le compilateur.

### Q2

- `({ order: _, ...item }) => item` retire la propriété `order` de chaque ligne et garde le reste dans `item`. `_` est le nom conventionnel d'une variable inutilisée.
- Les entités se référencent mutuellement: `order.orderItems[i].order` pointe vers la commande. `buildOrderItems` met cette référence (`order`) pour que TypeORM crée la relation.
- Sérialiser tel quel en JSON provoquerait `Converting circular structure to JSON`. On coupe le cycle avant de répondre.

### Q3

- `?: never` interdit (ou rend `undefined`) la propriété de l'autre variante. Chaque membre de l'union exclut l'autre champ.
- `{ categoryId: 'a', ingredientId: 'b' }` est refusé: aucun membre de l'union ne l'accepte, car `ingredientId` doit être absent dans le premier et `categoryId` absent dans le second.
- Une interface à deux champs optionnels accepte « les deux » et « aucun ». L'union exprime « exactement un des deux ». Bonus: `target.categoryId ? ... : ...` permet le rétrécissement de type.

---

## Niveau 2

### Q4

- Avec `to` exclusif on n'a pas à calculer la longueur du mois (28, 29, 30, 31) ni les années bissextiles. La borne est simplement le 1er jour de la période suivante. C'est aussi correct si la colonne devient un timestamp: `<= '2025-01-31'` perdrait les heures du 31.
- `getPeriodRange(MONTH, 2025, 12)` renvoie `{ from: '2025-12-01', to: '2026-01-01' }` (cas particulier décembre: `nextMonthYear = year + 1`, `nextMonth = 1`).
- Les colonnes sont de type `date` (sans fuseau). Un objet `Date` introduit le fuseau: `toISOString()` convertit en UTC et peut décaler d'un jour. Les chaînes ISO se comparent correctement dans l'ordre alphabétique.

### Q5

- Dimanche: `getDay() = 0` donne `(0 + 6) % 7 = 6`. Lundi: `1` donne `0`. Jeudi: `4` donne `3`.
- `getDay()` vaut 0 pour dimanche. `(0 - 1) % 7` donnerait `-1` en JavaScript, car `%` garde le signe du dividende. Ajouter 6 (qui est `-1 mod 7`) donne un résultat toujours positif.

### Q6

- La clé `fixedType|label|detail` en minuscules identifie une ligne. On construit l'ensemble des clés du mois cible et on ne copie que les sources dont la clé n'y figure pas. Un second appel ne trouve plus rien à copier.
- On garde le jour du mois source, mais plafonné au dernier jour du mois cible. Le 31 janvier copié vers février devient le 28 (ou le 29).
- Le constructeur `Date` prend un mois de 0 à 11. En passant `month` (1 à 12), on désigne le mois **suivant**; le jour `0` signifie « le jour avant le 1er », donc le dernier jour du mois voulu.

### Q7

- Soustraire deux dates locales à minuit donne 23 h ou 25 h les jours de changement d'heure. Divisé par 24 h, on obtient 0,958 ou 1,042; avec `floor`, un écart de 1 jour pourrait donner 0.
- `Date.UTC(y, m, d)` ignore le fuseau, donc l'écart est un multiple exact de 24 h; `Math.round` absorbe le reste.
- Les pays avec heure d'été: en France, dernier dimanche de mars (journée de 23 h) et d'octobre (journée de 25 h). Madagascar n'a pas de changement d'heure, mais l'appli peut être utilisée depuis l'Europe.

---

## Niveau 3

### Q8

- Le SQL ne renvoie que les périodes qui ont des commandes. Sans remplissage, le graphique aurait des trous (2024 absent) et des échelles trompeuses.
- Lignes vides: `firstYear = currentYear`, `lastYear = currentYear`, soit un seul point à 0.
- Lignes 2023 et 2025, année courante 2026: de 2023 à 2026, avec 2024 et 2026 à 0.
- `Math.max(...[])` vaut `-Infinity`. Avec `currentYear` en premier argument, l'année en cours apparaît toujours, même sans commande.

### Q9

- `totalDue = 100`, `balanceDue = 100 - 30 = 70`. Après: `paidAmount = 100`, `balancePaidAmount = 70`, `balanceAmount = 0`, `paymentMethod = espèces` (l'acompte garde sa méthode car `paidAmount > 0`), `balancePaymentMethod = carte`.
- `groupCollectionsByMethod`: espèces `100 - 70 = 30` et carte `70`.
- Sans acompte (`paidAmount <= 0`), `paymentMethod` est remplacé par la méthode choisie à la livraison. Il n'y a pas d'acompte à attribuer à l'ancienne méthode, et la commande n'est plus rattachée à une méthode obsolète. La part d'acompte vaut de toute façon 0 et `add` ignore les montants <= 0.

### Q10

- Une jointure `order_items` x `orders` produit une ligne par ligne de commande. Une commande avec 2 gâteaux de même forme compterait 2 avec `COUNT(*)` et 1 avec `COUNT(DISTINCT orders.id)`. Le graphique compte des commandes, pas des lignes.
- PostgreSQL renvoie `COUNT` en `bigint`, que le driver `pg` retourne en chaîne. `getRawMany` ne convertit pas, d'où `Number(...)`.

### Q11

- `:role = ANY(colonne)` teste si la valeur appartient à un **tableau** PostgreSQL. `targetRoles` est donc une colonne de type tableau.
- Une notification vise plusieurs utilisateurs (par rôle). Un booléen unique serait partagé par tous. On a une table de liaison `NotificationReadEntity` (notification, utilisateur) qui enregistre qui a lu quoi. Non lues = total pour le rôle - lues par l'utilisateur.
- Contrainte d'unicité `(notification, user)`, d'après le commentaire du code (à vérifier dans `notification.entity.ts`). Avec `orIgnore()` (`ON CONFLICT DO NOTHING`), un double clic ou deux onglets simultanés n'insèrent qu'une ligne et ne lèvent pas d'erreur.

---

## Niveau 4

### Q12

- Trajet: `addOrder` enregistre la commande, `notify` appelle `notificationService.create`, qui sauvegarde en base puis fait `stream$.next(saved)`. Chaque client connecté à `GET /notification/stream` a un abonnement dont le `filter` ne laisse passer que les notifications dont `targetRoles` contient son rôle. Le navigateur reçoit l'événement par `EventSource.onmessage`, met à jour les signaux `recent` et `unreadCount`, et joue un son (Web Audio).
- Le `Subject` est un bus d'événements en mémoire (multicast): tous les abonnés reçoivent chaque émission. Le `filter` applique le ciblage par rôle pour chaque connexion.
- `withCredentials: true` envoie le cookie `access_token` (appli et API sur des origines différentes). `EventSource` ne permet pas de poser un en-tête `Authorization`, donc le cookie est la seule voie.
- Avec 2 instances, le `Subject` vit dans chaque processus. Une notification créée sur A n'est émise qu'aux clients connectés à A: ceux de B ne la reçoivent pas en temps réel (seulement au rechargement). Solutions: Redis pub/sub, `LISTEN/NOTIFY` PostgreSQL, ou un broker de messages.
- La commande est déjà enregistrée. Renvoyer une erreur 500 pour une notification ratée inciterait l'utilisateur à recommencer, et créerait un doublon. On journalise l'erreur et on continue.

### Q13

- `switchMap` annule la requête en vol lorsqu'une nouvelle valeur arrive. Avec `mergeMap`, la réponse d'un ancien mois arrivant après celle du nouveau mois écraserait les données (état incohérent). `concatMap` ferait attendre inutilement.
- Optimiste: **avant** l'appel, on retire la cellule et on ajoute une version locale avec le nouveau montant. **Succès**: on remplace par l'objet renvoyé par le serveur (avec son vrai id). **Échec**: on recharge le mois depuis le serveur.
- L'id `pending-<date>-<cible>` donne une clé stable avant que le serveur n'ait créé la ligne. Il est remplacé par l'id réel au retour (`isSameCell` retrouve la ligne par date et cible, pas par id).
- Le serveur est la source de vérité. Plusieurs saisies rapides rendent un retour arrière manuel fragile (on rétablirait une valeur périmée). `EMPTY` termine le flux sans émettre, donc `next` n'est pas appelé.
- `toObservable` donne un flux RxJS pour utiliser `switchMap` et l'annulation. Un `effect` n'est pas fait pour des appels asynchrones enchaînés. Le `computed` produit un nouvel objet à chaque changement de année ou mois, et `changeMonth` pose les deux signaux d'un coup: une seule émission.

### Q14

- Un `effect` s'exécute hors du contexte d'injection du constructeur. `afterNextRender` a besoin d'un contexte d'injection ou d'un `Injector` explicite; sans lui, erreur `NG0203`. L'`afterNextRender` attend que le DOM reflète le nouvel état avant de faire défiler vers la colonne du jour.
- `wrap` fait passer à la ligne suivante (ou précédente) en fin de ligne, comme un tableur. Les flèches ne bouclent pas: elles sont bornées par `Math.min/Math.max`. Tab est la touche de parcours séquentiel, donc le seul cas où « fin de ligne = début de la suivante » est attendu.
- Pendant l'édition, la cellule contient un `<input>` à la place du `<button>`. Après `commit()`, le bouton n'existe pas encore: on réessaie après le prochain rendu.
- C'est le « roving tabindex »: un seul élément de la grille est atteignable par Tab, les autres se parcourent par les flèches. Sinon, un utilisateur clavier devrait traverser des centaines de cellules avant de quitter la grille.

---

## Bonus

### Q15

- Le JWT est autonome et reste valable jusqu'à son expiration: un utilisateur rétrogradé, renommé ou supprimé garderait ses droits. Relire en base les prend en compte immédiatement. Coût: une requête SQL par appel (atténuable par un cache à courte durée).
- Seul « utilisateur inconnu » veut dire « non authentifié ». Une panne de base ou un délai dépassé est une erreur serveur (500): la convertir en 401 déconnecterait tous les utilisateurs à cause d'un incident technique.
- Si la valeur du cookie contient `=`, `split('=')[1]` la tronque (padding base64 `=`). Un JWT utilise base64url sans padding, donc pas de `=`. Plus robuste: `slice(indexOf('=') + 1)` ou `cookie-parser`.
- Risque: laisser `BYPASS_AUTH=true` en production donne un accès administrateur à tout le monde. Réductions: refuser le démarrage si `NODE_ENV=production` et bypass actif, limiter à un profil de développement, et journaliser en erreur. Autre point: l'utilisateur factice (`00000000-...`) n'existe pas en base, ce qui peut casser les contraintes de clé étrangère.
