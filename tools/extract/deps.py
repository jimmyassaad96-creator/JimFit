#!/usr/bin/env python3
"""What a set of line ranges still needs from the component around it.

Sizing a hook by eye has twice produced a blank screen: the previous version of
this check only recognised single-line `const x = ...` declarations, so names
arriving from a multi-line hook destructure looked like globals and were never
reported. It now reads those too, and ignores object-literal keys, which are
the main source of false positives.

  python3 tools/extract/deps.py <file> <start-end> [<start-end> ...]
"""
import io, re, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from extract import strip_literals

IDENT = re.compile(r'(?<![.\w$])([A-Za-z_$][\w$]*)')


def component_bindings(text):
    """Every name bound at component scope.

    Includes multi-line hook destructures and the component's own props — a
    subtree reading `profile` straight off the signature was reported as
    needing nothing, and rendered a blank screen.
    """
    clean = strip_literals(text)
    names = set()
    for m in re.finditer(r'function\s+[A-Z][\w$]*\(\s*\{([^}]*)\}', clean):
        names |= {n for n in re.findall(r'[A-Za-z_$][\w$]*', m.group(1))
                  if n not in ("true", "false", "null", "undefined")}
    for m in re.finditer(r'^    (?:async )?(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)', clean, re.M):
        names.add(m.group(1))
    for m in re.finditer(r'^    (?:const|let|var)\s*\[([^\]]*)\]\s*=', clean, re.M):
        names |= set(re.findall(r'[A-Za-z_$][\w$]*', m.group(1)))
    # multi-line destructure: const { ... } = something;
    for m in re.finditer(r'^    (?:const|let|var)\s*\{(.*?)\}\s*=', clean, re.M | re.S):
        names |= set(re.findall(r'[A-Za-z_$][\w$]*', m.group(1)))
    return names


def used_as_value(text):
    """Identifiers read as values — object-literal keys and property access removed."""
    clean = strip_literals(text)
    clean = re.sub(r'(?<![.\w$])([A-Za-z_$][\w$]*)\s*:', ' ', clean)   # { key: ... }
    return set(IDENT.findall(clean))


def main():
    path = sys.argv[1]
    ranges = []
    for spec in sys.argv[2:]:
        a, b = spec.split("-")
        ranges.append((int(a), int(b)))
    lines = io.open(path, encoding="utf-8").read().split("\n")
    inside = "\n".join("\n".join(lines[a - 1:b]) for a, b in ranges)
    outside = "\n".join(l for i, l in enumerate(lines, 1)
                        if not any(a <= i <= b for a, b in ranges))
    defined = component_bindings(inside) | set(
        re.findall(r'(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)', strip_literals(inside)))
    need = sorted((used_as_value(inside) & component_bindings(outside)) - defined)
    print("lines moved: %d" % sum(b - a + 1 for a, b in ranges))
    print("still needed from the component (%d): %s" % (len(need), ", ".join(need) or "none"))


if __name__ == "__main__":
    main()
