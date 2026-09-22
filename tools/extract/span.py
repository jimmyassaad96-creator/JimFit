#!/usr/bin/env python3
"""Exact source span of a component-scope declaration, comments included.

Boundaries by eye cost two bugs during the hooks extraction (a block that ran
18 lines past its handler and swallowed the component's loading guard). This
scans braces for function/class and the first top-level semicolon otherwise,
which is what the codemod should have done from the start.

  python3 tools/extract/span.py <file> <name> [<name> ...]
"""
import io, re, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from extract import strip_literals

HEAD = re.compile(r'^(\s+)(?:async\s+)?(function|class|const|let|var)\s+\[?([A-Za-z_$][\w$]*)')


def spans(path):
    src = io.open(path, encoding="utf-8").read()
    lines = src.split("\n")
    clean = strip_literals(src).split("\n")
    off = [0]
    for l in lines:
        off.append(off[-1] + len(l) + 1)
    flat = "\n".join(clean)
    out = {}
    for i, l in enumerate(lines):
        m = HEAD.match(l)
        if not m:
            continue
        indent, kind, name = m.group(1), m.group(2), m.group(3)
        j, brace, paren, brack, seen = off[i], 0, 0, 0, False
        while j < len(flat):
            c = flat[j]
            if c == "{": brace += 1; seen = True
            elif c == "}":
                brace -= 1
                if brace == 0 and seen and kind in ("function", "class"):
                    break
            elif c == "(": paren += 1
            elif c == ")": paren -= 1
            elif c == "[": brack += 1
            elif c == "]": brack -= 1
            elif c == ";" and brace == paren == brack == 0:
                break
            j += 1
        end = flat.count("\n", 0, j) + 1
        start = i
        while start - 1 >= 0:
            t = lines[start - 1].strip()
            if t.startswith("//") or t.startswith("*") or t.startswith("/*"):
                start -= 1
            else:
                break
        out.setdefault(name, (start + 1, end, len(indent)))
    return out


if __name__ == "__main__":
    s = spans(sys.argv[1])
    for n in sys.argv[2:]:
        if n in s:
            a, b, ind = s[n]
            print("%-30s %4d..%-5d (%d lines, indent %d)" % (n, a, b, b - a + 1, ind))
        else:
            print("%-30s NOT FOUND" % n)
