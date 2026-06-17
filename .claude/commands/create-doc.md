Full arguments: $ARGUMENTS

Parse the arguments above as follows:
- The first whitespace-separated word is the target documentation file name (without extension), relative to `docs/`.
- Everything after that first word, verbatim (do not truncate or drop any of it, regardless of length or language), is the instruction describing what to document.

If `docs/<target>.md` already exists, edit it by adding or updating the relevant section rather than overwriting the whole file. If it doesn't exist, create it. Apply the instruction faithfully. The documentation file must be written completely in English, even if the instruction was given in another language.
