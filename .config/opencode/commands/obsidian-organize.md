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

**Core principle from the skill:** Preserve all note data, information, and content — no information must be lost. If content is truly duplicate (clearly identical), merge it. If similar but not identical, keep both.

The `obsidian-organizer` skill contains all rules, workflows, and formatting conventions. Follow it exactly. Do not add or override any rule without user approval.
