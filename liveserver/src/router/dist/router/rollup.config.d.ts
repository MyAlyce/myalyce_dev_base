declare var _default: ((import("rollup").RollupOptions & {
    external: string[];
    plugins: (void | import("rollup").Plugin)[];
}) | ({
    input: string;
    output: {
        file: any;
        format: string;
    }[];
} & {
    external: string[];
    plugins: (void | import("rollup").Plugin)[];
}))[];
export default _default;
