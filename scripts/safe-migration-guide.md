# Safe Migration Guide

## Step 1: Push schema without unique constraints

The schema has been updated to temporarily remove the `@unique` constraint on `confirmationCode` and `slug`. This allows the migration to proceed without data loss.

Run:
```bash
npm run db:push
```

This will add the new fields and tables without enforcing uniqueness yet.

## Step 2: Fix data issues

After the migration, run the fix script to:
- Generate confirmationCodes for appointments that don't have them
- Fix any duplicate confirmationCodes
- Generate slugs for organizations that don't have them
- Fix any duplicate slugs

Run:
```bash
npx tsx scripts/fix-migration-issues.ts
```

Or if that doesn't work:
```bash
node --loader tsx scripts/fix-migration-issues.ts
```

## Step 3: Add unique constraints back

After fixing the data, update the schema to add back the unique constraints:

1. In `prisma/schema.prisma`, change:
   - `confirmationCode String?` → `confirmationCode String? @unique`
   - The `@@unique([confirmationCode])` at the bottom can be removed (it's redundant)

2. Run migration again:
```bash
npm run db:push
```

This will now safely add the unique constraints since all data is already unique.

## Alternative: Manual Fix

If you prefer to fix the data manually:

### Fix confirmationCodes:
```sql
-- Check for duplicates
SELECT "confirmationCode", COUNT(*) 
FROM appointments 
WHERE "confirmationCode" IS NOT NULL 
GROUP BY "confirmationCode" 
HAVING COUNT(*) > 1;

-- Generate codes for null values (run in your database)
-- You'll need to write a script or use Prisma Studio
```

### Fix slugs:
```sql
-- Check for duplicates
SELECT slug, COUNT(*) 
FROM organizations 
WHERE slug IS NOT NULL 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- Generate slugs for null values
```
