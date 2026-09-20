// Bundlers (rolldown/esbuild/webpack) try to statically analyze `import()` calls,
// even ones built from a `const` string, which breaks runtime-only imports of the
// separately-built server bundle copied into dist/ after this file compiles.
// `new Function` hides the import from static analysis entirely.
const dynamicImport = new Function("specifier", "return import(specifier)") as (
  specifier: string
) => Promise<any>;

export { dynamicImport };
