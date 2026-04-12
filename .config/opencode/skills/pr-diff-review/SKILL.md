---
name: pr-diff-review
description: Structured Pull Request and git diff review workflow. Classifies changes by type, performs cross-file impact analysis, and outputs findings by severity. Use when reviewing PRs, MRs, or git diffs from Jira tickets.
---

# Pull Request / Git Diff Review

## When to use

Use this skill when:
- User asks to review a PR, MR, or set of changes
- User provides a `git diff` output or branch name
- User provides Jira ticket context for a code review
- User asks to review staged or committed changes

## Workflow

### Step 1: Gather Context

1. Get the diff: `git diff main...HEAD` or `git diff --staged` or as provided
2. List changed files: `git diff --name-status main...HEAD`
3. If Jira ticket ID is provided, ask the user for the acceptance criteria / user story

### Step 2: Classify Changes

Categorize each changed file:

| Category | File Patterns | Review Focus |
|----------|--------------|--------------|
| **Business Logic** | `internal/core/`, `domain/`, `service/` | Correctness, edge cases, requirements |
| **Data Access** | `repository/`, `*.sql`, `migration/` | SQL safety, performance, schema compat |
| **API Layer** | `handler/`, `controller/`, `*.proto` | Input validation, error responses, contracts |
| **Configuration** | `*.yaml`, `*.json`, `*.env`, `*.toml` | Secrets exposure, env-specific values |
| **Tests** | `*_test.go` | Coverage, edge cases, mocking quality |
| **Infrastructure** | `Dockerfile`, `docker-compose*`, `*.tf` | Security, resource limits |
| **Documentation** | `*.md`, `docs/` | Accuracy, completeness |

### Step 3: Review Each File

For each changed file, apply the relevant checklist:
- `.go` files → Apply **go-review** skill patterns
- `.sql` / repository files → Apply **pg-review** skill patterns
- `*_test.go` files → Apply **go-test-review** skill patterns
- Cross-cutting → Apply **security-review** patterns

### Step 4: Cross-File Impact Analysis

- [ ] Interface changes are reflected in all implementations
- [ ] New fields in structs are handled in all serialization points (JSON, DB, proto)
- [ ] Database schema changes match code entity changes
- [ ] New dependencies are actually used and necessary
- [ ] Error handling is consistent across the call chain
- [ ] New endpoints have corresponding tests

### Step 5: Assess Against Requirements

If Jira ticket context is available:
- [ ] All acceptance criteria are addressed in the code
- [ ] No unrelated changes mixed in (keep PRs focused)
- [ ] Edge cases from the story are handled
- [ ] Breaking changes are flagged and documented

## Output Format

Structure the review as follows:

```markdown
## PR Review: [Title/Ticket]

### Summary
- Files changed: N
- Lines added: +N / removed: -N
- Categories: [Business Logic, Tests, ...]

### Findings

#### 🔴 Critical (must fix before merge)
1. [file:line] Description...

#### 🟡 Warning (should fix)
1. [file:line] Description...

#### 🔵 Info (suggestion / nice-to-have)
1. [file:line] Description...

#### ✅ Good practices observed
1. Description...

### Verdict
[ ] ✅ Approve — Ready to merge
[ ] 🔄 Request changes — See critical/warning items
[ ] 💬 Comment — Non-blocking suggestions only
```

## Tips

- Start with the **domain/business logic** files to understand intent
- Review **tests last** — after understanding what they should test
- Flag any file >300 lines of changes for extra scrutiny
- If the PR touches >10 files, suggest splitting into smaller PRs
