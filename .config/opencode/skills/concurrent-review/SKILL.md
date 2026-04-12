---
name: concurrent-review
description: Concurrency safety analysis for Go code. Detects race conditions, deadlocks, goroutine leaks, improper mutex usage, and unsafe map access. Use when reviewing concurrent Go code.
---

# Concurrency Safety Review for Go

## When to use

Use this skill when reviewing Go code that involves:
- Goroutines and channels
- Shared mutable state (maps, slices, structs)
- `sync` package primitives (Mutex, RWMutex, WaitGroup, Once)
- Context propagation and cancellation
- Worker pools or background processing

## Review Checklist

### 1. Race Condition Detection

- [ ] All shared mutable state is protected by a mutex or channel
- [ ] Map access from multiple goroutines uses `sync.Map` or mutex protection
- [ ] Slice append from multiple goroutines is synchronized
- [ ] Struct field writes from multiple goroutines are protected
- [ ] Read-modify-write sequences are atomic or mutex-protected
- [ ] Tests include `-race` flag: `go test -race ./...`

```go
// ❌ Race condition — concurrent map write
go func() { m["key"] = "value1" }()
go func() { m["key"] = "value2" }()

// ✅ Protected with mutex
mu.Lock()
m["key"] = "value"
mu.Unlock()

// ✅ Or use sync.Map for simple cases
var m sync.Map
m.Store("key", "value")
```

### 2. Mutex Usage

- [ ] `sync.Mutex` is used for exclusive access; `sync.RWMutex` for read-heavy workloads
- [ ] `defer mu.Unlock()` is used immediately after `mu.Lock()` to prevent deadlocks
- [ ] Mutex is never copied (passed by pointer or embedded in struct)
- [ ] Lock scope is minimal — no I/O, network calls, or channel ops under lock
- [ ] No nested locks on the same mutex (self-deadlock)
- [ ] Lock ordering is consistent across all code paths (prevents cross-deadlock)

```go
// ❌ Lock held during I/O — blocks other goroutines
mu.Lock()
resp, err := http.Get(url)  // Slow operation under lock!
mu.Unlock()

// ✅ Minimize lock scope
mu.Lock()
cachedURL := cache[key]
mu.Unlock()
resp, err := http.Get(cachedURL)  // I/O outside lock
```

### 3. Goroutine Lifecycle & Leaks

- [ ] Every goroutine has a clear termination condition
- [ ] `context.Context` is used to signal cancellation to goroutines
- [ ] Goroutines check `ctx.Done()` or `select` with cancel channels
- [ ] `sync.WaitGroup` is used to wait for goroutine completion
- [ ] No "fire and forget" goroutines without error handling
- [ ] Server shutdown waits for in-flight goroutines to complete

```go
// ❌ Goroutine leak — no way to stop
go func() {
    for {
        process()  // Runs forever, even after parent returns
    }
}()

// ✅ Cancellable goroutine
go func() {
    for {
        select {
        case <-ctx.Done():
            return
        case item := <-ch:
            process(item)
        }
    }
}()
```

### 4. Channel Patterns

- [ ] Channel direction is specified in function signatures (`chan<-`, `<-chan`)
- [ ] Buffered vs unbuffered channels are chosen intentionally
- [ ] Channels are closed by the **sender**, never the receiver
- [ ] `nil` channels are not sent to or received from (blocks forever)
- [ ] `select` with `default` is used for non-blocking operations
- [ ] Channel size is bounded to prevent unbounded memory growth

### 5. Context Propagation

- [ ] `context.Context` is the first parameter of functions that do I/O
- [ ] Contexts are not stored in structs (use method parameters)
- [ ] `context.WithTimeout` / `context.WithCancel` are used and their cancel functions called
- [ ] `context.Background()` is only used at the top level (main, server init)
- [ ] `context.TODO()` is not present in production code

```go
// ❌ Context stored in struct
type Service struct {
    ctx context.Context  // Bad: context has a lifecycle, structs don't
}

// ✅ Context passed as parameter
func (s *Service) Process(ctx context.Context, data Data) error {
    return s.repo.Save(ctx, data)
}
```

### 6. Errgroup & Worker Pools

- [ ] `errgroup.Group` is used for parallel tasks that need error collection
- [ ] Worker pool size is bounded (not spawning unlimited goroutines)
- [ ] `semaphore` pattern or `errgroup.SetLimit()` controls concurrency
- [ ] Errors from workers are collected and handled, not silently dropped

```go
// ✅ Bounded concurrency with errgroup
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(10)  // Max 10 concurrent goroutines

for _, item := range items {
    item := item
    g.Go(func() error {
        return processItem(ctx, item)
    })
}
if err := g.Wait(); err != nil {
    return fmt.Errorf("processing failed: %w", err)
}
```

### 7. Atomic Operations

- [ ] `sync/atomic` is used for simple counters/flags instead of mutex
- [ ] `atomic.Value` is used for read-heavy, write-rare shared values
- [ ] Atomic operations are not mixed with mutex-protected access for the same variable

## Common Concurrency Bugs

| Bug | Symptom | Detection |
|-----|---------|-----------|
| Data race | Intermittent wrong values | `go test -race` |
| Deadlock | Goroutine hangs forever | `SIGQUIT` stack dump |
| Goroutine leak | Memory grows over time | `runtime.NumGoroutine()` monitoring |
| Channel deadlock | Both sides blocked | Review send/receive pairs |
| Map concurrent write | `fatal error: concurrent map writes` | Runtime panic |

## Output Format

```
[RACE/DEADLOCK/LEAK/UNSAFE] file:LINE
  Shared resource: description
  Goroutines involved: G1 (line X), G2 (line Y)
  → Fix: Add sync.Mutex / use channel / use sync.Map
```
