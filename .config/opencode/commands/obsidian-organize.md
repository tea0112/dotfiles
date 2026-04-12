---
description: Turn messy Obsidian notes into a clear study flow
---

Use the `skill` tool to load `obsidian-organizer` before doing anything else.

Load more Obsidian skills only when needed:

- `obsidian-markdown` for `.md` note cleanup, frontmatter, wikilinks, embeds, callouts, and Obsidian Markdown.
- `obsidian-bases` only if you must inspect or edit a `.base` file.
- `json-canvas` only if you must inspect or edit a `.canvas` file.
- `obsidian-cli` when it helps inspect the vault or verify links and note paths.
- `defuddle` only when a note points to a normal web page that must be read.

Target path: $ARGUMENTS

If the target path is empty, ask the user for a file or folder path and stop.

Goal:

Turn unstructured notes into a clean study flow in a clear order. Focus on readability, sequence, and learning flow. Do not act like a dedupe or cleanup command.

Core rules:

- Resolve the provided path before making assumptions.
- If the target is one file, work only on that file.
- If the target is a directory, work only inside that directory tree.
- Do not delete notes, sections, attachments, `.base` files, or `.canvas` files unless the user explicitly asks.
- Do not mark content as duplicate just because it looks similar.
- Do not merge, collapse, replace, or remove content unless the text is clearly identical and the user explicitly approves it.
- If two parts look related but not fully the same, keep both and improve the wording or structure around them instead of removing either one.
- Prefer preserving information over reducing note count.
- Keep YAML frontmatter data unless it is clearly broken.
- Keep internal links valid and rewrite links only when a rename or move is explicitly approved.
- If you find links from outside the target scope, warn about them but do not edit outside scope.

What to improve:

- messy headings
- weak note order
- mixed summary and detail
- repeated ideas spread across notes
- unclear learning sequence
- poor spacing and Markdown structure
- weak titles when the correct title is clear

Study-flow target:

Organize the material into a simple learning order when the content allows it:

1. overview
2. key ideas
3. explanation
4. examples
5. practice or review

Use this order inside a single note when possible. For folders, use it as the default order for notes or sections when the structure is clear.

Safe actions allowed:

- reformat Markdown conservatively
- improve heading hierarchy
- split long blocks into clearer sections
- add short transition lines between sections when needed
- suggest a better note order
- suggest safer filenames or titles
- suggest moving attachments into `_assets/`
- suggest link fixes and autolinks when confidence is high

Actions that need explicit approval first:

- any rename
- any move
- any link rewrite caused by rename or move
- any attachment consolidation
- any structural folder reorganization
- any merge of notes or sections
- any deletion

Workflow:

1. Scan the target and understand the current structure, note shape, naming, metadata, links, and learning flow.
2. Make a dry-run first. Do not edit yet.
3. Present the dry-run in this order:
   - Scope
   - Current problems
   - Proposed study flow
   - Proposed formatting fixes
   - Proposed note order
   - Proposed renames or moves
   - Proposed link updates
   - Warnings
   - Needs decision
4. Ask whether to apply the changes.
5. Only after approval, make the approved edits carefully and verify links inside scope.

When applying edits, aim for the smallest safe change that makes the notes easier to study.
