// Install Rollup Plugins
// yarn add typescript rollup @babel/core @babel/preset-env @rollup/plugin-commonjs @web/rollup-plugin-copy @rollup/plugin-node-resolve rollup-plugin-minify-html-literals rollup-plugin-summary rollup-plugin-typescript2 rollup-plugin-terser rollup-plugin-import-css @rollup/plugin-node-resolve @rollup/plugin-babel @babel/plugin-proposal-class-properties -D
import { copy } from '@web/rollup-plugin-copy';
import resolve from '@rollup/plugin-node-resolve';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import summary from 'rollup-plugin-summary';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-import-css";
import node_resolve from "@rollup/plugin-node-resolve";
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
/**
 * @type {import('rollup').RollupOptions}
 */
var umd = {
    input: './index.ts',
    output: [{
            file: pkg.main,
            format: 'umd',
            exports: 'named',
            name: 'liveserver'
        }]
};
var common = {
    plugins: [
        commonjs(),
        node_resolve(),
        babel({
            babelHelpers: 'bundled',
            plugins: ["@babel/plugin-proposal-class-properties"]
        }),
        css(),
        // Resolve bare module specifiers to relative paths
        resolve(),
        // Minify HTML template literals
        minifyHTML(),
        // Minify JS
        terser(
        // {
        // ecma: 2020,
        // module: true,
        // warnings: true,
        // }
        ),
        // Print bundle summary
        summary(),
        // Optional: copy any static assets to build directory
        copy({
        // patterns: ['./src/styles/**/*'],
        }),
        // Support Typescript
        typescript({
            typescript: require('typescript'),
        }),
    ],
    //  preserveEntrySignatures: 'strict',
};
export default [
    Object.assign({}, umd, common),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sbHVwLmNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3JvbGx1cC5jb25maWcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEseUJBQXlCO0FBQ3pCLG9XQUFvVztBQUVwVyxPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDN0MsT0FBTyxPQUFPLE1BQU0sNkJBQTZCLENBQUM7QUFDbEQsT0FBTyxVQUFVLE1BQU0sb0NBQW9DLENBQUM7QUFDNUQsT0FBTyxPQUFPLE1BQU0sdUJBQXVCLENBQUM7QUFDNUMsT0FBTyxVQUFVLE1BQU0sMkJBQTJCLENBQUM7QUFDbkQsT0FBTyxHQUFHLE1BQU0sZ0JBQWdCLENBQUM7QUFDakMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzVDLE9BQU8sR0FBRyxNQUFNLDBCQUEwQixDQUFDO0FBQzNDLE9BQU8sWUFBWSxNQUFNLDZCQUE2QixDQUFDO0FBQ3ZELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUM3QyxPQUFPLFFBQVEsTUFBTSx5QkFBeUIsQ0FBQztBQUUvQzs7R0FFRztBQUVILElBQU0sR0FBRyxHQUFHO0lBQ1YsS0FBSyxFQUFFLFlBQVk7SUFDbkIsTUFBTSxFQUFFLENBQUk7WUFDVixJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7WUFDZCxNQUFNLEVBQUUsS0FBSztZQUNiLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLElBQUksRUFBRSxZQUFZO1NBQ25CLENBQUU7Q0FDSixDQUFBO0FBRUQsSUFBTSxNQUFNLEdBQUc7SUFDZCxPQUFPLEVBQUU7UUFDTixRQUFRLEVBQUU7UUFDVixZQUFZLEVBQUU7UUFDZCxLQUFLLENBQUM7WUFDRixZQUFZLEVBQUUsU0FBUztZQUN2QixPQUFPLEVBQUUsQ0FBQyx5Q0FBeUMsQ0FBQztTQUN2RCxDQUFDO1FBQ0YsR0FBRyxFQUFFO1FBQ0wsbURBQW1EO1FBQ25ELE9BQU8sRUFBRTtRQUNULGdDQUFnQztRQUNoQyxVQUFVLEVBQUU7UUFDWixZQUFZO1FBQ1osTUFBTTtRQUNGLElBQUk7UUFDSixjQUFjO1FBQ2QsZ0JBQWdCO1FBQ2hCLGtCQUFrQjtRQUNsQixJQUFJO1NBQ1A7UUFDRCx1QkFBdUI7UUFDdkIsT0FBTyxFQUFFO1FBQ1Qsc0RBQXNEO1FBQ3RELElBQUksQ0FBQztRQUNILG1DQUFtQztTQUNwQyxDQUFDO1FBQ0YscUJBQXFCO1FBQ3ZCLFVBQVUsQ0FBQztZQUNWLFVBQVUsRUFBRSxPQUFPLENBQUMsWUFBWSxDQUFDO1NBQ2pDLENBQUM7S0FDRjtJQUNGLHNDQUFzQztDQUNyQyxDQUFBO0FBRUQsZUFBZTtJQUNiLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUM7Q0FDL0IsQ0FBQSJ9