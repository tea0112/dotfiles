---
name: clean-arch-review
description: Clean Architecture compliance review for Go microservices. Validates layer dependency direction, interface placement, repository patterns, and package structure. Use when reviewing code that follows hexagonal or clean architecture.
---

# Clean Architecture Compliance Review

## When to use

Use this skill when reviewing Go microservices that follow Clean Architecture / Hexagonal Architecture patterns, especially services with this structure:

```
internal/
├── core/
│   ├── domain/       # Entities, value objects, domain errors
│   ├── port/         # Interfaces (driven & driving)
│   └── service/      # Use cases / application logic
├── adapter/
│   ├── handler/      # HTTP/gRPC handlers (driving adapters)
│   ├── repository/   # Database implementations (driven adapters)
│   └── client/       # External service clients (driven adapters)
└── infrastructure/   # Config, DI, server setup
```

## Review Checklist

### 1. Dependency Direction (The Golden Rule)

Dependencies MUST point inward: `adapter → port → domain`

- [ ] Domain layer has **zero imports** from adapter, port, or infrastructure
- [ ] Port layer only imports from domain
- [ ] Service layer imports ports and domain only — never adapters directly
- [ ] Adapters import ports and domain — never other adapters
- [ ] No `import` of `adapter/` packages in `core/` packages

```
✅ handler → service (via port interface) → repository (via port interface)
❌ service → concrete repository implementation
❌ domain → handler
```

### 2. Interface Placement (Ports)

- [ ] **Driving ports** (input): Defined in `port/` — implemented by services
- [ ] **Driven ports** (output): Defined in `port/` — implemented by adapters
- [ ] Interfaces are NOT in the same package as their implementation
- [ ] Port interfaces use domain types, never adapter-specific types (no `sql.Row`, `http.Request` in ports)

### 3. Domain Layer Purity

- [ ] Domain entities contain **business logic only** — no infrastructure concerns
- [ ] Domain types don't have JSON/DB/proto tags (use separate DTOs for serialization)
- [ ] Domain errors are defined in domain package, not borrowed from infrastructure
- [ ] Value objects are immutable and validate on construction
- [ ] No logger, database, or HTTP dependencies in domain

### 4. Service Layer (Use Cases)

- [ ] Each service method represents **one use case**
- [ ] Services depend on port interfaces, not concrete implementations
- [ ] Services orchestrate domain logic — they don't contain domain rules themselves
- [ ] Transaction boundaries are managed at the service level
- [ ] Services receive dependencies via constructor injection

### 5. Adapter Layer

- [ ] Handlers map HTTP/gRPC requests to domain types and call services via ports
- [ ] Repositories implement port interfaces and map domain types to DB schemas
- [ ] External clients implement port interfaces
- [ ] DTOs (request/response) are defined in the adapter layer, not domain
- [ ] Adapter-specific errors are translated to domain errors

### 6. Package Naming

- [ ] Package names match their architectural role
- [ ] No generic package names (`util`, `common`, `helper`, `misc`)
- [ ] Feature-based grouping within layers when services grow large
- [ ] `internal/` is used to prevent external imports

## Common Violations

| Violation | Symptom | Fix |
|-----------|---------|-----|
| Leaky abstraction | `*sql.DB` in service parameters | Define a port interface |
| Anemic domain | All logic in services, empty domain structs | Move business rules to domain |
| God service | Service with 20+ methods | Split by use case / subdomain |
| DTO in domain | `json:"..."` tags on domain entities | Create separate DTOs in adapter |
| Circular dependency | Package A imports B, B imports A | Extract interface to port layer |

## Output Format

```
[LAYER_VIOLATION] file:LINE
  From: adapter/repository/user.go
  To:   adapter/handler/user.go
  Rule: Adapters must not import other adapters
  → Fix: Extract shared logic to a port or domain service
```
