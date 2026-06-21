---
name: leetcode-practice
description: Use when the user provides a coding problem description (like from LeetCode) and starter code with a class/method stub, and wants a practice environment with test cases to implement the solution themselves.
---

# LeetCode Practice

## Overview
When a user gives you a coding problem (description + starter code), create a practice setup with test cases so they can implement the solution themselves.

## When to Use
- User provides problem description (examples, constraints)
- User provides starter code (class skeleton, method signatures)
- User says "design test case", "practice this problem", or similar

Do NOT use when the user asks you to implement the solution.

## Workflow

1. **Parse requirements**: Extract examples, constraints, edge cases from description
2. **Create solution file**: Starter skeleton only — `pass` bodies, keep imports and helpers, no implementation
3. **Create test file**: Comprehensive test cases using `pytest` assertions
4. **Report**: Tell the user "Files created. Run tests with: `python -m pytest test_*.py -v`"

## Test Design

Always include tests for:
- Each provided example
- Empty/null input
- Single element
- Boundary values
- Negatives (if applicable)
- Duplicates (if applicable)
- Mixed empty and non-empty (for list inputs)

Test file convention: `test_<snake_case_name>.py`

## Starter File Rules

- Keep all imports and helper utilities
- Method body must be `pass`
- No solution implementation
- Keep type annotations

## Prohibitions

- Do NOT implement the solution unless the user explicitly asks
- Do NOT add comments explaining how to solve it
- Do NOT modify the test file after creation unless the user asks
