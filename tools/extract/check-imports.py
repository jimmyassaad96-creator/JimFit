#!/usr/bin/env python3
"""Find identifiers a module uses but neither defines nor imports.

The codemod derived imports from a reference scan that blanked template
literals wholesale, so any name used only inside `${...}` was invisible to it.
Bundling does not catch this — an unresolved global is a runtime ReferenceError,
not a build error — so it needs its own check.

  python3 tools/extract/check-imports.py            # report
  python3 tools/extract/check-imports.py --fix      # add the missing imports
"""
import io, os, re, sys, collections

IDENT = re.compile(r'(?<![.\w$])([A-Za-z_$][\w$]*)')
SKIP = set("""await break case catch class const continue default delete do else export extends
finally for function if import in instanceof let new of return super switch this throw try typeof
var void while with yield true false null undefined arguments window document console globalThis
Math JSON Object Array String Number Boolean Date RegExp Promise Set Map WeakMap Error TypeError
parseInt parseFloat isNaN encodeURIComponent decodeURIComponent setTimeout clearTimeout
setInterval clearInterval requestAnimationFrame cancelAnimationFrame localStorage sessionStorage
navigator location fetch URL URLSearchParams Intl Symbol Infinity NaN structuredClone atob btoa
FileReader FormData Blob AbortController alert async from as static get set of""".split())


def strip_comments_and_plain_strings(s):
    """Blank comments and quoted strings, but KEEP ${...} bodies inside template
    literals — that is where the codemod lost references."""
    out, i, n = [], 0, len(s)
    while i < n:
        c, nxt = s[i], s[i + 1] if i + 1 < n else ''
        if c == '/' and nxt == '/':
            j = s.find('\n', i); j = n if j < 0 else j
            out.append(' ' * (j - i)); i = j
        elif c == '/' and nxt == '*':
            j = s.find('*/', i + 2); j = n if j < 0 else j + 2
            out.append(re.sub(r'[^\n]', ' ', s[i:j])); i = j
        elif c in '"\'':
            q, j = c, i + 1
            while j < n:
                if s[j] == '\\': j += 2; continue
                if s[j] == q: j += 1; break
                j += 1
            out.append(re.sub(r'[^\n]', ' ', s[i:j])); i = j
        elif c == '`':
            j, depth = i + 1, 0
            while j < n:
                if s[j] == '\\': out.append('  '); j += 2; continue
                if s[j] == '$' and j + 1 < n and s[j+1] == '{':
                    depth += 1; j += 2
                    start = j
                    braces = 1
                    while j < n and braces:
                        if s[j] == '{': braces += 1
                        elif s[j] == '}': braces -= 1
                        j += 1
                    out.append(' ' * 2 + s[start:j-1] + ' ')
                    continue
                if s[j] == '`': j += 1; break
                out.append(' ' if s[j] != '\n' else '\n'); j += 1
            i = j
        else:
            out.append(c); i += 1
    return ''.join(out)


def main():
    fix = "--fix" in sys.argv
    files = [os.path.normpath(os.path.join(dp, f))
             for dp, _, fs in os.walk("src") for f in fs if f.endswith(".js")]
    exports, texts = {}, {}
    for p in files:
        t = io.open(p, encoding="utf-8").read()
        texts[p] = t
        for grp in re.findall(r'^export \{ (.+?) \};', t, re.M):
            for name in (x.strip() for x in grp.split(",")):
                exports[name] = p

    problems = collections.defaultdict(lambda: collections.defaultdict(set))
    for p in files:
        t = texts[p]
        code = strip_comments_and_plain_strings(t)
        local = set(re.findall(r'(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)', code))
        local |= {x.strip() for grp in re.findall(r'import \{ (.+?) \}', t) for x in grp.split(",")}
        local |= set(re.findall(r'^import (\w+)[ ,]', t, re.M))
        local |= set(re.findall(r'\b([A-Za-z_$][\w$]*)\s*(?==>)', code))
        local |= set(re.findall(r'\(([^()]*)\)\s*=>', code)) and set(
            re.findall(r'[A-Za-z_$][\w$]*', " ".join(re.findall(r'\(([^()]*)\)\s*=>', code))))
        local |= set(re.findall(r'(?:catch|function[^(]*)\(\s*([A-Za-z_$][\w$]*)', code))
        # Destructuring counts as a local binding only in a declaration —
        # matching any "{...} =" swept object literals in and hid real misses
        # (styles was "locally bound" in four modules that never imported it).
        for pat in (r'^\s*(?:const|let|var)\s*\{([^{}]*)\}\s*=',
                    r'^\s*(?:const|let|var)\s*\[([^\[\]]*)\]\s*='):
            for grp in re.findall(pat, code, re.M):
                local |= set(re.findall(r'[A-Za-z_$][\w$]*', grp))
        # `catch (e)` binds e locally in 14 places in one file alone; a name
        # bound that way is never a missing import.
        caught = set(re.findall(r'catch\s*\(\s*([A-Za-z_$][\w$]*)', code))
        for name in set(IDENT.findall(code)):
            if name in SKIP or name in local or name in caught:
                continue
            src = exports.get(name)
            if src and src != p:
                problems[p][src].add(name)

    if not problems:
        print("no missing imports"); return
    total = sum(len(v) for d in problems.values() for v in d.values())
    print("%d modules missing %d imported names" % (len(problems), total))
    for p in sorted(problems):
        for src, names in sorted(problems[p].items()):
            print("  %-46s <- %-34s %s" % (p.replace("src/",""), src.replace("src/",""), ", ".join(sorted(names))))
    if fix:
        for p, by_src in problems.items():
            t = texts[p]
            lines = t.split("\n")
            last = max((i for i, l in enumerate(lines) if l.startswith("import ")), default=0)
            add = []
            for src, names in sorted(by_src.items()):
                rel = os.path.relpath(src, os.path.dirname(p))
                if not rel.startswith("."): rel = "./" + rel
                add.append('import { %s } from "%s";' % (", ".join(sorted(names)), rel))
            lines[last+1:last+1] = add
            io.open(p, "w", encoding="utf-8").write("\n".join(lines))
        print("\nadded %d import statements" % sum(len(v) for v in problems.values()))


if __name__ == "__main__":
    main()
