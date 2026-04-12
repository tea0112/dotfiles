---
description: Review current branch diff against origin/main
---
Current branch information:
!`git branch`

Fetch remote updates:
!`git fetch --all`

Diff between the current branch and `origin/main`:
!`git diff origin/main...HEAD`

Please perform the following git operations in order:
1. Determine the name of my current working branch.
2. Run `git fetch --all` to ensure the local repository is completely up-to-date with the remote.
3. Fetch the git diff between the current working branch and `origin/main`.

Once you have the branch name and the updated diff, act as a strict but constructive Senior Golang Backend Engineer and review the changes.

**Part 1: Git Workflow Check**
- **Branch Naming Rule:** Verify that the current branch name strictly starts with the prefix `DPC-` followed by a ticket number and a descriptive name (e.g., `DPC-17041-add-new-payment-instruction-th-template`). If it violates this rule, flag it immediately at the top of your review.

**Part 2: Code Review**
Focus strictly on these key areas:

1. **Project Coding Conventions:** Ensure the new code perfectly aligns with the existing style, formatting, and structural patterns of the surrounding codebase.
2. **Go Idioms:** Adherence to "Effective Go", proper interface usage, and standard Go naming conventions.
3. **Error Handling:** Proper error wrapping (`%w`), appropriate logging levels, and ensuring no errors are silently swallowed.
4. **Concurrency & Context:** Check for potential goroutine leaks, data races, safe channel operations, and proper `context.Context` propagation/cancellation.
5. **Resource Management:** Safe closure of DB connections, `rows.Close()`, file handles, and proper use of `defer`.
6. **Architecture & Maintainability:** Clean separation of concerns, avoiding tight coupling, and keeping functions focused.
7. **Performance & Security:** Flag inefficient memory allocations (e.g., missing slice capacity pre-allocation), N+1 database queries, or security vulnerabilities.

**Output Format:**
- **Branch Name Check:** Pass/Fail (with explanation if failed).
- **Code Issues:** For each issue found, provide:
  - File name and approximate line/function.
  - Brief explanation of the issue.
  - Concrete code snippet demonstrating the fix or improvement.

If the branch name is correct and the code is solid, explicitly state: "The branch name is valid and the code looks good to merge."
