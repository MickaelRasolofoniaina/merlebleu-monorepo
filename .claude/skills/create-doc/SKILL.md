---
name: create-doc
description: Use this skill when the user asks to create or update a documentation file under docs/ (e.g. "document X in docs/foo", "update docs/bar with..."). Takes the target doc file name and an instruction describing what to document.
---

Interpret the free-form arguments passed to this skill as follows:
- The first whitespace-separated word is the target documentation file name (without extension), relative to `docs/`.
- Everything after that first word, verbatim (do not truncate or drop any of it, regardless of length or language), is the instruction describing what to document.

If `docs/<target>.md` already exists, edit it by adding or updating the relevant section rather than overwriting the whole file. If it doesn't exist, create it. Apply the instruction faithfully. The documentation file must be written completely in English, even if the instruction was given in another language.
