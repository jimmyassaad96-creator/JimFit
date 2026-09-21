#!/usr/bin/env python3
"""Catch the TDZ class: a hook called above the declarations it reads.

Four times during the hooks extraction a hook was called before a `const` it
takes as an argument. typecheck, boundaries and the import check all pass; the
app renders nothing and the only symptom is a minified
"Cannot access 'X' before initialization" in the browser.

  python3 tools/extract/check-order.py [files...]     # default: src/**/*.js
"""
import io, os, re, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from extract import strip_literals

CALL = re.compile(r'=\s*(use[A-Z][\w$]*)\(\s*\{(.*?)\}\s*\)\s*;', re.S)
DECL = re.compile(
    r'^\s*(?:const|let|var)\s*(?:\[([^\]]*)\]|\{(.*?)\}|([A-Za-z_$][\w$]*))\s*=', re.M | re.S)


def declared_before(clean, pos):
    """Names bound by a const/let/var whose declaration ends before `pos`."""
    names = set()
    for m in DECL.finditer(clean):
        if m.end() > pos:
            continue
        for grp in m.groups():
            if grp:
                names |= set(re.findall(r'[A-Za-z_$][\w$]*', grp))
    return names


def main():
    files = sys.argv[1:] or [os.path.join(dp, f)
                             for dp, _, fs in os.walk("src") for f in fs if f.endswith(".js")]
    bad = 0
    for p in files:
        text = io.open(p, encoding="utf-8").read()
        clean = strip_literals(text)
        for m in CALL.finditer(clean):
            hook, args = m.group(1), m.group(2)
            passed = set(re.findall(r'(?<![.\w$])([A-Za-z_$][\w$]*)(?!\s*:)', args))
            before = declared_before(clean, m.start())
            # only flag names this file declares at all — others are imports/props
            all_decl = declared_before(clean, len(clean))
            late = sorted((passed & all_decl) - before)
            if late:
                line = clean.count("\n", 0, m.start()) + 1
                print("  %s:%d  %s reads %s before declaration"
                      % (p.replace("src/", ""), line, hook, ", ".join(late)))
                bad += 1
    print("no ordering problems" if not bad else "%d hook call(s) out of order" % bad)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
