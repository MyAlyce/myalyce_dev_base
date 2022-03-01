import { UserObject, ArbitraryObject } from '../../common/general.types';
import { Router } from "../../router/Router";
import { Service } from "../../router/Service";
import { ProfileStruct } from "brainsatplay-data/dist/src/types";
export declare const safeObjectID: (str: any) => any;
declare type dbType = any;
declare type CollectionsType = {
    users?: CollectionType;
    [x: string]: CollectionType;
};
declare type CollectionType = any | {
    instance?: any;
    reference: ArbitraryObject;
};
export declare class StructService extends Service {
    name: string;
    controller: Router;
    db: any;
    collections: CollectionsType;
    debug: boolean;
    mode: 'local' | 'mongodb' | string;
    constructor(Router: any, dbOptions?: {
        mode?: 'local' | 'mongodb' | string;
        db?: dbType;
        collections?: CollectionsType;
    }, debug?: boolean);
    notificationStruct(parentStruct?: any): {
        structType: string;
        timestamp: number;
        id: string;
        note: string;
        ownerId: string;
        parentUserId: string;
        parent: {
            structType: any;
            _id: any;
        };
    };
    checkToNotify(user: UserObject, structs?: any[], mode?: string): Promise<boolean>;
    setMongoData(user: UserObject, structs?: any[]): Promise<boolean | any[]>;
    setMongoUser(user: UserObject, struct: ProfileStruct): Promise<false | UserObject>;
    setGroup(user: UserObject, struct?: any, mode?: string): Promise<any>;
    getMongoUser(user: UserObject, info?: string, bypassAuth?: boolean): Promise<Partial<UserObject>>;
    getMongoUsersByIds(user?: {}, userIds?: any[]): Promise<any[]>;
    getMongoUsersByRoles(user?: {}, userRoles?: any[]): Promise<any[]>;
    getMongoDataByIds(user: UserObject, structIds: [], ownerId: string | undefined, collection: string | undefined): Promise<any[]>;
    getMongoData(user: UserObject, collection: string | undefined, ownerId: string | undefined, dict?: any | undefined, limit?: number, skip?: number): Promise<any[]>;
    getAllUserMongoData(user: UserObject, ownerId: any, excluded?: any[]): Promise<any[]>;
    getMongoDataByRefs(user: UserObject, structRefs?: any[]): Promise<any[]>;
    getMongoAuthorizations(user: UserObject, ownerId?: string, authId?: string): Promise<any[]>;
    getMongoGroups(user: UserObject, userId?: string, groupId?: string): Promise<any[]>;
    deleteMongoData(user: UserObject, structRefs?: any[]): Promise<boolean>;
    deleteMongoUser(user: UserObject, userId: any): Promise<boolean>;
    deleteMongoGroup(user: UserObject, groupId: any): Promise<boolean>;
    deleteMongoAuthorization(user: UserObject, authId: any): Promise<boolean>;
    setAuthorization(user: UserObject, authStruct: any, mode?: string): Promise<any>;
    checkAuthorization(user: string | ProfileStruct | {
        _id: string;
    }, struct: any, request?: string, //'WRITE'
    mode?: string): Promise<boolean>;
    wipeDB: () => Promise<boolean>;
    overwriteLocalData(structs: any): void;
    setLocalData(structs: any): void;
    getLocalData(collection: any, query?: any): any;
    deleteLocalData(struct: any): boolean;
}
export default StructService;
