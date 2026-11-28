-- Renaming "ingredient purchases" into "stock entries".
-- Run ONCE on each database, BEFORE starting the new API.
-- The API runs with `synchronize: true`: without this script TypeORM would create an
-- empty `stock_entries` table, leave the old one behind and the monthly summary would
-- show no entries for past months.
-- The database is shared between worktrees: warn the other branches before running it,
-- they still read `ingredient_purchases`.

BEGIN;
ALTER TABLE ingredient_purchases RENAME TO stock_entries;
ALTER TABLE stock_entries RENAME COLUMN "purchaseDate" TO "entryDate";
COMMIT;
