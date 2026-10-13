Verbatim copies of `origin/main` at e3578c8 — the code the differential tests
(`tests/*-vs-main.test.ts`) compare the branch against, so "card, mixed and
JSON traffic is byte-identical to main" is checked against main itself rather
than against expectations written by hand.

The only edit: the two webhook routes import `./webhook-handler` (main's
handler, copied here) instead of `@/lib/fortis/webhook-handler`, so each side
runs main's stack end to end. Re-copy with `git show <ref>:<path>` if main's
versions of these files change on purpose.
