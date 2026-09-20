// Layer rule from the spec, section 5.2, refined once the real dependencies
// were measured. The invariant worth protecting is that domain/ stays pure and
// that feature modules stay independent of each other; shared/ is split so
// presentational code cannot quietly acquire a backend call.
//
// Third-party packages are exempt from every rule except domain-is-pure,
// which stays absolute: business rules import nothing at all.
//
//   domain/         -> domain/, shared/lib/            (pure rules)
//   shared/lib/     -> shared/lib/                     (pure utilities)
//   shared/theme/   -> shared/lib/
//   shared/ui/      -> shared/ui|lib|theme, domain/    (presentational only)
//   shared/styles/  -> shared/palette                  (stylesheet slices)
//   shared/widgets/ -> anything except modules/, app/  (cross-cutting features)
//   platform/       -> platform/, shared/lib/
//   data/           -> data/, domain/, platform/, shared/lib/
//   modules/x/      -> anything except app/, and never in a cycle
//   app/            -> anything
module.exports = {
  forbidden: [
    {
      name: "domain-is-pure",
      severity: "error",
      comment: "domain/ holds business rules: no React, no network, no UI, no modules.",
      from: { path: "^src/domain" },
      to: { pathNot: "^src/(domain|shared/lib)" },
    },
    {
      name: "shared-lib-is-pure",
      severity: "error",
      from: { path: "^src/shared/lib" },
      to: { pathNot: "^(src/shared/lib|node_modules)" },
    },
    {
      name: "shared-ui-has-no-backend",
      severity: "error",
      comment: "Presentational components must not reach data/ or platform/.",
      from: { path: "^src/shared/(ui|theme|styles|palette)" },
      to: { pathNot: "^(src/(shared/(ui|lib|theme|react|brand|styles|palette)|domain)|node_modules)" },
    },
    {
      name: "stylesheet-reads-only-the-palette",
      severity: "error",
      comment: "A stylesheet slice may read colour tokens and nothing else.",
      from: { path: "^src/shared/(styles/|palette)" },
      to: { pathNot: "^src/shared/palette" },
    },
    {
      name: "shared-never-imports-features",
      severity: "error",
      from: { path: "^src/shared" },
      to: { path: "^src/(modules|app)" },
    },
    {
      name: "platform-is-lowest",
      severity: "error",
      from: { path: "^src/platform" },
      to: { pathNot: "^(src/(platform|shared/lib)|node_modules)" },
    },
    {
      name: "data-does-not-reach-up",
      severity: "error",
      from: { path: "^src/data" },
      to: { pathNot: "^(src/(data|domain|platform|shared/lib)|node_modules)" },
    },
    {
      name: "modules-acyclic",
      severity: "error",
      comment:
        "Feature modules may depend on each other, but never in a cycle. " +
        "The stricter 'no sibling imports at all' was tried first and is not " +
        "reachable by relocation: the component graph is one 158-symbol cycle, " +
        "so satisfying it emptied modules/ into a 10k-line shared bucket. " +
        "Breaking those references needs body edits, tracked as plan Task 10.",
      from: { path: "^src/modules" },
      to: { path: "^src/modules", circular: true },
    },
    {
      name: "nothing-imports-app",
      severity: "error",
      comment: "Only the entry point may reach the composition root.",
      from: { pathNot: "^src/(app|main\\.js)" },
      to: { path: "^src/app" },
    },
    { name: "no-circular", severity: "warn", from: {}, to: { circular: true } },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
  },
};
