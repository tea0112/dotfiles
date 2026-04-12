---
name: pg-review
description: PostgreSQL query and schema review for Go applications. Detects SQL injection, N+1 queries, missing indexes, unsafe migrations, and connection pool issues. Use when reviewing database-related Go code or SQL files.
---

# PostgreSQL Review for Go Applications

## When to use

Use this skill when reviewing:
- Go code that interacts with PostgreSQL (queries, repositories, migrations)
- SQL migration files (`.sql`)
- Database schema changes
- Repository layer implementations

## Review Checklist

### 1. SQL Injection Prevention

- [ ] All queries use **parameterized placeholders** (`$1`, `$2`) — never string concatenation
- [ ] `fmt.Sprintf` is **never** used to build SQL queries with user input
- [ ] Dynamic column/table names use a whitelist, not direct interpolation
- [ ] `IN` clauses are built with parameter expansion, not string joining

```go
// ❌ DANGEROUS
query := fmt.Sprintf("SELECT * FROM users WHERE id = '%s'", userID)

// ✅ SAFE
query := "SELECT * FROM users WHERE id = $1"
rows, err := db.Query(ctx, query, userID)
```

### 2. N+1 Query Detection

- [ ] No queries inside loops — use `JOIN`, `IN`, or batch queries instead
- [ ] Related data is loaded in a single query or with explicit preloading
- [ ] List endpoints use bulk fetching patterns

```go
// ❌ N+1 Problem
for _, order := range orders {
    user, _ := repo.GetUser(ctx, order.UserID)  // Query per iteration!
}

// ✅ Batch approach
userIDs := extractUserIDs(orders)
users, _ := repo.GetUsersByIDs(ctx, userIDs)  // Single query
```

### 3. Index & Query Performance

- [ ] `WHERE` clause columns have appropriate indexes
- [ ] Composite indexes match query column order (leftmost prefix rule)
- [ ] `LIKE` patterns don't start with `%` (prevents index usage)
- [ ] `ORDER BY` columns are indexed for sorted queries
- [ ] `EXPLAIN ANALYZE` has been considered for complex queries
- [ ] No `SELECT *` — only select needed columns

### 4. Transaction Handling

- [ ] Transactions are properly committed or rolled back (no orphaned transactions)
- [ ] `defer tx.Rollback()` is called immediately after `Begin()` — safe even after commit
- [ ] Transaction scope is **minimal** — don't hold transactions during I/O or external calls
- [ ] Read-only operations use read replicas or `SET TRANSACTION READ ONLY` where appropriate

```go
// ✅ Correct transaction pattern
tx, err := pool.Begin(ctx)
if err != nil { return err }
defer tx.Rollback(ctx)  // Safe: no-op after commit

// ... operations ...

return tx.Commit(ctx)
```

### 5. Migration Safety

- [ ] `ALTER TABLE ADD COLUMN` uses **no default** or is `NULL` (avoids full table lock)
- [ ] `CREATE INDEX CONCURRENTLY` is used instead of `CREATE INDEX` on large tables
- [ ] Column renames/drops are done in phases (add new → migrate data → drop old)
- [ ] Migrations are **backward compatible** with the previous code version
- [ ] `NOT NULL` constraints are added in a separate migration after backfilling
- [ ] No `DROP TABLE` or `DROP COLUMN` without data backup plan

### 6. Connection Pool & Configuration

- [ ] Connection pool size is configured (`MaxConns`, `MinConns`)
- [ ] Connection lifetime is set to prevent stale connections (`MaxConnLifetime`)
- [ ] Health check period is configured (`HealthCheckPeriod`)
- [ ] Queries use `context.Context` for timeout/cancellation
- [ ] Prepared statements are used for repeated queries

### 7. NULL Handling

- [ ] `NULL` values are handled correctly with `COALESCE()` or `sql.NullString` types
- [ ] `JOIN` conditions account for `NULL` values (`IS NULL` vs `= NULL`)
- [ ] Application code checks for `pgx` `ErrNoRows` appropriately
- [ ] `COUNT()` vs `COUNT(column)` distinction is understood (NULL exclusion)

## Output Format

```
[SEVERITY] file:LINE — Description
  Query: SELECT ...
  → Suggestion: ...
  → Impact: Performance / Security / Data Integrity
```
