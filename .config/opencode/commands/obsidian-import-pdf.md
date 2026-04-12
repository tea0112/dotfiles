---
description: Import selected PDF pages into an Obsidian note
---

Import the selected page range from the PDF into the Obsidian note I provide. Write only to the target Markdown note.

Use the `skill` tool to load `obsidian-markdown` before doing anything else.

Load additional Obsidian skills when the task needs them:

- `obsidian-cli` when it helps resolve the vault, locate the target note, create or update the note through the local Obsidian app, or verify the rendered result.
- `defuddle` instead of generic web fetching when the user also provides a normal web page URL for related context. Do not use it for URLs ending in `.md`.
- `obsidian-bases` only if the user explicitly expands the task to also create or edit a `.base` file.
- `json-canvas` only if the user explicitly expands the task to also create or edit a `.canvas` file.

These are inputs:
- PDF path
- From page
- To page
- Vault folder path
- Note slug or relative note path

If any required input is missing, ask for the missing values and stop.

Validate the inputs before doing any edits:
- `From page` and `To page` must be integers using 1-based page numbering.
- `From page` must be less than or equal to `To page`.
- Resolve and validate the PDF path, vault folder path, and target note path before writing.
- If the PDF or vault folder path does not exist, report it and stop.

Rules:
- Follow `obsidian-markdown` conventions for frontmatter, wikilinks, callouts, tags, embeds, and other Obsidian-native Markdown syntax where they fit this command.
- Process only range of pages, inclusive, using 1-based page numbering.
- Do not load the full PDF into model context.
- If needed, first create a temporary subset PDF for only the selected pages, then work from that subset.
- Prefer local parsing/OCR/extraction tools over stuffing raw PDF content into the model context.
- If pages are scanned or image-heavy, OCR them.
- Write the note in Obsidian-native Markdown from the first line: YAML frontmatter first, then H1 title, source details, summary, and extracted content.
- Create or update only Obsidian files, folders.
- Do not create or edit `.base` or `.canvas` files unless the user explicitly asks for that as additional work.
- Do not save or export images as separate files.
- Do not create attachment folders.
- Remove obvious headers, footers, and page-number noise when safe.
- Clean up any temporary files you create before finishing.

Extract and preserve, when present:
- title
- headings and subheadings
- paragraphs
- bullet and numbered lists
- tables
- equations
- code blocks
- captions
- figures/images as descriptions only, except software-development diagrams that can be safely converted to Mermaid

Image handling:
- When a figure, chart, diagram, photo, screenshot, or other image appears, understand it and describe it clearly in the note at the relevant location.
- Preserve the relationship between the image and its nearby caption or discussion.
- For charts, diagrams, and tables rendered as images, describe the key content, labels, trends, and structure as accurately as possible.
- If the PDF is clearly from the software development field and a figure is a diagram whose structure can be inferred with high confidence, create an equivalent Mermaid diagram in the note.
- Good Mermaid candidates include flowcharts, sequence diagrams, state diagrams, entity relationships, class relationships, architecture blocks, and decision trees.
- If a software-engineering diagram is Mermaid-capable and high confidence, use Mermaid instead of a prose-only description.
- If a software-engineering diagram cannot be converted to Mermaid with high confidence, describe it in simple, easy-to-understand language instead. Say what the main parts are, how they connect, and what the reader should notice.
- For software-engineering diagrams, prefer short plain descriptions over heavy jargon unless the source page clearly needs the technical terms.
- Do not convert ambiguous diagrams into Mermaid. Keep them as prose descriptions and mark them for manual review when needed.
- Do not invent missing nodes, edges, or labels. If the diagram is only partly legible or the structure is ambiguous, keep a prose description instead and mark it for manual review.
- Keep any nearby caption or brief explanatory text adjacent to the Mermaid block.
- If interpretation is uncertain, mark it for manual review.

Examples for software-engineering diagram descriptions:
- Flowchart example: `Flowchart of a login process. It starts with the user entering email and password. The system checks the credentials. If they are valid, the user goes to the dashboard. If they are not valid, the flow returns to the login screen with an error message.`
- Architecture example: `Architecture diagram with three main parts: web client, API server, and database. The web client sends requests to the API server. The API server reads and writes data in the database. A cache sits beside the API server to speed up repeated reads.`
- Sequence example: `Sequence diagram for order checkout. The user sends a checkout request to the frontend. The frontend calls the backend. The backend creates the order, asks the payment service to charge the card, and then returns a success response.`
- ERD example: `Entity relationship diagram with User, Project, and Task tables. One user can own many projects. One project can contain many tasks. Each task belongs to one project.`

Tasks:
1. Extract content only from range of pages.
2. Create or update the Obsidian notes.
3. Make the note Obsidian-native:
   - use YAML frontmatter
   - use wiki links only when confidence is high
   - do not use image embeds
4. Preserve structure and readability:
    - keep heading hierarchy
    - keep tables as markdown tables when possible
    - keep equations in LaTeX form when possible
    - keep code fences intact
    - when a software-development diagram is Mermaid-capable with high confidence, create a Mermaid code fence instead of a prose-only figure description
    - keep figure captions near the relevant figure description
    - remove obvious headers, footers, and page-number noise when safe
5. Add YAML frontmatter at the top with:
   - `title`
   - `source_pdf`
   - `source_pages`
   - `tags`
   - `imported`
6. Suggested note layout:
   - frontmatter
   - H1 title
   - source section
   - concise summary of selected pages
   - main extracted content
   - figures/visuals section if helpful, using prose descriptions instead of embedded files
   - review notes section for uncertain OCR/extraction areas
7. Only create `[[wikilinks]]` for entities, topics, or references when the match is clearly correct. Do not over-link.
8. At the end, print:
   - all files created or changed
   - any pages or sections that need manual review
   - any extraction limitations or low-confidence regions

Deliver the final result directly into Obsidian folders and notes
