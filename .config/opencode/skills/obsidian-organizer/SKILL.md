---
name: obsidian-organizer
description: Use when the user wants to format an Obsidian note or turn a messy Obsidian folder into a clear study flow. Apply conservative Markdown cleanup, safe internal autolinking, and dry-run first.
metadata:
  audience: obsidian-users
  workflow: vault-maintenance
---

# Obsidian Organizer

## When to use

Use this skill when the user asks to clean up, format, relink, reorganize, or standardize an Obsidian note or folder path.

## Core behavior

- Match the user's language.
- Be conservative: preserve note meaning and avoid speculative restructuring.
- Prefer the smallest correct set of edits.
- Keep structure, naming, metadata, and link style consistent from the start of the work.
- Start with a dry-run summary before applying any change.
- Do not delete files unless the user explicitly asks.
- Do not treat similar content as duplicate by default.
- Do not merge, collapse, replace, or remove content unless it is clearly identical and the user explicitly approves it.
- Do not edit files outside the provided scope.

## Input handling

- Expect a filesystem path from the user or calling command.
- Resolve the path before doing any work.
- If the path is a file, operate only on that file.
- If the path is a directory, operate recursively within that directory and its subdirectories.
- If the path is missing, invalid, or ambiguous, ask one short clarifying question.

## File mode

When the target is a single file:

- Format only that file.
- Normalize Markdown structure using conservative Obsidian conventions.
- Preserve frontmatter keys and values.
- Do not mass-autolink other notes.
- Do not move files or attachments unless the user later expands scope.

## Folder mode goals

When the target is a directory:

- Format Markdown notes recursively.
- When the content is clearly learning-oriented, prefer organization that supports clear reading order and study sequence.
- Focus on making the material easier to study before proposing file or folder moves.
- Keep note titles, frontmatter, filenames, aliases, and links internally consistent when the correct value is clear.
- Autolink notes safely within the provided directory tree.
- Warn about references from outside the directory tree if discovered, but do not edit files outside scope.

## Study-flow rules

- Keep the knowledge flow easy to follow. When a note already has a clear sequence, preserve it. When the sequence is messy and the fix is high confidence, normalize it into a clearer reading order.
- Prefer this study order when it fits the material:
  1. overview
  2. key ideas
  3. explanation
  4. examples
  5. practice or review
- If similar ideas appear in more than one place, keep both unless they are clearly identical.
- If repeated content adds useful context, keep it and improve headings or transitions instead of removing it.
- If consistency is uncertain, leave the content in place and report it under `Needs decision`.

## Consistency rules

- Prefer a consistent note shape within scope: frontmatter, title, context or source details when present, main content, and review or reference sections when useful.
- Keep filenames, H1 titles, frontmatter `title`, and strong aliases aligned when the intended canonical name is clear.
- Avoid partial cleanup that leaves mixed heading styles, mixed link styles, or conflicting metadata in the same scope.

## Conservative Obsidian formatting rules

- Make every changed note valid, readable, and Obsidian-native without changing its meaning.
- Normalize YAML frontmatter formatting while preserving data.
- Normalize heading spacing, blank lines, lists, blockquotes, callouts, code fences, and table spacing only when the intent is clear.
- Preserve callouts, footnotes, block references, tags, embeds, and existing Obsidian syntax.
- Prefer Obsidian wiki-links for internal note links that are created or rewritten, unless the existing local convention clearly prefers Markdown links.
- Do not rewrite prose for tone or style.
- Do not invent metadata fields unless the user explicitly asks.

## Semantic reorganization rules

- Infer structure from actual note content, frontmatter, tags, filenames, folder names, and the local link graph.
- Keep folders that already have clear meaning.
- Rename vague names such as `untitled`, `new folder`, or `misc` only when a better name is strongly supported by the contents.
- Split mixed folders only when there are clear high-confidence clusters.
- Do not force external systems such as PARA or Zettelkasten unless the user explicitly requests them.
- Do not move files, collapse folders, merge notes, or reorganize the folder tree without explicit approval from the user.
- If confidence is low, leave the file in place and list it under `Needs decision` in the dry-run.

## Autolink rules

- Only autolink when the target is a directory.
- Limit autolinking to notes within the provided directory tree.
- Build candidates from note file names, frontmatter `title`, and frontmatter `aliases`.
- Only create a link for an exact, unambiguous match.
- Preserve the original display text when adding a link.
- Prefer `[[Note]]`, `[[Folder/Note]]`, or `[[Note|display text]]` as needed.
- If multiple notes match the same text, do not autolink it; report the ambiguity instead.
- Do not autolink inside YAML, headings, code fences, inline code, existing links, embeds, tags, or raw URLs.
- Avoid autolinking very short or obviously generic terms.
- To reduce noise, link only the first occurrence of the same target within a note unless the user asks for denser linking.

## Attachment rules

- Do not move attachments unless the user approves that change.
- If attachment cleanup would help, propose moving attachments into `<folder-root>/_assets/` in the dry-run.
- Organize them into typed subfolders when useful:
  - `images`
  - `docs`
  - `audio`
  - `video`
  - `other`
- Preserve filenames when possible.
- If filenames collide, add a safe numeric suffix.
- Rewrite links and embeds inside scope only after an approved move or rename.
- If an attachment is already under `<folder-root>/_assets/` and is sensibly placed, prefer leaving it there.

## Link rewrite rules

- Update Obsidian wiki-links, embeds, Markdown links, and image links only when they are affected by an approved move or rename.
- Preserve anchors, block references, and display text.
- Keep link targets relative and readable for the local Obsidian convention.
- If you detect inbound links from outside the provided directory tree, report them in the dry-run as warnings only.

## Recommended workflow

1. Resolve the path and determine whether it is file mode or directory mode.
2. Inventory notes, folders, attachments, metadata, and internal links within scope.
3. Identify the local naming, metadata, and link conventions that should stay consistent.
4. Build a candidate note index from file names, titles, and aliases.
5. Produce a dry-run with these sections:
   - Scope
   - Current problems
   - Proposed study flow
   - Proposed formatting changes
   - Proposed note order
   - Proposed moves and renames
   - Link rewrites and autolinks
   - Warnings
   - Needs decision
6. Wait for approval before applying edits.
7. After approval, apply the smallest safe set of changes and verify links again.

## Output expectations

- Be explicit about what is high confidence versus ambiguous.
- Show concrete path changes when proposing file moves.
- Call out any risk of breaking references outside the provided scope.
- Keep summaries concise and actionable.
