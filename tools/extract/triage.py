#!/usr/bin/env python3
"""Assign every symbol a layer from what it actually needs, and write the
result back into module-map.json as overrides.

Layer is not a naming question, it is a dependency question:

  * a symbol that (transitively) reaches the Supabase client is data access
  * a symbol that renders belongs to a UI layer; if two or more feature
    modules use it, it is cross-cutting and moves to shared/
  * a symbol that needs neither is a pure rule and belongs in domain/

Run after editing module-map.json's rules, then re-run extract.py.
"""
import io, json, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from extract import app_script, strip_literals, leading_comment_start, target_for, DECL, IDENT

IMPURE_ROOTS = {"sb", "PUSH_SUPPORTED", "VAPID_PUBLIC_KEY", "EMAILJS_READY"}
# Anything that renders, holds React state, or reaches for a colour is
# presentation — a constant carrying theme colours is not a business rule.
RENDER_MARKERS = re.compile(r'\be\(|\bstyles\.|\buseState\(|\buseEffect\(|\buseMemo\(|\buseRef\('
                            r'|\bC\.|\bwithAlpha\(|\bMEAL_THEME\b|\bMUSCLE_COLORS\b')


def main():
    mapping = json.load(io.open(os.path.join(HERE, "module-map.json"), encoding="utf-8"))
    mapping["overrides_auto"] = {}   # always reclassify from the rules baseline
    code = app_script(io.open("index.html", encoding="utf-8").read())
    lines = code.split("\n")
    raw = [(i, m.group(2), m.group(1)) for i, l in enumerate(lines)
           for m in [DECL.match(l)] if m]

    starts = []
    for idx, (ln, name, kind) in enumerate(raw):
        lo = raw[idx - 1][0] + 1 if idx else 0
        starts.append(max(leading_comment_start(lines, ln), lo))
    bodies = {}
    for idx, (ln, name, kind) in enumerate(raw):
        end = starts[idx + 1] if idx + 1 < len(raw) else len(lines)
        bodies[name] = "\n".join(lines[starts[idx]:end])

    names = set(bodies)
    refs = {n: {r for r in IDENT.findall(strip_literals(b)) if r in names and r != n}
            for n, b in bodies.items()}
    renders = {n for n, b in bodies.items() if RENDER_MARKERS.search(strip_literals(b))}

    # transitive closure: who ends up touching the backend
    impure = set(IMPURE_ROOTS) & names
    changed = True
    while changed:
        changed = False
        for n, rs in refs.items():
            if n not in impure and rs & impure:
                impure.add(n); changed = True

    home = {n: target_for(n, mapping) for n in names}

    def feature(path):
        p = path.split("/")
        return p[1] if p[0] == "modules" and len(p) > 2 else None

    users = collections.defaultdict(set)
    for n, rs in refs.items():
        f = feature(home[n])
        if f:
            for r in rs:
                users[r].add(f)

    SETTLED = ("platform/", "shared/theme", "shared/brand", "shared/ui/empty-art", "app/")

    # Referencing the element factory, the palette or the stylesheet is the
    # exact test for presentation — surer than pattern-matching a body.
    presentational = {n for n in names
                      if n in renders or (refs[n] & {"e", "C", "styles"})}

    # A symbol may live in domain/ only if it is pure AND everything it reaches
    # is too. Seed optimistically, then withdraw until the set is stable —
    # purity is transitive, so one impure leaf disqualifies its whole chain.
    pure = {n for n in names if n not in presentational and n not in impure}
    PURE_UTIL = {n for n in names if home[n].startswith("shared/lib") and home[n] != "shared/lib/misc.js"}
    changed = True
    while changed:
        changed = False
        for n in sorted(pure):
            if any(r not in pure and r not in PURE_UTIL for r in refs[n]):
                pure.discard(n); changed = True

    proposed, stats = {}, collections.Counter()
    for n in sorted(names):
        cur = home[n]
        if cur.startswith(SETTLED):
            continue
        owns = sorted(users[n])
        if n in pure:
            dest = cur if cur.startswith("domain/") or n in PURE_UTIL else "domain/rules.js"
        elif n in presentational:
            if len(owns) >= 2:
                dest = "shared/widgets/index.js" if n in impure else "shared/ui/cross.js"
            elif len(owns) == 1 and cur.startswith(("domain/", "shared/", "data/", "platform/")):
                dest = "modules/%s/index.js" % owns[0]
            elif cur.startswith(("shared/lib", "domain/", "data/", "platform/")):
                dest = "shared/widgets/index.js" if n in impure else "shared/ui/cross.js"
            else:
                dest = cur
        elif n in impure:
            dest = "data/queries.js"
        else:
            # pure-ish glue that still reaches a component: it belongs with a
            # feature, not in a lower layer
            dest = "modules/%s/index.js" % owns[0] if len(owns) == 1 else "shared/widgets/index.js"
        proposed[n] = dest
        if dest != cur:
            stats[(cur, dest)] += 1

    # The per-symbol pass above is local; layering is a global property, so
    # settle it by repair until nothing moves. Three repairs, in the direction
    # that keeps the lower layer clean:
    #   shared -> modules      : pull the callee down into shared
    #   module A -> module B   : pull the callee down into shared
    #   domain/data -> feature : push the caller up into the feature
    def lay(d):
        p = d.split("/")
        return ("modules", p[1]) if p[0] == "modules" else (p[0] if p[0] != "shared" else "shared/" + p[1],)

    def to_shared(n):
        return "shared/widgets/index.js" if n in impure else "shared/ui/cross.js"

    for _ in range(60):
        moved = 0
        for a in sorted(names):
            da = proposed.get(a, home[a])
            for b in sorted(refs[a]):
                db = proposed.get(b, home[b])
                if db.startswith("modules/"):
                    fb = db.split("/")[1]
                    if da.startswith(("shared/", "domain/", "data/", "platform/")):
                        owns_a = sorted(users[a])
                        if len(owns_a) == 1:
                            dest, tgt = "modules/%s/index.js" % owns_a[0], a
                        else:
                            dest, tgt = to_shared(b), b
                        if proposed.get(tgt) != dest:
                            proposed[tgt] = dest; moved += 1
                elif db.startswith("shared/widgets") and da.startswith(("domain/", "data/", "platform/", "shared/ui", "shared/lib")):
                    if proposed.get(a) != to_shared(a):
                        proposed[a] = to_shared(a); moved += 1
        if not moved:
            break

    # Feature modules may depend on each other but not in a cycle. Break each
    # cycle by lifting the symbols on one edge into shared/ — the smallest edge
    # first, so the least code moves.
    for _ in range(40):
        mod_of = {}
        for n in names:
            d = proposed.get(n, home[n])
            mod_of[n] = d.split("/")[1] if d.startswith("modules/") else None
        edge = collections.defaultdict(list)
        for a in names:
            if not mod_of[a]:
                continue
            for b in refs[a]:
                if mod_of[b] and mod_of[b] != mod_of[a]:
                    edge[(mod_of[a], mod_of[b])].append(b)
        cycles = [(x, y) for (x, y) in edge if (y, x) in edge]
        if not cycles:
            break
        x, y = min(cycles, key=lambda p: len(edge[p]))
        for b in set(edge[(x, y)]):
            proposed[b] = to_shared(b)

    mapping["overrides_auto"] = proposed
    json.dump(mapping, io.open(os.path.join(HERE, "module-map.json"), "w"), indent=2)

    print("symbols: %d   renders: %d   touch-backend: %d" % (len(names), len(renders), len(impure)))
    print("overrides_auto written: %d\n" % len(proposed))
    for (a, b), c in stats.most_common(18):
        print("  %-30s -> %-26s %d" % (a, b, c))


if __name__ == "__main__":
    main()
