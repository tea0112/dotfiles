---
name: security-review
description: Security audit for Go and PostgreSQL applications. Covers SQL injection, authentication bypass, sensitive data exposure, input validation, rate limiting, and secret management. Use when reviewing security-critical code paths.
---

# Security Review for Go + PostgreSQL

## When to use

Use this skill when reviewing:
- Authentication / authorization code
- OTP / token generation and validation
- API endpoints handling sensitive data
- Database queries with user input
- Configuration and secret management
- Rate limiting implementations

## Review Checklist

### 1. SQL Injection

- [ ] All queries use parameterized placeholders (`$1`, `$2`) — never string concatenation
- [ ] Dynamic queries (filters, sorting) use whitelisted column names
- [ ] ORM/query builder usage is reviewed for raw SQL escape hatches
- [ ] Stored procedures parameters are properly typed

### 2. Authentication & Authorization

- [ ] JWT tokens are validated: signature, expiration, issuer, audience
- [ ] Token refresh logic prevents token replay attacks
- [ ] Authorization checks are present on **every** protected endpoint
- [ ] Role/permission checks happen at the service layer, not just handler
- [ ] Password comparison uses constant-time comparison (`subtle.ConstantTimeCompare`)
- [ ] Session invalidation works correctly on logout/password change

### 3. OTP & Token Handling

- [ ] OTP generation uses cryptographically secure random (`crypto/rand`, not `math/rand`)
- [ ] OTP has expiration time and single-use enforcement
- [ ] Rate limiting prevents OTP brute-force attacks
- [ ] Failed OTP attempts are tracked and limit enforced
- [ ] OTP are not logged or exposed in error messages
- [ ] TOTP secrets are stored encrypted

### 4. Input Validation & Sanitization

- [ ] All user inputs are validated: type, length, format, range
- [ ] Validation happens at the API boundary (handler layer)
- [ ] File uploads are validated: size, type, content (not just extension)
- [ ] URL/redirect parameters are validated against a whitelist
- [ ] JSON deserialization has size limits to prevent DoS
- [ ] Array/slice inputs have maximum length checks

### 5. Sensitive Data Protection

- [ ] PII is never logged (emails, phone numbers, addresses, IDs)
- [ ] Passwords/tokens are never included in error responses
- [ ] Debug/stack trace information is not exposed in production error responses
- [ ] Sensitive fields use `json:"-"` to prevent accidental serialization
- [ ] Database queries don't return more fields than needed

```go
// ❌ Leaks sensitive data
log.Printf("User login failed: email=%s, password=%s", email, password)

// ✅ Safe logging
log.Printf("User login failed: email=%s", maskEmail(email))
```

### 6. Rate Limiting

- [ ] Rate limits are enforced per user/IP/device as appropriate
- [ ] Rate limit headers are returned (`X-RateLimit-*`)
- [ ] Distributed rate limiting uses Redis/shared storage (not in-memory for multi-instance)
- [ ] Rate limit bypass keys are rotated and not hardcoded
- [ ] Cooldown periods increase on repeated violations

### 7. HTTP Security Headers

- [ ] `Content-Type` is set explicitly on all responses
- [ ] CORS origins are explicitly whitelisted (not `*` in production)
- [ ] `X-Content-Type-Options: nosniff` is set
- [ ] `Strict-Transport-Security` is set for HTTPS
- [ ] Response size limits are configured

### 8. Secret Management

- [ ] No hardcoded credentials, API keys, or secrets in source code
- [ ] Secrets are loaded from environment variables or secret manager
- [ ] `.env` files are in `.gitignore`
- [ ] Database connection strings don't contain plaintext passwords in logs
- [ ] API keys have appropriate scope and rotation policy

### 9. Error Handling (Security Perspective)

- [ ] Error messages don't reveal internal structure (table names, query details)
- [ ] Authentication errors are generic: "invalid credentials" (not "user not found" vs "wrong password")
- [ ] Panic recovery middleware is in place
- [ ] Errors from external services are wrapped, not exposed directly

## Severity Classification

| Severity | Criteria | Action |
|----------|----------|--------|
| 🔴 **CRITICAL** | Exploitable vulnerability (SQLi, auth bypass) | Block merge, fix immediately |
| 🟠 **HIGH** | Sensitive data exposure, weak crypto | Fix before release |
| 🟡 **MEDIUM** | Missing validation, improper error handling | Fix in current sprint |
| 🔵 **LOW** | Missing security headers, informational | Track in backlog |

## Output Format

```
[CRITICAL/HIGH/MEDIUM/LOW] file:LINE
  Vulnerability: Description
  Attack Vector: How it could be exploited
  → Remediation: Specific fix
  → Reference: OWASP/CWE link if applicable
```
