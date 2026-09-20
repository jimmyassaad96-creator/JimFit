# Codemod: retired after the split

`extract.py` + `triage.py` + `module-map.json` performed the one-way move from
`index.html` into `src/`. That move is done.

**`src/` is now the source of truth.** Do not re-run these scripts: they
regenerate `src/` from `index.html` and would discard every hand edit made
since — which is exactly what the remaining work (splitting oversized
components, converting to TypeScript) consists of.

They stay in the tree because they are the audit trail for how `src/` was
produced: the mapping shows where each of the 394 declarations came from, and
re-running against the `index.html` of that commit reproduces the tree.

If `index.html` must be re-imported after a hot-fix shipped straight to
production, re-run into a scratch directory and diff — never over `src/`:

    python3 tools/extract/extract.py --out /tmp/src-check
    diff -r src /tmp/src-check
