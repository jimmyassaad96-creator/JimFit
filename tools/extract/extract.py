#!/usr/bin/env python3
"""Split index.html's single app script into ES modules.

  python3 tools/extract/extract.py [--out src] [--html index.html]

Mechanical only: it moves code, it never rewrites it. Declaration bodies are
copied byte-for-byte (including their comments); the only generated lines are
the import/export headers, derived from a reference graph.

Safe to re-run — it rewrites the output tree from scratch every time. Edit
module-map.json, not this file, to change where a symbol lands.
"""
import argparse, io, json, os, re, shutil, sys
from collections import defaultdict, OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
DECL = re.compile(r'^  (?:async\s+)?(function|const|let|var|class)\s+([A-Za-z_$][\w$]*)')
IDENT = re.compile(r'(?<![.\w$])([A-Za-z_$][\w$]*)')


def app_script(html):
    blocks = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.S)
    if not blocks:
        sys.exit("no inline <script> found")
    return max(blocks, key=len)


def strip_literals(s):
    """Blank out comments and string bodies so identifier scanning sees only code."""
    out, i, n = [], 0, len(s)
    while i < n:
        c, nxt = s[i], s[i + 1] if i + 1 < n else ''
        if c == '/' and nxt == '/':
            j = s.find('\n', i)
            j = n if j < 0 else j
            out.append(' ' * (j - i)); i = j
        elif c == '/' and nxt == '*':
            j = s.find('*/', i + 2)
            j = n if j < 0 else j + 2
            out.append(re.sub(r'[^\n]', ' ', s[i:j])); i = j
        elif c in '"\'`':
            q, j = c, i + 1
            while j < n:
                if s[j] == '\\': j += 2; continue
                if s[j] == q: j += 1; break
                j += 1
            out.append(re.sub(r'[^\n]', ' ', s[i:j])); i = j
        else:
            out.append(c); i += 1
    return ''.join(out)


def leading_comment_start(lines, decl_line):
    """Walk back over the comment block directly above a declaration."""
    i = decl_line - 1
    while i >= 0:
        s = lines[i].strip()
        if s.startswith('//') or s.startswith('*') or s.startswith('/*'):
            i -= 1
        else:
            break
    return i + 1


def target_for(name, mapping):
    # Hand-written decisions outrank anything triage.py generated, so a human
    # call is never silently reverted by re-running the classifier.
    if name in mapping['overrides']:
        return mapping['overrides'][name]
    if name in mapping.get('overrides_auto', {}):
        return mapping['overrides_auto'][name]
    for pat, dest in mapping['rules']:
        if re.search(pat, name):
            return dest
    return mapping['fallback']


