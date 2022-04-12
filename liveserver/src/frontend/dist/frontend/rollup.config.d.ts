declare var _default: ((import("rollup").RollupOptions & {
    plugins: (void | import("rollup").Plugin)[];
}) | ({
    input: string;
    output: {
        file: any;
        format: string;
    }[];
} & {
    plugins: (void | import("rollup").Plugin)[];
}))[];
export default _default;
