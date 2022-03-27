import { Router } from "../../core/core";
import { Service } from "../../core/Service";
declare type CollectionsType = {
    users?: CollectionType;
    [x: string]: CollectionType;
};
declare type CollectionType = any | {
    instance?: any;
    match?: string[];
    filters?: {
        post: (user: any, args: any, collections: any) => boolean;
        get: (responseArr: any, collections: any) => boolean;
        delete: (user: any, args: any, collections: any) => boolean;
    };
};
declare class DatabaseService extends Service {
    name: string;
    controller: Router;
    collections: CollectionsType;
    constructor(Router: any, dbOptions?: {
        collections?: CollectionsType;
    }, debug?: boolean);
}
export default DatabaseService;
