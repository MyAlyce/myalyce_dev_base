//Most basic JS esbuild settings
require('esbuild').build({
    entryPoints: ['src/app.tsx'],
    bundle: true,
    outfile: 'dist/app.js'
  }).catch(() => process.exit(1))


//ESBuild instructions:
//https://esbuild.github.io/getting-started/#your-first-bundle
//Natively builds react, ts, etc. with added specification.