def rel_import(frm, to):
    a, b = os.path.dirname(frm), to
    p = os.path.relpath(b, a or '.')
    return p if p.startswith('.') else './' + p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--html', default='index.html')
    ap.add_argument('--out', default='src')
    ap.add_argument('--map', default=os.path.join(HERE, 'module-map.json'))
    args = ap.parse_args()

    mapping = json.load(io.open(args.map, encoding='utf-8'))
    code = app_script(io.open(args.html, encoding='utf-8').read())
    lines = code.split('\n')
    line_off = [0]
    for l in lines:
        line_off.append(line_off[-1] + len(l) + 1)

    # ---- locate declarations ------------------------------------------------
    raw = [(i, m.group(2), m.group(1)) for i, l in enumerate(lines) for m in [DECL.match(l)] if m]
    names = OrderedDict((n, i) for i, n, k in raw)
    if len(names) != len(raw):
        dupes = [n for i, n, k in raw if [x[1] for x in raw].count(n) > 1]
        sys.exit('duplicate top-level names, cannot proceed: %s' % dupes[:5])

    entry_cfg = mapping.get('entry') or {}
    entry_at = None
    if entry_cfg.get('marker'):
        pat = re.compile(entry_cfg['marker'])
        for i, l in enumerate(lines):
            if pat.match(l):
                entry_at = i
                break
    if entry_at is not None:
        raw = [r for r in raw if r[0] < entry_at]

    # Span of a declaration = from its own leading comment block up to the
    # leading comment block of the next one. Deliberately not a brace scan:
    # regex literals and nested template strings desynchronise hand-written
    # lexers, and a boundary that is off by one swallows thousands of lines.
    starts = []
    for idx, (ln, name, kind) in enumerate(raw):
        lo = raw[idx - 1][0] + 1 if idx else 0
        starts.append(max(leading_comment_start(lines, ln), lo))

    units = []
    for idx, (ln, name, kind) in enumerate(raw):
        end = starts[idx + 1] if idx + 1 < len(raw) else (entry_at if entry_at is not None else len(lines))
        units.append({'name': name, 'kind': kind, 'start': starts[idx], 'end': end,
                      'body': '\n'.join(lines[starts[idx]:end]).rstrip()})

    covered = sum(u['end'] - u['start'] for u in units)
    preamble = [l for l in lines[:starts[0]] if l.strip()]
    tail = []

    # Top-level statements that are not declarations ride along with whichever
    # declaration precedes them; flag them so they can be hand-placed.
    stmt = re.compile(r'^  (?![ )}\]])(?!//)(?!/\*)(?!\*)\S')
    strays = []
    for u in units:
        for i in range(u['start'], u['end']):
            l = lines[i]
            if stmt.match(l) and not DECL.match(l):
                strays.append((i + 1, u['name'], l.strip()))

    # ---- assign modules -----------------------------------------------------
    home = {u['name']: target_for(u['name'], mapping) for u in units}
    # ESM imports are read-only bindings, so a module-level `let` that another
    # module assigns to is a hard build error. Co-locate each mutable binding
    # with whatever assigns it — these are all memo caches sitting beside their
    # own loader, so this just undoes an unlucky split.
    moved = []
    for u in units:
        if u['kind'] not in ('let', 'var'):
            continue
        assign = re.compile(r'(?<![.\w$])%s\s*=(?!=)' % re.escape(u['name']))
        writers = {home[o['name']] for o in units
                   if o is not u and assign.search(strip_literals(o['body']))}
        writers.discard(home[u['name']])
        if len(writers) == 1:
            dest = writers.pop()
            moved.append((u['name'], home[u['name']], dest))
            home[u['name']] = dest
        elif len(writers) > 1:
            moved.append((u['name'], home[u['name']], 'CONFLICT: %s' % sorted(writers)))

    mod_units = defaultdict(list)
    for u in units:
        mod_units[home[u['name']]].append(u)

    # ---- reference graph ----------------------------------------------------
    externals = mapping['externals']
    def shadowed(name, clean):
        # `catch (e)` is everywhere in this codebase and `e` is also the
        # React.createElement alias. Binding it locally without ever calling or
        # dereferencing it means the unit does not depend on the module-level one.
        if not re.search(r'catch\s*\(\s*%s\s*\)' % re.escape(name), clean):
            return False
        return not re.search(r'(?<![.\w$])%s\s*[(.\[]' % re.escape(name), clean)

    needs = defaultdict(set)
    for u in units:
        clean = strip_literals(u['body'])
        for ref in set(IDENT.findall(clean)):
            if ref == u['name'] or shadowed(ref, clean):
                continue
            if ref in home and home[ref] != home[u['name']]:
                needs[home[u['name']]].add(ref)
            elif ref in externals:
                needs[home[u['name']]].add(ref)

    # ---- emit ---------------------------------------------------------------
    out = args.out
    if os.path.isdir(out):
        shutil.rmtree(out)
    for mod, us in mod_units.items():
        path = os.path.join(out, mod)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        by_src = defaultdict(list)
        for ref in sorted(needs[mod]):
            by_src[externals[ref] if ref in externals else rel_import(mod, home[ref])].append(ref)
        head = ['// @generated by tools/extract/extract.py — bodies copied verbatim from index.html']
        for src in sorted(by_src):
            defaults = [r for r in by_src[src] if mapping.get('default_imports', {}).get(r) == src]
            named = [r for r in by_src[src] if r not in defaults]
            if defaults:
                head.append('import %s%s from "%s";' % (
                    defaults[0], (', { %s }' % ', '.join(named)) if named else '', src))
            else:
                head.append('import { %s } from "%s";' % (', '.join(named), src))
        body = '\n\n'.join(u['body'] for u in sorted(us, key=lambda x: x['start']))
        exports = 'export { %s };' % ', '.join(u['name'] for u in sorted(us, key=lambda x: x['start']))
        io.open(path, 'w', encoding='utf-8').write(
            '\n'.join(head) + '\n\n' + body + '\n\n' + exports + '\n')

    if entry_at is not None:
        boot = [l for l in lines[entry_at:] if l.strip() not in ('})();', '}())', '})()')]
        refs = set()
        clean = strip_literals('\n'.join(boot))
        for r in set(IDENT.findall(clean)):
            if r in home or r in externals:
                refs.add(r)
        by_src = defaultdict(list)
        for r in sorted(refs):
            by_src[externals[r] if r in externals else rel_import(entry_cfg['out'], home[r])].append(r)
        head = ['// @generated by tools/extract/extract.py — app bootstrap']
        for srcmod in sorted(by_src):
            defaults = [r for r in by_src[srcmod] if mapping.get('default_imports', {}).get(r) == srcmod]
            named = [r for r in by_src[srcmod] if r not in defaults]
            if defaults:
                head.append('import %s%s from "%s";' % (
                    defaults[0], (', { %s }' % ', '.join(named)) if named else '', srcmod))
            else:
                head.append('import { %s } from "%s";' % (', '.join(named), srcmod))
        io.open(os.path.join(out, entry_cfg['out']), 'w', encoding='utf-8').write(
            '\n'.join(head) + '\n\n' + '\n'.join(boot).strip() + '\n')
        print('entry written          : %s (%d lines)' % (entry_cfg['out'], len(boot)))

    # ---- report -------------------------------------------------------------
    print('declarations extracted : %d' % len(units))
    print('modules written        : %d  -> %s/' % (len(mod_units), out))
    print('lines covered          : %d / %d (%.1f%%)' % (covered, len(lines), 100.0 * covered / len(lines)))
    print('cross-module imports   : %d' % sum(len(v) for v in needs.values()))
    if moved:
        print('mutable bindings co-located with their writer: %d' % len(moved))
        for n, frm, to in moved:
            print('   %-32s %s -> %s' % (n, frm, to))
    print()
    print('%-38s %5s %6s %s' % ('module', 'syms', 'lines', 'imports'))
    for mod in sorted(mod_units):
        us = mod_units[mod]
        print('%-38s %5d %6d %d' % (mod, len(us), sum(u['end'] - u['start'] for u in us), len(needs[mod])))
    print('\npreamble lines (hand-port into src/main.js): %d' % len(preamble))
    for l in preamble[:6]:
        print('   %s' % l.strip()[:110])
    print('\ntop-level statements riding along with a declaration: %d' % len(strays))
    for ln, owner, txt in strays[:12]:
        print('   line %-6d in %-22s %s' % (ln, owner, txt[:70]))
    if len(strays) > 12:
        print('   ... %d more' % (len(strays) - 12))


if __name__ == '__main__':
    main()
