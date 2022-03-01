import ObjectID from "bson-objectid";
export declare const safeObjectID: (str: any) => string | ObjectID;
export declare const get: (_: any, Model: any, query: any[], value: any) => Promise<any>;
export declare const del: (_: any, Model: any, o: any) => Promise<void>;
export declare const post: (_: any, Model: any, args: any) => Promise<void>;
