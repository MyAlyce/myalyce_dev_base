export declare const safeParse: (input: string | {
    [x: string]: any;
}) => {
    [x: string]: any;
};
export declare const safeStringify: (input: any, stringify?: boolean) => any;
export declare function getParamNames(func: Function): RegExpMatchArray;
export declare function parseFunctionFromText(method?: string): any;
