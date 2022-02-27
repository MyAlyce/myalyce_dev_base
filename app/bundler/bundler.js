//const sassPlugin = require('esbuild-plugin-sass');        //include if needed
//const postCssPlugin = require('esbuild-plugin-postcss2'); //include if needed

//Most basic JS esbuild settings
require('esbuild').build({
    entryPoints: ['src/app.tsx'],
    bundle: true,
    outfile: 'dist/app.js',
    loader: {
      '.png' : 'file',
      '.jpg' : 'file',
      '.gif' : 'file',
      '.svg': 'file',
      '.woff': 'file',
      '.woff2': 'file',
      '.ttf': 'file',
      '.eot': 'file',
      '.mp3': 'file',
      '.mp4': 'file',
      '.json': 'text',
    },
    plugins:[
      //sassPlugin({type: "css-text"}),
      //postCssPlugin.default({ plugins: [ (x) => x ] })
    ]
  }).catch(() => process.exit(1))


//ESBuild instructions:
//https://esbuild.github.io/getting-started/#your-first-bundle
//Natively builds react, ts, etc. with added specification.
