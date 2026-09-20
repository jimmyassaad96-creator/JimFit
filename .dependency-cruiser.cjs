// Encodes the dependency rule from the spec, section 5.2. An unenforced
// boundary is a comment, so these are errors, not warnings.
module.exports = {
  forbidden: [
    {
      name: "domain-imports-nothing",
      severity: "error",
      comment: "domain/ is pure: no React, no network, no Supabase, no UI.",
      from: { path: "^src/domain" },
      to: { pathNot: "^src/domain" },
    },
    {
      name: "no-upward-imports",
      severity: "error",
      comment: "data/ and platform/ must not reach up into modules/ or app/.",
      from: { path: "^src/(data|platform)" },
      to: { path: "^src/(modules|app)" },
    },
    {
      name: "modules-are-siblings",
      severity: "error",
      comment: "Cross-module needs go down through domain/ or data/.",
      from: { path: "^src/modules/([^/]+)/" },
      to: { path: "^src/modules/(?!$1/)[^/]+/" },
    },
    {
      name: "shared-stays-shared",
      severity: "error",
      from: { path: "^src/shared" },
      to: { path: "^src/(modules|app|data|domain|platform)" },
    },
    { name: "no-circular", severity: "warn", from: {}, to: { circular: true } },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
  },
};
