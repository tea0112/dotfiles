---
name: go-test-review
description: Review Go test code quality including table-driven tests, mocking patterns, assertion quality, edge case coverage, and test isolation. Use when reviewing *_test.go files.
---

# Go Test Quality Review

## When to use

Use this skill when reviewing `*_test.go` files or evaluating test coverage for Go code changes.

## Review Checklist

### 1. Test Structure & Naming

- [ ] Test names follow `TestFunctionName_Scenario_Expected` or `Test_Type_Method_Scenario` pattern
- [ ] Table-driven tests are used for functions with multiple input/output combinations
- [ ] Test helper functions call `t.Helper()` for accurate error line reporting
- [ ] Subtests use `t.Run(name, func(t *testing.T) {...})` for granular test cases
- [ ] Test files are in the same package (white-box) or `_test` package (black-box) — chosen intentionally

```go
// ✅ Good test structure
func TestCalculateDiscount_WhenPremiumUser_ReturnsHigherDiscount(t *testing.T) {
    tests := []struct {
        name     string
        userType UserType
        amount   float64
        expected float64
    }{
        {"premium user gets 20%", Premium, 100.0, 80.0},
        {"regular user gets 10%", Regular, 100.0, 90.0},
        {"zero amount returns zero", Premium, 0, 0},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := CalculateDiscount(tt.userType, tt.amount)
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

### 2. Mocking & Dependency Injection

- [ ] Mocks are generated from **interfaces** (not concrete types)
- [ ] Mock expectations are specific — avoid `mock.Anything` when the value matters
- [ ] `mock.AssertExpectations(t)` is called to verify all expectations were met
- [ ] Test doubles are appropriate: stub (returns canned data), mock (verifies interactions), fake (simplified impl)
- [ ] No production dependencies in tests (real DB, real HTTP calls) unless integration test

```go
// ✅ Interface-based mock
type mockUserRepo struct {
    mock.Mock
}

func (m *mockUserRepo) GetByID(ctx context.Context, id string) (*User, error) {
    args := m.Called(ctx, id)
    return args.Get(0).(*User), args.Error(1)
}
```

### 3. Assertion Quality

- [ ] Assertions use `assert.Equal` / `require.Equal` — not manual `if` checks
- [ ] `require` is used for preconditions that should stop the test; `assert` for regular checks
- [ ] Error assertions are specific: `assert.ErrorIs(t, err, ErrNotFound)` — not just `assert.Error(t, err)`
- [ ] Nil checks use `assert.Nil` / `assert.NotNil` — not `assert.Equal(t, nil, ...)`
- [ ] Custom error messages explain what went wrong when assertion names aren't enough

### 4. Edge Case Coverage

Verify tests cover these scenarios:

- [ ] **Nil / zero values**: nil pointers, empty strings, zero numbers
- [ ] **Empty collections**: empty slices, empty maps
- [ ] **Boundary values**: max int, min int, max length strings
- [ ] **Error paths**: database errors, timeout errors, validation errors
- [ ] **Context cancellation**: canceled or timed-out contexts
- [ ] **Concurrent access**: if the code is used concurrently (use `-race` flag)

### 5. Test Isolation

- [ ] Each test is **independent** — no shared mutable state between tests
- [ ] No reliance on test execution order
- [ ] Test data is created within each test or test setup
- [ ] Parallel tests use `t.Parallel()` where safe and don't share state
- [ ] Cleanup is registered with `t.Cleanup()` for resources

### 6. Integration Test Markers

- [ ] Integration tests are separated with build tags or `testing.Short()` skip
- [ ] Database tests use test containers or in-memory alternatives
- [ ] External service tests can run without network access (or are skipped)

```go
func TestUserRepo_Create_Integration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test in short mode")
    }
    // ... test with real database
}
```

## Anti-Patterns to Flag

| Anti-Pattern | Issue | Fix |
|-------------|-------|-----|
| `assert.True(t, x == y)` | Unhelpful failure message | Use `assert.Equal(t, x, y)` |
| Test with no assertions | Test always passes | Add meaningful assertions |
| `time.Sleep` in tests | Flaky, slow tests | Use channels, waitgroups, or polling |
| Hardcoded test data paths | Breaks on CI/other machines | Use `testdata/` or `os.TempDir()` |
| Giant test function | Hard to maintain | Split into subtests |

## Output Format

```
[SEVERITY] file_test.go:LINE — Description
  Test: TestFunctionName
  → Suggestion: ...
```
