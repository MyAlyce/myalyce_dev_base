import { DataTablet } from 'brainsatplay-data';
import { UserObject, RouterOptions, ArbitraryObject } from '../../common/general.types';
import { Router } from '../../core/core';
import { ProfileStruct } from 'brainsatplay-data/dist/src/types';
declare class StructRouter extends Router {
    currentUser: Partial<UserObject>;
    tablet: DataTablet;
    collections: Map<string, any>;
    id: string;
    constructor(userInfo?: Partial<UserObject>, options?: RouterOptions);
    setupUser(userinfo: Partial<UserObject>, callback?: (currentUser: any) => void): Promise<Partial<UserObject>>;
    baseServerCallback: (data: any) => void;
    onResult(data: any): void;
    randomId(tag?: string): string;
    /**
        let struct = {
            _id: randomId(structType+'defaultId'),   //random id associated for unique identification, used for lookup and indexing
            structType: structType,     //this is how you will look it up by type in the server
            ownerId: parentUser?._id,     //owner user
            timestamp: Date.now(),      //date of creation
            parent: {structType:parentStruct?.structType,_id:parentStruct?._id}, //parent struct it's associated with (e.g. if it needs to spawn with it)
        }
     */
    addStruct(structType?: string, props?: any, //add any props you want to set, adding users[] with ids will tell who to notify if this struct is updated
    parentUser?: ArbitraryObject, parentStruct?: ArbitraryObject, updateServer?: boolean): Promise<import("brainsatplay-data/dist/src/types").Struct>;
    ping(callback?: (res: any) => void): Promise<any>;
    sendMessage(userId?: string, message?: any, data?: any, callback?: (res: any) => void): Promise<any>;
    getUser(info?: string | number, callback?: (data: any) => void): Promise<any>;
    getUsers(ids?: string | number[], callback?: (data: any) => void): Promise<any>;
    getUsersByRoles(userRoles?: string[], callback?: (data: any) => void): Promise<any>;
    getAllUserData(ownerId: string | number, excluded?: any[], callback?: (data: any) => void): Promise<any>;
    getData(collection: string, ownerId?: string | number | undefined, searchDict?: any, limit?: number, skip?: number, callback?: (data: any) => void): Promise<any>;
    getDataByIds(structIds?: any[], ownerId?: string | number | undefined, collection?: string | undefined, callback?: (data: any) => void): Promise<any>;
    getStructParentData(struct: any, callback?: (data: any) => void): Promise<any>;
    setUser(userStruct?: {}, callback?: (data: any) => void): Promise<any>;
    checkUserToken(usertoken: any, user?: Partial<UserObject>, callback?: (data: any) => void): Promise<any>;
    updateServerData(structs?: any[], callback?: (data: any) => void): Promise<any>;
    deleteData(structs?: any[], callback?: (data: any) => void): Promise<any>;
    deleteUser(userId: any, callback?: (data: any) => void): Promise<any>;
    setGroup(groupStruct?: {}, callback?: (data: any) => void): Promise<any>;
    getGroups(userId?: string, groupId?: string, callback?: (data: any) => void): Promise<any>;
    deleteGroup(groupId: any, callback?: (data: any) => void): Promise<any>;
    setAuthorization(authorizationStruct?: {}, callback?: (data: any) => void): Promise<any>;
    getAuthorizations(userId?: string, authorizationId?: string, callback?: (data: any) => void): Promise<any>;
    deleteAuthorization(authorizationId: any, callback?: (data: any) => void): Promise<any>;
    checkForNotifications(userId?: string): Promise<any>;
    resolveNotifications: (notifications?: any[], pull?: boolean, user?: Partial<UserObject>) => Promise<any>;
    setAuthorizationsByGroup(user?: Partial<UserObject>): Promise<void>;
    deleteRoom(roomStruct: any): Promise<any>;
    deleteComment(commentStruct: any): Promise<any>;
    getUserDataByAuthorization(authorizationStruct: any, collection: any, searchDict: any, limit?: number, skip?: number, callback?: (data: any) => void): Promise<unknown>;
    getUserDataByAuthorizationGroup(groupId: string, collection: any, searchDict: any, limit?: number, skip?: number, callback?: (data: any) => void): Promise<any[]>;
    overwriteLocalData(structs: any): void;
    setLocalData(structs: any): void;
    getLocalData(collection: any, query?: any): any;
    getLocalUserPeerIds: (user?: Partial<UserObject>) => any[];
    getLocalReplies(struct: any): any;
    hasLocalAuthorization(otherUserId: any, ownerId?: string): any;
    deleteLocalData(structs: any): boolean;
    deleteStruct(struct: any): boolean;
    stripStruct(struct?: {}): {};
    createStruct(structType: any, props: any, parentUser?: Partial<UserObject>, parentStruct?: any): any;
    userStruct(props?: Partial<ProfileStruct>, currentUser?: boolean): ProfileStruct;
    authorizeUser: (parentUser: Partial<ProfileStruct>, authorizerUserId?: string, authorizerUserName?: string, authorizedUserId?: string, authorizedUserName?: string, authorizations?: any[], structs?: any[], excluded?: any[], groups?: any[], expires?: boolean) => Promise<any>;
    addGroup: (parentUser: Partial<ProfileStruct>, name?: string, details?: string, admins?: any[], peers?: any[], clients?: any[], updateServer?: boolean) => Promise<any>;
    dataObject(data?: any, type?: string, timestamp?: string | number): {
        type: string;
        data: any;
        timestamp: string | number;
    };
    addData: (parentUser: Partial<ProfileStruct>, author?: string, title?: string, type?: string, data?: any[], expires?: boolean, updateServer?: boolean) => Promise<any>;
    addEvent: (parentUser: Partial<ProfileStruct>, author?: string, event?: string, notes?: string, startTime?: number, endTime?: number, grade?: number, attachments?: any[], users?: any[], updateServer?: boolean) => Promise<any>;
    addDiscussion: (parentUser: Partial<ProfileStruct>, authorId?: string, topic?: string, category?: string, message?: string, attachments?: any[], users?: any[], updateServer?: boolean) => Promise<any>;
    addChatroom: (parentUser: Partial<ProfileStruct>, authorId?: string, message?: string, attachments?: any[], users?: any[], updateServer?: boolean) => Promise<any>;
    addComment: (parentUser: Partial<ProfileStruct>, roomStruct?: {
        _id: string;
        users: any[];
        comments: any[];
    }, replyTo?: {
        _id: string;
        replies: any[];
    }, authorId?: string, message?: string, attachments?: any[], updateServer?: boolean) => Promise<any>;
}
export default StructRouter;
