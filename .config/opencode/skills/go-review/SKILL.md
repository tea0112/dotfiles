---
name: go-review
description: Comprehensive Golang code review checklist covering error handling, naming, interfaces, struct design, logging, and resource management. Use when reviewing Go source files.
---

# Golang Code Review Checklist

## When to use

Use this skill when reviewing Go source code for quality, correctness, and adherence to best practices. Apply this checklist to every `.go` file under review.

## Review Checklist

### 1. Error Handling

- [ ] Errors are **wrapped with context** using `fmt.Errorf("...: %w", err)` — never bare `return err`
- [ ] Sentinel errors use `errors.New` and are checked with `errors.Is()`
- [ ] Custom error types implement `Error()` and are checked with `errors.As()`
- [ ] No silently ignored errors (no `_ = someFunc()` without justification)
- [ ] Error messages are lowercase, no trailing punctuation (Go convention)
- [ ] `defer` cleanup runs correctly even when errors occur

### 2. Naming Conventions

- [ ] Package names are short, lowercase, single-word (no `under_scores` or `mixedCaps`)
- [ ] Exported names have clear, descriptive GoDoc comments
- [ ] Acronyms are consistently cased (`ID`, `HTTP`, `URL` — not `Id`, `Http`)
- [ ] Variable names reflect scope: short for small scopes, descriptive for large
- [ ] Avoid stuttering: `user.User` → `user.Record`, `http.HTTPClient` → `http.Client`
- [ ] Interfaces named with `-er` suffix when single-method: `Reader`, `Writer`, `Closer`

### 3. Interface Design

- [ ] Interfaces are **defined where they are used** (consumer side), not where implemented
- [ ] Interfaces are small — prefer 1-3 methods (Interface Segregation Principle)
- [ ] No premature abstraction — don't create interfaces with a single implementation unless needed for testing
- [ ] Accept interfaces, return concrete types

### 4. Struct & Method Design

- [ ] Pointer receivers for methods that mutate state; value receivers for immutable reads
- [ ] Consistent receiver type across all methods of a type
- [ ] Constructor functions (`New...`) return concrete types, not interfaces
- [ ] Zero value is useful — struct works correctly without explicit initialization
- [ ] No exported fields when getters/setters provide better encapsulation

### 5. Resource Management

- [ ] `defer` is used for cleanup: `Close()`, `Unlock()`, `Cancel()`
- [ ] `context.Context` is the first parameter and propagated through call chain
- [ ] HTTP response bodies are closed: `defer resp.Body.Close()`
- [ ] Database connections/rows are closed: `defer rows.Close()`
- [ ] File handles are closed after use
- [ ] Context cancellation is respected in long-running operations

### 6. Code Organization

- [ ] Functions are ≤50 lines where possible; extract helpers for complex logic
- [ ] Package-level `init()` is avoided unless absolutely necessary
- [ ] No circular dependencies between packages
- [ ] Related constants grouped with `const ()` blocks
- [ ] Blank imports (`_ "pkg"`) are documented with a comment explaining why

### 7. Logging & Observability

- [ ] Structured logging is used (key-value pairs, not string formatting)
- [ ] Log levels are appropriate: `Error` for failures, `Info` for business events, `Debug` for troubleshooting
- [ ] No sensitive data in logs (passwords, tokens, PII)
- [ ] Errors are logged **once** — either handle or propagate, never both

## Output Format

For each finding, report:

```
[SEVERITY] file.go:LINE — Description
  → Suggestion: ...
```

Severity levels: `CRITICAL`, `WARNING`, `INFO`, `STYLE`
