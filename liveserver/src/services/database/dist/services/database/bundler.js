//import globalExternals from '@fal-works/esbuild-plugin-global-externals'
console.time('es');
console.log('esbuild starting!');
const entryPoints = ['index.ts'];
const outfile = 'dist/index';
const esbuild = require('esbuild');
const { dtsPlugin } = require('esbuild-plugin-d.ts');
//import esbuild from 'esbuild'
//import { dtsPlugin } from 'esbuild-plugin-d.ts'
esbuild.build({
    entryPoints,
    bundle: true,
    outfile: outfile + '.js',
    //  platform:'node',
    format: 'cjs'
}).then(() => {
    esbuild.build({
        entryPoints,
        bundle: true,
        outfile: outfile + '.esm.js',
        format: 'esm',
        //  platform:'node',
        minify: true
    }).then(() => {
        esbuild.build({
            entryPoints,
            bundle: true,
            outfile: outfile + '.iife.js',
            format: 'iife',
            //  platform:'node',
            minify: true,
            plugins: [
                dtsPlugin()
            ]
        }).then(() => {
            console.log('esbuild completed!');
            console.timeEnd('es');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2J1bmRsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsMEVBQTBFO0FBRzFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO0FBRWhDLE1BQU0sV0FBVyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDakMsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDO0FBRTdCLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNuQyxNQUFNLEVBQUMsU0FBUyxFQUFDLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDbkQsK0JBQStCO0FBQy9CLGlEQUFpRDtBQUVqRCxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQ1osV0FBVztJQUNYLE1BQU0sRUFBQyxJQUFJO0lBQ1gsT0FBTyxFQUFDLE9BQU8sR0FBQyxLQUFLO0lBQ3ZCLG9CQUFvQjtJQUNsQixNQUFNLEVBQUMsS0FBSztDQUNiLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRSxFQUFFO0lBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUNaLFdBQVc7UUFDWCxNQUFNLEVBQUMsSUFBSTtRQUNYLE9BQU8sRUFBQyxPQUFPLEdBQUMsU0FBUztRQUN6QixNQUFNLEVBQUMsS0FBSztRQUNkLG9CQUFvQjtRQUNsQixNQUFNLEVBQUMsSUFBSTtLQUNaLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRSxFQUFFO1FBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUNaLFdBQVc7WUFDWCxNQUFNLEVBQUMsSUFBSTtZQUNYLE9BQU8sRUFBQyxPQUFPLEdBQUMsVUFBVTtZQUMxQixNQUFNLEVBQUMsTUFBTTtZQUNmLG9CQUFvQjtZQUNsQixNQUFNLEVBQUMsSUFBSTtZQUNYLE9BQU8sRUFBQztnQkFDTixTQUFTLEVBQUU7YUFDWjtTQUNGLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO1lBQ2pDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=