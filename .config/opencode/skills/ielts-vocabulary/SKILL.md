---
name: ielts-vocabulary
description: Use when the user pastes an IELTS script word or phrasal verb and asks for the meaning, definition, examples, or original/base tense form. Triggers on quoted words like "orchestra", "went down", "carpentry", or "cutting tools".
---

# IELTS Vocabulary Helper

## When to use

Use this skill when the user:

- Pastes a single word or short phrase in quotes (e.g. `"orchestra"`, `"went down"`, `"carpentry"`).
- Asks for the **meaning**, **definition**, or **examples** of a word.
- Asks for the **original tense form** or **base form** of a past-tense word (e.g. "went down" → "go down").
- References an IELTS Listening/Reading script file (path like `02 - IELTS/.../*.md`).
- Asks for A2-level explanations so the answers stay easy to understand.

Do NOT use this skill when the user asks for a written sentence, essay correction, or grammar explanation for a sentence — that's a different task.

## Core behavior

When triggered, produce a response that follows **exactly** this shape:

1. **One short A2-level definition.** One sentence. Simple words. No dictionary jargon.
2. **Five example sentences.** Each example followed by a short explanation of what it shows or how the word is used.
3. **Original/base tense form.** If the word is irregular, past-tense, or a phrasal verb, append a tiny line:
   - format: `base → past simple → past participle`
   - example: `go → went → gone`
   - skip this line when the word is regular and used in its base form (the user can see "they go" already means "go").
4. **In-script context line.** If the user shared an IELTS script or file path, paste the short quote where the word appears and explain the meaning in that specific sentence.
5. **Language.** Match the user's language for the surrounding text, but always keep the *definitions and explanations themselves* in A2 English. A2 = simple words, short sentences, no idioms inside the explanation.

## Output template

```
**word** /pronunciation if useful/

A2-level one-sentence definition.

1. **Example sentence one.**
   Brief explanation of how the word is used here.
2. **Example sentence two.**
   Brief explanation.
3. **Example sentence three.**
   Brief explanation.
4. **Example sentence four.**
   Brief explanation.
5. **Example sentence five.**
   Brief explanation.

**Original form:** base → past → past participle (only if relevant)

**In the script:** "short quote from the user's file"
→ A2 explanation of what it means in that sentence.
```

## IELTS script context handling

If the user references a file (e.g. `02 - IELTS/Listening/Cam 15/Test 2/Part 1 - Script.md`):

1. Read the file with the `read` tool.
2. Find the exact sentence containing the quoted word.
3. Quote that sentence (short, 1 line) in the "In the script" block.
4. Explain in A2 English what the word means **in that specific sentence** — not just a general definition.

If the file path is under `02 - IELTS/` or contains phrases like "IELTS", "Test 1/2/3/4 Part 1-4", "Q1/Q2 answers", treat it as a Cambridge IELTS script using the marks like `**word (Q1)**` as answer-style highlights (don't change them).

## Quick reference: common tense forms

| Base | Past simple | Past participle | Notes |
|---|---|---|---|
| go | went | gone | irregular |
| put | put | put | same all forms |
| run | ran | run | irregular |
| take | took | taken | irregular |
| make | made | made | irregular |
| give | gave | given | irregular |
| write | wrote | written | irregular |
| come | came | come | irregular |
| see | saw | seen | irregular |
| say | said | said | irregular |

For any other verb not listed, derive the forms with a regular `-ed` rule unless it's a known irregular; if unsure, mention both the regular guess and a note saying "check a dictionary if the form looks wrong."

## Common mistakes to AVOID

- **Giving only a dictionary definition.** Always include 5 examples with explanations.
- **Explaining using C1/C2 English.** If the explanation word is harder than the example, that defeats A2.
- **Forgetting the explanation beneath each example.** Each numbered example must be followed by an explanation line.
- **Auto-adding tense forms for regular verbs that are already in base form.** Only when relevant.
- **Long preamble.** Skip introductions like "Let's look at the word..." — go straight to the definition.
- **Skipping the in-script context line** when the user shared a file.
- **Summarizing this workflow in the description.** The description must stay focused on *when* to use, not *how* — agents may follow the description instead of reading the skill body.

## Cross-references

- **Brainstorming:** If the user asks for help *building* a vocabulary study tool, app, or workflow (not just answering a word), invoke the `brainstorming` skill instead of this one.
- **Obsidian skills:** If the script lives in the user's Obsidian vault and they ask for note formatting/organization, cross-load the `obsidian-markdown` or `obsidian-organizer` skill.
