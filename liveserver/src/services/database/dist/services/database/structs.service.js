import { __awaiter } from "tslib";
//Local and MongoDB database functions
//Users, user data, notifications, access controls
// Joshua Brewster, Garrett Flynn, AGPL v3.0
import ObjectID from "bson-objectid";
import { Service } from "../../router/Service";
import { randomId } from '../../common/id.utils';
// import * as mongoExtension from './mongoose.extension'
export const safeObjectID = (str) => {
    return (typeof str === 'string' && str.length === 24) ? ObjectID(str) : str;
};
const defaultCollections = [
    'user',
    'group',
    'authorization',
    'discussion',
    'chatroom',
    'comment',
    'dataInstance',
    'event',
    'notification',
    'schedule',
    'date'
];
export class StructService extends Service {
    constructor(Router, dbOptions = {}, debug = false) {
        super(Router);
        this.name = 'structs';
        this.collections = {};
        this.debug = false;
        this.wipeDB = () => __awaiter(this, void 0, void 0, function* () {
            //await this.collections.authorizations.instance.deleteMany({});
            //await this.collections.groups.instance.deleteMany({});
            yield Promise.all(Object.values(this.collections).map(c => c.instance.deleteMany({})));
            return true;
        });
        this.db = dbOptions === null || dbOptions === void 0 ? void 0 : dbOptions.db;
        this.debug = debug;
        this.mode = (this.db) ? ((dbOptions.mode) ? dbOptions.mode : 'local') : 'local';
        // JUST USE DB TO FILL IN COLLECTIONS
        // Get default collections
        if (!dbOptions.collections)
            dbOptions.collections = {};
        defaultCollections.forEach(k => {
            if (!dbOptions.collections[k]) {
                dbOptions.collections[k] = (this.db) ? { instance: this.db.collection(k) } : {};
                dbOptions.collections[k].reference = {};
            }
        });
        this.collections = dbOptions.collections;
        // Overwrite Other Routes
        this.routes = [
            {
                route: 'getUser',
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (this.debug)
                        console.log('getUser origin', origin, args, 'users:', self.USERS);
                    if (!u)
                        return false;
                    let data;
                    if (this.mode === 'mongo') {
                        data = yield this.getMongoUser(u, args[0]);
                    }
                    else {
                        let struct = this.getLocalData('user', { _id: args[0] });
                        if (!struct)
                            data = { user: {} };
                        else {
                            let passed = yield this.checkAuthorization(u, struct);
                            if (passed) {
                                let groups = this.getLocalData('group', { ownerId: args[0] });
                                let auths = this.getLocalData('authorization', { ownerId: args[0] });
                                data = { user: struct, groups: groups, authorizations: auths };
                            }
                            else
                                data = { user: {} };
                        }
                    }
                    if (this.debug)
                        console.log('getUser:', u, args[0], data);
                    return data;
                })
            },
            {
                route: 'setUser',
                aliases: ['addUser'],
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data;
                    if (this.mode === 'mongo') {
                        data = yield this.setMongoUser(u, args[0]);
                    }
                    else {
                        let passed = yield this.checkAuthorization(u, args[0], 'WRITE');
                        if (passed)
                            this.setLocalData(args[0]);
                        return true;
                    }
                    if (this.debug)
                        console.log('setUser', u, args[0], data);
                    return data;
                })
            },
            {
                route: 'getUsersByIds',
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data;
                    if (this.mode === 'mongo') {
                        data = yield this.getMongoUsersByIds(u, args[0]);
                    }
                    else {
                        data = [];
                        if (Array.isArray(args[0])) {
                            let struct = this.getLocalData('user', { _id: args[0] });
                            if (struct)
                                data.push(struct);
                        }
                    }
                    if (this.debug)
                        console.log('getUserByIds:', u, args[0], data);
                    return data;
                })
            },
            {
                route: 'getUsersByRoles',
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data;
                    if (this.mode.includes('mongo')) {
                        data = yield this.getMongoUsersByRoles(u, args[0]);
                    }
                    else {
                        let profiles = this.getLocalData('user');
                        data = [];
                        profiles.forEach((struct) => {
                            var _a;
                            if ((_a = struct.userRoles) === null || _a === void 0 ? void 0 : _a.includes(args[0])) {
                                data.push(struct);
                            }
                        });
                    }
                    if (this.debug)
                        console.log('getUserByRoles', u, args[0], data);
                    return data;
                })
            },
            {
                route: 'deleteUser',
                aliases: ['removeUser'],
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data;
                    if (this.mode === 'mongo') {
                        data = yield this.deleteMongoUser(u, args[0]);
                    }
                    else {
                        data = false;
                        let struct = this.getLocalData(args[0]);
                        if (struct) {
                            let passed = this.checkAuthorization(u, struct, 'WRITE');
                            if (passed)
                                data = this.deleteLocalData(struct);
                        }
                    }
                    if (this.debug)
                        console.log('deleteUser:', u, args[0], data);
                    return data;
                })
            },
            {
                route: 'setData',
                aliases: ['setMongoData'],
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data;
                    if (this.mode.includes('mongo')) {
                        data = yield this.setMongoData(u, args); //input array of structs
                    }
                    else {
                        let non_notes = [];
                        data = [];
                        yield Promise.all(args.map((structId) => __awaiter(this, void 0, void 0, function* () {
                            let struct = this.getLocalData(structId);
                            let passed = yield this.checkAuthorization(u, struct, 'WRITE');
                            if (passed) {
                                this.setLocalData(struct);
                                data.push(struct);
                                if (struct.structType !== 'notification')
                                    non_notes.push(struct);
                            }
                        })));
                        if (non_notes.length > 0)
                            this.checkToNotify(u, non_notes, this.mode);
                        if (this.debug)
                            console.log('setData:', u, args, data);
                        return true;
                    }
                    if (this.debug)
                        console.log('setData:', u, args, data);
                    return data;
                })
            },
            {
                route: 'getData',
                aliases: ['getMongoData', 'getUserData'],
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data;
                    if (this.mode.includes('mongo')) {
                        data = yield this.getMongoData(u, args[0], args[1], args[2], args[4], args[5]);
                    }
                    else {
                        data = [];
                        let structs;
                        if (args[0])
                            structs = this.getLocalData(args[0]);
                        if (structs && args[1])
                            structs = structs.filter((o) => { if (o.ownerId === args[1])
                                return true; });
                        //bandaid
                        if (structs)
                            yield Promise.all(structs.map((s) => __awaiter(this, void 0, void 0, function* () {
                                let struct = this.getLocalData(s._id);
                                let passed = yield this.checkAuthorization(u, struct);
                                if (passed)
                                    data.push(struct);
                            })));
                    }
                    if (this.debug)
                        console.log('getData:', u, args, data);
                    return data;
                })
            },
            {
                route: 'getDataByIds',
                aliases: ['getMongoDataByIds', 'getUserDataByIds'],
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data;
                    if (this.mode.includes('mongo')) {
                        data = yield this.getMongoDataByIds(u, args[0], args[1], args[2]);
                    }
                    else {
                        data = [];
                        let structs;
                        if (args[2])
                            structs = this.getLocalData(args[2]);
                        if (structs && args[1])
                            structs = structs.filter((o) => { if (o.ownerId === args[1])
                                return true; });
                        if (structs)
                            yield Promise.all(structs.map((s) => __awaiter(this, void 0, void 0, function* () {
                                let struct = this.getLocalData(s._id);
                                let passed = yield this.checkAuthorization(u, struct);
                                if (passed)
                                    data.push(struct);
                            })));
                    }
                    if (this.debug)
                        console.log('getDataByIds:', u, args, data);
                    return data;
                })
            },
            {
                route: 'getAllData',
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data;
                    if (this.mode.includes('mongo')) {
                        data = yield this.getAllUserMongoData(u, args[0], args[1]);
                    }
                    else {
                        let result = this.getLocalData(undefined, { ownerId: args[0] });
                        data = [];
                        yield Promise.all(result.map((struct) => __awaiter(this, void 0, void 0, function* () {
                            if (args[1]) {
                                if (args[1].indexOf(struct.structType) < 0) {
                                    let passed = yield this.checkAuthorization(u, struct);
                                    if (passed)
                                        data.push(struct);
                                }
                            }
                            else {
                                let passed = yield this.checkAuthorization(u, struct);
                                if (passed)
                                    data.push(struct);
                            }
                        })));
                    }
                    if (this.debug)
                        console.log('getAllData:', u, args, data);
                    return data;
                })
            },
            {
                route: 'deleteData',
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data;
                    if (this.mode.includes('mongo')) {
                        data = yield this.deleteMongoData(u, args);
                    }
                    else {
                        data = false;
                        yield Promise.all(args.map((structId) => __awaiter(this, void 0, void 0, function* () {
                            let struct = this.getLocalData(structId);
                            let passed = yield this.checkAuthorization(u, struct, 'WRITE');
                            if (passed)
                                this.deleteLocalData(struct);
                            data = true;
                        })));
                    }
                    if (this.debug)
                        console.log('deleteData:', u, args, data);
                    return data;
                })
            },
            {
                route: 'getGroup',
                aliases: ['getGroups'],
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data;
                    if (this.mode.includes('mongo')) {
                        data = yield this.getMongoGroups(u, args[0], args[1]);
                    }
                    else {
                        if (typeof args[1] === 'string') {
                            data = this.getLocalData('group', { _id: args[1] });
                        }
                        else {
                            data = [];
                            let result = this.getLocalData('group');
                            if (args[0]) {
                                result.forEach((struct) => {
                                    if (struct.users.includes(args[0]))
                                        data.push(struct);
                                });
                            }
                            else {
                                result.forEach((struct) => {
                                    if (struct.users.includes(u._id))
                                        data.push(struct);
                                });
                            }
                        }
                    }
                    if (this.debug)
                        console.log('getGroups:', u, args, data);
                    return data;
                })
            },
            {
                route: 'setGroup',
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data = yield this.setGroup(u, args[0], this.mode);
                    if (this.debug)
                        console.log('setGroup:', u, args, data);
                })
            },
            {
                route: 'deleteGroup',
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data;
                    if (this.mode.includes('mongo')) {
                        data = yield this.deleteMongoGroup(u, args[0]);
                    }
                    else {
                        let struct = this.getLocalData('group', args[0]);
                        let passed = false;
                        if (struct)
                            passed = yield this.checkAuthorization(u, struct, 'WRITE');
                        if (passed) {
                            data = true;
                        }
                    }
                    if (this.debug)
                        console.log('deleteGroup:', u, args, data);
                    return data;
                })
            },
            {
                route: 'setAuth',
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data = yield this.setAuthorization(u, args[0], this.mode);
                    if (this.debug)
                        console.log('deleteGroup:', u, args, data);
                    return data;
                })
            },
            {
                route: 'getAuths',
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data;
                    if (this.mode.includes('mongo')) {
                        data = yield this.getMongoAuthorizations(u, args[0], args[1]);
                    }
                    else {
                        if (args[1]) {
                            let result = this.getLocalData('authorization', { _id: args[1] });
                            if (result)
                                data = [result];
                        }
                        else {
                            data = this.getLocalData('authorization', { ownerId: args[0] });
                        }
                    }
                    if (this.debug)
                        console.log('deleteGroup:', u, args, data);
                    return data;
                })
            },
            {
                route: 'deleteAuth',
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    const u = self.USERS[origin];
                    if (!u)
                        return false;
                    let data;
                    if (this.mode.includes('mongo')) {
                        data = yield this.deleteMongoAuthorization(u, args[0]);
                    }
                    else {
                        data = true;
                        let struct = this.getLocalData('authorization', { _id: args[0] });
                        if (struct) {
                            let passed = this.checkAuthorization(u, struct, 'WRITE');
                            if (passed)
                                data = this.deleteLocalData(struct);
                        }
                    }
                    if (this.debug)
                        console.log('deleteGroup:', u, args, data);
                    return data;
                })
            }
        ];
    }
    notificationStruct(parentStruct = {}) {
        let structType = 'notification';
        let struct = {
            structType: structType,
            timestamp: Date.now(),
            id: randomId(structType),
            note: '',
            ownerId: '',
            parentUserId: '',
            parent: { structType: parentStruct === null || parentStruct === void 0 ? void 0 : parentStruct.structType, _id: parentStruct === null || parentStruct === void 0 ? void 0 : parentStruct._id }, //where it belongs
        };
        return struct;
    }
    //when passing structs to be set, check them for if notifications need to be created
    //TODO: need to make this more flexible in the cases you DON'T want an update
    checkToNotify(user, structs = [], mode = this.mode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof user === 'string') {
                for (let key in this.router.USERS) {
                    const obj = this.router.USERS[key];
                    if (obj._id === user)
                        user = obj;
                }
            }
            if (typeof user === 'string' || user == null)
                return false;
            let usersToNotify = {};
            //console.log('Check to notify ',user,structs);
            let newNotifications = [];
            structs.forEach((struct) => __awaiter(this, void 0, void 0, function* () {
                if ((user === null || user === void 0 ? void 0 : user._id) !== struct.ownerId) { //a struct you own being updated by another user
                    let newNotification = this.notificationStruct(struct);
                    newNotification.id = 'notification_' + struct._id; //overwrites notifications for the same parent
                    newNotification.ownerId = struct.ownerId;
                    newNotification.note = struct.structType; //redundant now
                    newNotification.parentUserId = struct.ownerId;
                    newNotifications.push(newNotification);
                    usersToNotify[struct.ownerId] = struct.ownerId;
                }
                if (struct.users) { //explicit user ids assigned to this struct
                    struct.users.forEach((usr) => {
                        if (usr !== user._id) {
                            let newNotification = this.notificationStruct(struct);
                            newNotification.id = 'notification_' + struct._id; //overwrites notifications for the same parent
                            newNotification.ownerId = usr;
                            newNotification.note = struct.structType;
                            newNotification.parentUserId = struct.ownerId;
                            newNotifications.push(newNotification);
                            usersToNotify[usr] = usr;
                        }
                    });
                }
                else { //users not explicitly assigned so check if there are authorized users with access
                    let auths = [];
                    if (mode === 'mongo') {
                        let s = this.collections.authorizations.instance.find({ $or: [{ authorizedId: user._id }, { authorizerId: user._id }] });
                        if ((yield s.count()) > 0) {
                            yield s.forEach(d => auths.push(d));
                        }
                    }
                    else {
                        auths = this.getLocalData('authorization', { authorizedId: user._id });
                        auths.push(...this.getLocalData('authorization', { authorizerId: user._id }));
                    }
                    if (auths.length > 0) {
                        auths.forEach((auth) => {
                            if (struct.authorizerId === struct.ownerId && !usersToNotify[struct.authorizedId]) {
                                if (auth.status === 'OKAY' && auth.authorizations.indexOf('peer') > -1) {
                                    let newNotification = this.notificationStruct(struct);
                                    newNotification.ownerId = auth.authorizedId;
                                    newNotification.id = 'notification_' + struct._id; //overwrites notifications for the same parent
                                    newNotification.note = struct.structType;
                                    newNotification.parentUserId = struct.ownerId;
                                    newNotifications.push(newNotification);
                                    usersToNotify[newNotification.ownerId] = newNotification.ownerId;
                                }
                            }
                        });
                    }
                }
            }));
            if (newNotifications.length > 0) {
                if (mode === 'mongo') {
                    yield this.setMongoData(user, newNotifications); //set the DB, let the user get them 
                }
                else {
                    this.setLocalData(newNotifications);
                }
                // console.log(usersToNotify);
                for (const uid in usersToNotify) {
                    this.router.sendMsg(uid, 'notifications', true);
                }
                return true;
            }
            else
                return false;
        });
    }
    setMongoData(user, structs = []) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log(structs,user);
            let firstwrite = false;
            //console.log(structs);
            if (structs.length > 0) {
                let passed = true;
                let checkedAuth = '';
                yield Promise.all(structs.map((struct) => __awaiter(this, void 0, void 0, function* () {
                    if (((user === null || user === void 0 ? void 0 : user._id) !== struct.ownerId || (user._id === struct.ownerId && user.userRoles.includes('admin_control'))) && checkedAuth !== struct.ownerId) {
                        passed = yield this.checkAuthorization(user, struct, 'WRITE');
                        checkedAuth = struct.ownerId;
                    }
                    if (passed) {
                        let copy = JSON.parse(JSON.stringify(struct));
                        if (copy._id)
                            delete copy._id;
                        //if(struct.structType === 'notification') console.log(notificaiton);
                        if (struct.id) {
                            if (struct.id.includes('defaultId')) {
                                yield this.db.collection(struct.structType).insertOne(copy);
                                firstwrite = true;
                            }
                            else
                                yield this.db.collection(struct.structType).updateOne({ id: struct.id }, { $set: copy }, { upsert: true }); //prevents redundancy in some cases (e.g. server side notifications)
                        }
                        else if (struct._id) {
                            if (struct._id.includes('defaultId')) {
                                yield this.db.collection(struct.structType).insertOne(copy);
                                firstwrite = true;
                            }
                            else
                                yield this.db.collection(struct.structType).updateOne({ _id: safeObjectID(struct._id) }, { $set: copy }, { upsert: false });
                        }
                    }
                })));
                if (firstwrite === true) {
                    //console.log('firstwrite');
                    let toReturn = []; //pull the server copies with the updated Ids
                    yield Promise.all(structs.map((struct, j) => __awaiter(this, void 0, void 0, function* () {
                        let copy = JSON.parse(JSON.stringify(struct));
                        if (copy._id)
                            delete copy._id;
                        if (struct.structType !== 'comment') {
                            let pulled;
                            if (struct.structType !== 'notification')
                                pulled = yield this.db.collection(copy.structType).findOne(copy);
                            if (pulled) {
                                pulled._id = pulled._id.toString();
                                toReturn.push(pulled);
                            }
                        }
                        else if (struct.structType === 'comment') { //comments are always pushed with their updated counterparts. TODO handle dataInstances
                            let comment = struct;
                            let copy2 = JSON.parse(JSON.stringify(comment));
                            if (copy2._id)
                                delete copy2._id;
                            let pulledComment = yield this.db.collection('comment').findOne(copy2);
                            let replyToId = comment.replyTo;
                            let replyTo = structs.find((s) => {
                                if (s._id === replyToId)
                                    return true;
                            });
                            if (replyTo) {
                                let copy3 = JSON.parse(JSON.stringify(replyTo));
                                if (copy3._id)
                                    delete copy3._id;
                                let pulledReply;
                                yield Promise.all(['discussion', 'chatroom', 'comment'].map((name) => __awaiter(this, void 0, void 0, function* () {
                                    let found = yield this.db.collection(name).findOne({ _id: safeObjectID(replyToId) });
                                    if (found)
                                        pulledReply = found;
                                })));
                                //console.log(pulledReply)
                                if (pulledReply) {
                                    let roomId = comment.parent._id;
                                    let room, pulledRoom;
                                    if (roomId !== replyToId) {
                                        room = structs.find((s) => {
                                            if (s._id === roomId)
                                                return true;
                                        });
                                        if (room) {
                                            delete room._id;
                                            yield Promise.all(['discussion', 'chatroom'].map((name) => __awaiter(this, void 0, void 0, function* () {
                                                let found = yield this.db.collection(name).findOne(room);
                                                if (found)
                                                    pulledRoom = found;
                                            })));
                                        }
                                    }
                                    else
                                        pulledRoom = pulledReply;
                                    if (pulledReply) {
                                        let i = pulledReply.replies.indexOf(comment._id);
                                        if (i > -1) {
                                            pulledReply.replies[i] = pulledComment._id.toString();
                                            pulledComment.replyTo = pulledReply._id.toString();
                                        }
                                    }
                                    if (pulledRoom) {
                                        let i = pulledRoom.comments.indexOf(comment._id);
                                        if (i > -1) {
                                            pulledRoom.comments[i] = pulledComment._id.toString();
                                            pulledComment.parent._id = pulledRoom._id.toString();
                                        }
                                    }
                                    let toUpdate = [pulledComment, pulledReply];
                                    if (pulledRoom._id.toString() !== pulledReply._id.toString())
                                        toUpdate.push(pulledRoom);
                                    yield Promise.all(toUpdate.map((s) => __awaiter(this, void 0, void 0, function* () {
                                        let copy = JSON.parse(JSON.stringify(s));
                                        delete copy._id;
                                        yield this.db.collection(s.structType).updateOne({ _id: safeObjectID(s._id) }, { $set: copy }, { upsert: false });
                                    })));
                                    // console.log('pulled comment',pulledComment)
                                    // console.log('pulled replyTo',pulledReply)
                                    // console.log('pulled room',pulledRoom);
                                    [...toReturn].reverse().forEach((s, j) => {
                                        if (toUpdate.find((o) => {
                                            if (s._id.toString() === o._id.toString())
                                                return true;
                                        })) {
                                            toReturn.splice(toReturn.length - j - 1, 1); //pop off redundant
                                        }
                                    });
                                    toReturn.push(...toUpdate);
                                }
                            }
                            else if (pulledComment) {
                                toReturn.push(pulledComment);
                            }
                        }
                    })));
                    this.checkToNotify(user, toReturn);
                    return toReturn;
                }
                else {
                    let non_notes = [];
                    structs.forEach((s) => {
                        if (s.structType !== 'notification')
                            non_notes.push(s);
                    });
                    this.checkToNotify(user, non_notes);
                    return true;
                }
            }
            else
                return false;
        });
    }
    setMongoUser(user, struct) {
        return __awaiter(this, void 0, void 0, function* () {
            if (struct._id) { //this has a second id that matches the token id
                if (user._id !== struct.ownerId || (user._id === struct.ownerId && user.userRoles.includes('admin_control'))) {
                    let passed = yield this.checkAuthorization(user, struct, 'WRITE');
                    if (!passed)
                        return false;
                }
                let copy = JSON.parse(JSON.stringify(struct));
                if (copy._id)
                    delete copy._id;
                if (this.router.DEBUG)
                    console.log('RETURNS PROFILE', struct);
                // Only Set _id if Appropriate
                const _id = safeObjectID(struct._id);
                const toFind = (_id !== struct._id) ? { _id } : { id: struct.id };
                yield this.collections.users.instance.updateOne(toFind, { $set: copy }, { upsert: true });
                user = yield this.collections.users.instance.findOne(toFind);
                this.checkToNotify(user, [struct]);
                return user;
            }
            else
                return false;
        });
    }
    setGroup(user, struct = {}, mode = this.mode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (struct._id) {
                let exists = undefined;
                if (mode === 'mongo') {
                    exists = yield this.collections.groups.instance.findOne({ name: struct.name });
                }
                else {
                    exists = this.getLocalData('group', { _id: struct._id });
                }
                if (exists && (exists.ownerId !== struct.ownerId || struct.admins.indexOf(user._id) < 0))
                    return false; //BOUNCE
                if (user._id !== struct.ownerId) {
                    let passed = yield this.checkAuthorization(user, struct, 'WRITE');
                    if (!passed)
                        return false;
                }
                let allusers = [];
                struct.users.forEach((u) => {
                    allusers.push({ email: u }, { id: u }, { username: u });
                });
                //replace everything with ids
                let users = [];
                let ids = [];
                if (mode === 'mongo') {
                    let cursor = this.collections.users.instance.find({ $or: allusers }); //encryption references
                    if ((yield cursor.count()) > 0) {
                        yield cursor.forEach((user) => {
                            users.push(user);
                            ids.push(user._id);
                        });
                    }
                }
                else {
                    allusers.forEach((search) => {
                        let result = this.getLocalData('user', search);
                        if (result.length > 0) {
                            users.push(result[0]);
                            ids.push(result[0]._id);
                        }
                    });
                }
                struct.users = ids;
                let admins = [];
                let peers = [];
                let clients = [];
                users.forEach((u) => {
                    struct.admins.find((useridentifier, i) => {
                        if (useridentifier === u._id || useridentifier === u.email || useridentifier === u.username || u._id === struct.ownerId) {
                            if (admins.indexOf(u._id < 0))
                                admins.push(u._id);
                            return true;
                        }
                    });
                    struct.peers.find((useridentifier, i) => {
                        if (useridentifier === u._id || useridentifier === u.email || useridentifier === u.username) {
                            if (peers.indexOf(u._id < 0))
                                peers.push(u._id);
                            return true;
                        }
                    });
                    struct.clients.find((useridentifier, i) => {
                        if (useridentifier === u._id || useridentifier === u.email || useridentifier === u.username) {
                            if (clients.indexOf(u._id < 0))
                                clients.push(u._id);
                            return true;
                        }
                    });
                });
                struct.admins = admins;
                struct.peers = peers;
                struct.clients = clients;
                //All now replaced with lookup ids
                let copy = JSON.parse(JSON.stringify(struct));
                if (copy._id)
                    delete copy._id;
                //console.log(struct)
                if (mode === 'mongo') {
                    if (struct._id.includes('defaultId')) {
                        yield this.db.collection(struct.structType).insertOne(copy);
                    }
                    else
                        yield this.collections.groups.instance.updateOne({ _id: safeObjectID(struct._id) }, { $set: copy }, { upsert: true });
                }
                else {
                    this.setLocalData(struct);
                }
                this.checkToNotify(user, [struct], this.mode);
                return struct;
            }
            else
                return false;
        });
    }
    //
    getMongoUser(user, info = '', bypassAuth = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                const query = [{ email: info }, { id: info }, { username: info }];
                try {
                    query.push({ _id: safeObjectID(info) });
                }
                catch (e) { }
                let u = yield this.collections.users.instance.findOne({ $or: query }); //encryption references
                if (!u || u == null)
                    resolve({});
                else {
                    if (!u._id && u._id)
                        u._id = u._id.toString();
                    else if (!u._id && u._id)
                        u._id = u._id;
                    if (!u.ownerId)
                        u.ownerId = u._id;
                    if (u && bypassAuth === false) {
                        if (user._id !== u._id || (user._id === u._id && user.userRoles.includes('admin_control'))) { // TODO: Ensure that passed users will always have the same ObjectId (not necessarily id...)
                            let passed = yield this.checkAuthorization(user, u);
                            if (!passed)
                                resolve(undefined);
                        }
                        // console.log(u);
                        let authorizations = [];
                        let auths = this.collections.authorizations.instance.find({ ownerId: u._id });
                        if (((yield auths.count()) > 0)) {
                            yield auths.forEach(d => authorizations.push(d));
                        }
                        let gs = this.collections.groups.instance.find({ users: { $all: [u._id] } });
                        let groups = [];
                        if (((yield gs.count()) > 0)) {
                            yield gs.forEach(d => groups.push(d));
                        }
                        u.authorizations = authorizations;
                        u.groups = groups;
                        resolve(u);
                    }
                    else
                        resolve(u);
                }
            }));
        });
    }
    //safely returns the profile id, username, and email and other basic info based on the user role set applied
    getMongoUsersByIds(user = {}, userIds = []) {
        return __awaiter(this, void 0, void 0, function* () {
            let usrs = [];
            userIds.forEach((u) => {
                try {
                    usrs.push({ _id: safeObjectID(u) });
                }
                catch (_a) { }
            });
            let found = [];
            if (usrs.length > 0) {
                let users = this.collections.users.instance.find({ $or: usrs });
                if ((yield users.count()) > 0) {
                    yield users.forEach((u) => {
                        found.push(u);
                    });
                }
            }
            return found;
        });
    }
    //safely returns the profile id, username, and email and other basic info based on the user role set applied
    getMongoUsersByRoles(user = {}, userRoles = []) {
        return __awaiter(this, void 0, void 0, function* () {
            let users = this.collections.users.instance.find({
                userRoles: { $all: userRoles }
            });
            let found = [];
            if ((yield users.count()) > 0) {
                yield users.forEach((u) => {
                    found.push(u);
                });
            }
            return found;
        });
    }
    getMongoDataByIds(user, structIds, ownerId, collection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (structIds.length > 0) {
                let query = [];
                structIds.forEach((_id) => {
                    let q = { _id };
                    if (ownerId)
                        q.ownerId = ownerId;
                    query.push(q);
                });
                let found = [];
                if (!collection) {
                    yield Promise.all(Object.keys(this.collections).map((name) => __awaiter(this, void 0, void 0, function* () {
                        let cursor = yield this.db.collection(name).find({ $or: query });
                        if ((yield cursor.count()) > 0) {
                            let passed = true;
                            let checkedAuth = '';
                            yield cursor.forEach((s) => __awaiter(this, void 0, void 0, function* () {
                                if ((user._id !== s.ownerId || (user._id === s.ownerId && user.userRoles.includes('admincontrol'))) && checkedAuth !== s.ownerId) {
                                    passed = yield this.checkAuthorization(user, s);
                                    checkedAuth = s.ownerId;
                                }
                                if (passed)
                                    found.push(s);
                            }));
                        }
                    })));
                }
                else {
                    let cursor = yield this.db.collection(collection).find({ $or: query });
                    if ((yield cursor.count()) > 0) {
                        let passed = true;
                        let checkedAuth = '';
                        yield cursor.forEach((s) => __awaiter(this, void 0, void 0, function* () {
                            if ((user._id !== s.ownerId || (user._id === s.ownerId && user.userRoles.includes('admincontrol'))) && checkedAuth !== s.ownerId) {
                                passed = yield this.checkAuthorization(user, s);
                                checkedAuth = s.ownerId;
                            }
                            if (passed)
                                found.push(s);
                        }));
                    }
                }
                return found;
            }
        });
    }
    //get all data for an associated user, can add a search string
    getMongoData(user, collection, ownerId, dict = {}, limit = 0, skip = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ownerId)
                ownerId = dict === null || dict === void 0 ? void 0 : dict.ownerId; // TODO: Ensure that replacing ownerId, key, value with dict was successful
            if (dict._id)
                dict._id = safeObjectID(dict._id);
            let structs = [];
            let passed = true;
            let checkedAuth = '';
            if (!collection && !ownerId && !dict)
                return [];
            else if (!collection && ownerId && Object.keys(dict).length === 0)
                return yield this.getAllUserMongoData(user, ownerId);
            else if (!dict && ownerId) {
                let cursor = this.db.collection(collection).find({ ownerId }).sort({ $natural: -1 }).skip(skip);
                if (limit > 0)
                    cursor.limit(limit);
                if ((yield cursor.count()) > 0) {
                    yield cursor.forEach((s) => __awaiter(this, void 0, void 0, function* () {
                        if ((user._id !== s.ownerId || (user._id === s.ownerId && user.userRoles.includes('admincontrol'))) && checkedAuth !== s.ownerId) {
                            passed = yield this.checkAuthorization(user, s);
                            checkedAuth = s.ownerId;
                        }
                        if (passed === true)
                            structs.push(s);
                    }));
                }
            }
            else if (Object.keys(dict).length > 0 && ownerId) {
                let found = yield this.db.collection(collection).findOne(Object.assign({ ownerId: ownerId }, dict));
                if (found)
                    structs.push(found);
            }
            else if (Object.keys(dict).length > 0 && !ownerId) { //need to search all collections in this case
                yield Promise.all(Object.keys(this.collections).map((name) => __awaiter(this, void 0, void 0, function* () {
                    let found = yield this.db.collection(name).findOne(dict);
                    if (found) {
                        if ((user._id !== found.ownerId || (user._id === found.ownerId && user.userRoles.includes('admincontrol'))) && checkedAuth !== found.ownerId) {
                            passed = yield this.checkAuthorization(user, found);
                            checkedAuth = found.ownerId;
                        }
                        structs.push(found);
                        return;
                    }
                })));
            }
            if (!passed)
                return [];
            return structs;
        });
    }
    getAllUserMongoData(user, ownerId, excluded = []) {
        return __awaiter(this, void 0, void 0, function* () {
            let structs = [];
            let passed = true;
            let checkedId = '';
            yield Promise.all(Object.keys(this.collections).map((name, j) => __awaiter(this, void 0, void 0, function* () {
                if (passed && excluded.indexOf(name) < 0) {
                    let cursor = this.db.collection(name).find({ ownerId: ownerId });
                    let count = yield cursor.count();
                    for (let k = 0; k < count; k++) {
                        let struct = yield cursor.next();
                        if ((user._id !== ownerId || (user._id === ownerId && user.userRoles.includes('admincontrol'))) && checkedId !== ownerId) {
                            passed = yield this.checkAuthorization(user, struct);
                            //console.log(passed)
                            checkedId = ownerId;
                        }
                        //if(j === 0 && k === 0) console.log(passed,structs);
                        if (passed)
                            structs.push(struct);
                    }
                }
            })));
            if (!passed)
                return [];
            //console.log(structs);
            //console.log(passed, structs);
            return structs;
        });
    }
    //passing in structrefs to define the collection (structType) and id
    getMongoDataByRefs(user, structRefs = []) {
        return __awaiter(this, void 0, void 0, function* () {
            let structs = [];
            //structRef = {structType, id}
            if (structs.length > 0) {
                let checkedAuth = '';
                structRefs.forEach((ref) => __awaiter(this, void 0, void 0, function* () {
                    if (ref.structType && ref._id) {
                        let struct = yield this.db.collection(ref.structType).findOne({ _id: safeObjectID(ref._id) });
                        if (struct) {
                            let passed = true;
                            if ((user._id !== struct.ownerId || (user._id === struct.ownerId && user.userRoles.includes('admincontrol'))) && checkedAuth !== struct.ownerId) {
                                let passed = yield this.checkAuthorization(user, struct);
                                checkedAuth = struct.ownerId;
                            }
                            if (passed === true) {
                                structs.push(struct);
                            }
                        }
                    }
                }));
            }
            return structs;
        });
    }
    getMongoAuthorizations(user, ownerId = user._id, authId = '') {
        return __awaiter(this, void 0, void 0, function* () {
            let auths = [];
            if (authId.length === 0) {
                let cursor = this.collections.authorizations.instance.find({ ownerId: ownerId });
                if ((yield cursor.count) > 0) {
                    yield cursor.forEach((a) => {
                        auths.push(a);
                    });
                }
            }
            else
                auths.push(yield this.collections.authorizations.instance.findOne({ _id: safeObjectID(authId), ownerId: ownerId }));
            if (user._id !== auths[0].ownerId) {
                let passed = yield this.checkAuthorization(user, auths[0]);
                if (!passed)
                    return undefined;
            }
            return auths;
        });
    }
    getMongoGroups(user, userId = user._id, groupId = '') {
        return __awaiter(this, void 0, void 0, function* () {
            let groups = [];
            if (groupId.length === 0) {
                let cursor = this.collections.groups.instance.find({ users: { $all: [userId] } });
                if ((yield cursor.count) > 0) {
                    yield cursor.forEach((a) => {
                        groups.push(a);
                    });
                }
            }
            else {
                try {
                    groups.push(yield this.collections.groups.instance.findOne({ _id: safeObjectID(groupId), users: { $all: [userId] } }));
                }
                catch (_a) { }
            }
            return groups;
        });
    }
    //general delete function
    deleteMongoData(user, structRefs = []) {
        return __awaiter(this, void 0, void 0, function* () {
            // let ids = [];
            let structs = [];
            yield Promise.all(structRefs.map((ref) => __awaiter(this, void 0, void 0, function* () {
                try {
                    let _id = safeObjectID(ref._id);
                    let struct = yield this.db.collection(ref.structType).findOne({ _id });
                    if (struct) {
                        structs.push(struct);
                        let notifications = yield this.collections.notifications.instance.find({ parent: { structType: ref.structType, id: ref._id } });
                        let count = yield notifications.count();
                        for (let i = 0; i < count; i++) {
                            let note = yield notifications.next();
                            if (note)
                                structs.push(note);
                        }
                    }
                }
                catch (_a) { }
            })));
            let checkedOwner = '';
            yield Promise.all(structs.map((struct, i) => __awaiter(this, void 0, void 0, function* () {
                var _b;
                let passed = true;
                if ((struct.ownerId !== user._id || (user._id === struct.ownerId && ((_b = user.userRoles) === null || _b === void 0 ? void 0 : _b.includes('admincontrol')))) && struct.ownerId !== checkedOwner) {
                    checkedOwner = struct.ownerId;
                    passed = yield this.checkAuthorization(user, struct, 'WRITE');
                }
                if (passed) {
                    //console.log(passed);
                    yield this.db.collection(struct.structType).deleteOne({ _id: safeObjectID(struct._id) });
                    //delete any associated notifications, too
                    if (struct.users) {
                        struct.users.forEach((uid) => {
                            if (uid !== user._id && uid !== struct.ownerId)
                                this.router.sendMsg(uid, 'deleted', struct._id);
                        });
                    }
                    if (struct.ownerId !== user._id) {
                        this.router.sendMsg(struct.ownerId, 'deleted', struct._id);
                    }
                }
            })));
            return true;
        });
    }
    //specific delete functions (the above works for everything)
    deleteMongoUser(user, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (user._id !== userId || (user._id === userId && user.userRoles.includes('admincontrol'))) {
                let u = yield this.collections.users.instance.findOne({ id: userId });
                let passed = yield this.checkAuthorization(user, u, 'WRITE');
                if (!passed)
                    return false;
            }
            yield this.collections.users.instance.deleteOne({ id: userId });
            if (user._id !== userId)
                this.router.sendMsg(userId, 'deleted', userId);
            //now delete their authorizations and data too (optional?)
            return true;
        });
    }
    deleteMongoGroup(user, groupId) {
        return __awaiter(this, void 0, void 0, function* () {
            let s = yield this.collections.groups.instance.findOne({ _id: safeObjectID(groupId) });
            if (s) {
                if (user._id !== s.ownerId || (user._id === s.ownerId && user.userRoles.includes('admincontrol'))) {
                    let passed = yield this.checkAuthorization(user, s, 'WRITE');
                    if (!passed)
                        return false;
                }
                if (s.users) {
                    s.users.forEach((u) => { this.router.sendMsg(s.authorizerId, 'deleted', s._id); });
                }
                yield this.collections.groups.instance.deleteOne({ _id: safeObjectID(groupId) });
                return true;
            }
            else
                return false;
        });
    }
    deleteMongoAuthorization(user, authId) {
        return __awaiter(this, void 0, void 0, function* () {
            let s = yield this.collections.authorizations.instance.findOne({ _id: safeObjectID(authId) });
            if (s) {
                if (user._id !== s.ownerId || (user._id === s.ownerId && user.userRoles.includes('admincontrol'))) {
                    let passed = yield this.checkAuthorization(user, s, 'WRITE');
                    if (!passed)
                        return false;
                }
                if (s.associatedAuthId) {
                    if (this.router.DEBUG)
                        console.log(s);
                    yield this.collections.authorizations.instance.deleteOne({ _id: safeObjectID(s.associatedAuthId) }); //remove the other auth too 
                    if (s.authorizerId !== user._id)
                        this.router.sendMsg(s.authorizerId, 'deleted', s._id);
                    else if (s.authorizedId !== user._id)
                        this.router.sendMsg(s.authorizedId, 'deleted', s._id);
                }
                yield this.collections.authorizations.instance.deleteOne({ _id: safeObjectID(authId) });
                return true;
            }
            else
                return false;
        });
    }
    setAuthorization(user, authStruct, mode = this.mode) {
        return __awaiter(this, void 0, void 0, function* () {
            //check against authorization db to allow or deny client/professional requests.
            //i.e. we need to preauthorize people to use stuff and allow each other to view sensitive data to cover our asses
            /**
             *  structType:'authorization',
                authorizedId:'',
                authorizerId:'',
                authorizedName:'',
                authorizerName:'',
                authorizations:[], //authorization types e.g. what types of data the person has access to
                structIds:[], //necessary files e.g. HIPAA compliance //encrypt all of these individually, decrypt ONLY on access with hash keys and secrets and 2FA stuff
                status:'PENDING',
                expires:'', //PENDING for non-approved auths
                timestamp:Date.now(), //time of creation
                id:randomId(structType),
                ownerId: '',
                parentId: parentStruct?._id, //where it belongs
             */
            let u1, u2;
            if (mode === 'mongo') {
                u1 = yield this.getMongoUser(user, authStruct.authorizedId, true); //can authorize via email, id, or username
                u2 = yield this.getMongoUser(user, authStruct.authorizerId, true);
            }
            else {
                u1 = this.getLocalData('user', { '_id': authStruct.authorizedId });
                u2 = this.getLocalData('user', { '_id': authStruct.authorizedId });
            }
            if (!u1 || !u2)
                return false; //no profile data
            if (authStruct.authorizedId !== u1._id)
                authStruct.authorizedId = u1._id;
            if (authStruct.authorizerId !== u2._id)
                authStruct.authorizerId = u2._id;
            if (!authStruct.authorizedName) {
                if (u1.username)
                    authStruct.authorizedName = u1.username;
                else if (u1.email)
                    authStruct.authorizedName = u1.email;
            }
            if (!authStruct.authorizerName) {
                if (u1.username)
                    authStruct.authorizerName = u1.username;
                else if (u1.email)
                    authStruct.authorizerName = u1.email;
            }
            //console.log(authStruct);
            if ((user._id !== authStruct.ownerId || (user._id === authStruct.ownerId && user.userRoles.includes('admincontrol'))) && (user._id !== authStruct.authorizedId && user._id !== authStruct.authorizerId)) {
                let passed = yield this.checkAuthorization(user, authStruct, 'WRITE');
                if (!passed)
                    return false;
            }
            let auths = [];
            if (mode === 'mongo') {
                let s = this.collections.authorizations.instance.find({ $and: [{ authorizedId: authStruct.authorizedId }, { authorizerId: authStruct.authorizerId }] });
                if ((yield s.count()) > 0) {
                    yield s.forEach(d => auths.push(d));
                }
            }
            else {
                let s = this.getLocalData('authorization', { authorizedId: authStruct.authorizedId });
                if (Array.isArray(s)) {
                    s.forEach((d) => {
                        if (d.authorizerId === authStruct.authorizerId)
                            auths.push(d);
                    });
                }
            }
            let otherAuthset;
            if (Array.isArray(auths)) {
                auths.forEach((auth) => __awaiter(this, void 0, void 0, function* () {
                    if (auth.ownerId === user._id) { //got your own auth
                        //do nothing, just update your struct on the server if the other isn't found
                    }
                    else { //got the other associated user's auth, now can compare and verify
                        if (authStruct.authorizerId === user._id) { //if you are the one authorizing
                            auth.authorizations = authStruct.authorizations; //you set their permissions
                            auth.structIds = authStruct.structIds; //you set their permissions
                            auth.excluded = authStruct.excluded;
                            auth.expires = authStruct.expires;
                            //auth.groups = authStruct.groups;
                            auth.status = 'OKAY';
                            authStruct.status = 'OKAY'; //now both auths are valid, delete to invalidate
                        }
                        else { //if they are the authorizor
                            authStruct.authorizations = auth.authorizations; //they set your permissions
                            authStruct.structIds = auth.structIds; //they set your permissions
                            authStruct.excluded = auth.excluded;
                            authStruct.expires = auth.expires;
                            //authStruct.groups = auth.groups;
                            auth.status = 'OKAY';
                            authStruct.status = 'OKAY'; //now both auths are valid, delete to invalidate
                        }
                        authStruct.associatedAuthId = auth._id.toString();
                        auth.associatedAuthId = authStruct._id.toString();
                        otherAuthset = auth;
                        let copy = JSON.parse(JSON.stringify(auth));
                        if (this.mode.includes('mongo')) {
                            delete copy._id;
                            yield this.collections.authorizations.instance.updateOne({ $and: [{ authorizedId: authStruct.authorizedId }, { authorizerId: authStruct.authorizerId }, { ownerId: auth.ownerId }] }, { $set: copy }, { upsert: true });
                        }
                        else {
                            this.setLocalData(copy);
                        }
                    }
                }));
            }
            let copy = JSON.parse(JSON.stringify(authStruct));
            if (mode === 'mongo') {
                delete copy._id;
                yield this.collections.authorizations.instance.updateOne({ $and: [{ authorizedId: authStruct.authorizedId }, { authorizerId: authStruct.authorizerId }, { ownerId: authStruct.ownerId }] }, { $set: copy }, { upsert: true });
            }
            else {
                this.setLocalData(copy);
            }
            if (authStruct._id.includes('defaultId') && mode === 'mongo') {
                let replacedAuth = yield this.collections.authorizations.instance.findOne(copy);
                if (replacedAuth) {
                    authStruct._id = replacedAuth._id.toString();
                    if (otherAuthset) {
                        let otherAuth = yield this.collections.authorizations.instance.findOne({ $and: [{ authorizedId: otherAuthset.authorizedId }, { authorizerId: otherAuthset.authorizerId }, { ownerId: otherAuthset.ownerId }] });
                        if (otherAuth) {
                            otherAuth.associatedAuthId = authStruct._id;
                            delete otherAuth._id;
                            yield this.collections.authorizations.instance.updateOne({ $and: [{ authorizedId: otherAuth.authorizedId }, { authorizerId: otherAuth.authorizerId }, { ownerId: otherAuth.ownerId }] }, { $set: otherAuth }, { upsert: true });
                            this.checkToNotify(user, [otherAuth]);
                        }
                    }
                }
            }
            return authStruct; //pass back the (potentially modified) authStruct
        });
    }
    checkAuthorization(user, struct, request = 'READ', //'WRITE'
    mode = this.mode) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            /*
                If user is not the owner of the struct, check that they have permissions
            */
            //console.log(struct)
            if (!user || !struct)
                return false;
            if (typeof user === 'object') {
                if (struct.ownerId === user._id) {
                    if ((_a = user.userRoles) === null || _a === void 0 ? void 0 : _a.includes('admin_control')) {
                    }
                    else
                        return true;
                }
            }
            else if (typeof user === 'string') {
                if (struct.ownerId === user) {
                    return true;
                }
                else
                    user = { _id: user };
            }
            let auth1, auth2;
            if (mode === 'mongo') {
                auth1 = yield this.collections.authorizations.instance.findOne({ $or: [{ authorizedId: user._id, authorizerId: struct.ownerId, ownerId: user._id }, { authorizedId: struct.ownerId, authorizerId: user._id, ownerId: user._id }] });
                auth2 = yield this.collections.authorizations.instance.findOne({ $or: [{ authorizedId: user._id, authorizerId: struct.ownerId, ownerId: struct.ownerId }, { authorizedId: struct.ownerId, authorizerId: user._id, ownerId: struct.ownerId }] });
            }
            else {
                auth1 = this.getLocalData('authorization', { ownerId: user._id }).find((o) => {
                    if (o.authorizedId === user._id && o.authorizerId === struct.ownerId)
                        return true;
                });
                auth2 = this.getLocalData('authorization', { ownerId: struct.ownerId }).find((o) => {
                    if (o.authorizedId === user._id && o.authorizerId === struct.ownerId)
                        return true;
                });
            }
            if (!auth1 || !auth2) {
                //console.log('auth bounced', user, struct, auth1, auth2);
                return false;
            }
            /*
                check if both users have the correct overlapping authorizations for the authorized user for the specific content, check first based on structId metadata to save calls
                    i.e.
                    check relevant scenarios like
                    e.g. is the user an assigned peer?
                    e.g. does this user have the required specific access permissions set? i.e. for different types of sensitive data
            */
            let passed = false;
            if (auth1.status === 'OKAY' && auth2.status === 'OKAY') {
                if (struct.structType === 'group') {
                    if (auth1.authorizations.indexOf(struct.name + '_admin') > -1 && auth2.authorizations.indexOf(struct.name + '_admin') > -1)
                        passed = true;
                    else
                        passed = false;
                }
                else if (auth1.authorizations.indexOf('provider') > -1 && auth2.authorizations.indexOf('provider') > -1)
                    passed = true;
                else if (auth1.authorizations.indexOf('peer') > -1 && auth2.authorizations.indexOf('peer') > -1)
                    passed = true;
                else if (auth1.authorizations.indexOf('control') > -1 && auth2.authorizations.indexOf('control') > -1)
                    passed = true;
                else if (((_b = auth1.structIds) === null || _b === void 0 ? void 0 : _b.indexOf(struct._id)) > -1 && ((_c = auth2.structIds) === null || _c === void 0 ? void 0 : _c.indexOf(struct._id)) > -1)
                    passed = true;
                else if (auth1.excluded.indexOf(struct.structType) > -1 && struct.ownerId === user._id && request === 'WRITE')
                    passed = false;
                //other filters?
            }
            //if(!passed) console.log('auth bounced', auth1, auth2);
            return passed;
        });
    }
    //Local Data stuff (for non-mongodb usage of this server)
    //just assigns replacement object to old object if it exists, keeps things from losing parent context in UI
    overwriteLocalData(structs) {
        if (Array.isArray(structs)) {
            structs.forEach((struct) => {
                let localdat = this.getLocalData(struct.structType, { 'ownerId': struct.ownerId, '_id': struct._id });
                if (!localdat || (localdat === null || localdat === void 0 ? void 0 : localdat.length) === 0) {
                    this.setLocalData(struct); //set
                }
                else
                    Object.assign(localdat, struct); //overwrite
            });
        }
        else {
            let localdat = this.getLocalData(structs.structType, { 'ownerId': structs.ownerId, '_id': structs._id });
            if (!localdat || (localdat === null || localdat === void 0 ? void 0 : localdat.length) === 0) {
                this.setLocalData(structs); //set
            }
            else
                Object.assign(localdat, structs); //overwrite
        }
    }
    setLocalData(structs) {
        let setInCollection = (s) => {
            let type = s.structType;
            let collection = this.collections[type].reference;
            if (!collection) {
                collection = {};
                this.collections[type].reference = collection;
            }
            collection[s._id] = s;
        };
        if (Array.isArray(structs)) {
            structs.forEach((s) => {
                setInCollection(s);
            });
        }
        else
            setInCollection(structs);
    }
    //pull a struct by collection, owner, and key/value pair from the local platform, leave collection blank to pull all ownerId associated data
    getLocalData(collection, query) {
        // Split Query
        let ownerId, key, value;
        if (typeof query === 'object') {
            ownerId = query.ownerId;
            // TODO: Make more robust. Does not support more than one key (aside from ownerId)
            const keys = Object.keys(query).filter(k => k != 'ownerId');
            key = keys[0];
            value = query[key];
        }
        else
            value = query;
        if (!collection && !ownerId && !key && !value)
            return [];
        let result = [];
        if (!collection && (ownerId || key)) {
            Object.values(this.collections).forEach((c) => {
                c = c.reference; // Drop to reference
                if ((key === '_id' || key === 'id') && value) {
                    let found = c[value];
                    if (found)
                        result.push(found);
                }
                else {
                    Object.values(c).forEach((struct) => {
                        if (key && value) {
                            if (struct[key] === value && struct.ownerId === ownerId) {
                                result.push(struct);
                            }
                        }
                        else if (struct.ownerId === ownerId) {
                            result.push(struct);
                        }
                    });
                }
            });
            return result;
        }
        else {
            let c = this.collections[collection].reference;
            if (!c)
                return result;
            if (!key && !ownerId) {
                Object.values(c).forEach((struct) => { result.push(struct); });
                return result; //return the whole collection
            }
            if ((key === '_id' || key === 'id') && value)
                return c[value]; //collections store structs by id so just get the one struct
            else {
                Object.keys(c).forEach((k) => {
                    const struct = c[k];
                    if (key && value && !ownerId) {
                        if (struct[key] === value)
                            result.push(struct);
                    }
                    else if (ownerId && !key) {
                        if (struct.ownerId === ownerId)
                            result.push(struct);
                    }
                    else if (ownerId && key && value) {
                        if (struct.ownerId === ownerId && struct[key]) {
                            if (struct[key] === value)
                                result.push(struct);
                        }
                    }
                });
            }
        }
        return result; //return an array of results
    }
    deleteLocalData(struct) {
        if (!struct)
            throw new Error('Struct not supplied');
        if (!struct.structType || !struct._id)
            return false;
        // Delete the Reference by ID
        if (this.collections[struct.structType])
            delete this.collections[struct.structType].reference[struct._id];
        return true;
    }
}
export default StructService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RydWN0cy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3RydWN0cy5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxzQ0FBc0M7QUFDdEMsa0RBQWtEO0FBQ2xELDRDQUE0QztBQUM1QyxPQUFPLFFBQVEsTUFBTSxlQUFlLENBQUE7QUFHcEMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUVqRCx5REFBeUQ7QUFFekQsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUU7SUFDaEMsT0FBTyxDQUFDLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQTtBQUMvRSxDQUFDLENBQUE7QUFvQkQsTUFBTSxrQkFBa0IsR0FBRztJQUN2QixNQUFNO0lBQ04sT0FBTztJQUNQLGVBQWU7SUFDZixZQUFZO0lBQ1osVUFBVTtJQUNWLFNBQVM7SUFDVCxjQUFjO0lBQ2QsT0FBTztJQUNQLGNBQWM7SUFDZCxVQUFVO0lBQ1YsTUFBTTtDQUNULENBQUM7QUFFRixNQUFNLE9BQU8sYUFBYyxTQUFRLE9BQU87SUFVdEMsWUFBYSxNQUFNLEVBQUUsWUFJakIsRUFBRSxFQUFFLEtBQUssR0FBQyxLQUFLO1FBQ2YsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBYmpCLFNBQUksR0FBRyxTQUFTLENBQUE7UUFHaEIsZ0JBQVcsR0FBb0IsRUFBRSxDQUFBO1FBQ2pDLFVBQUssR0FBWSxLQUFLLENBQUE7UUFpeEN0QixXQUFNLEdBQUcsR0FBUyxFQUFFO1lBQ2hCLGdFQUFnRTtZQUNoRSx3REFBd0Q7WUFDeEQsTUFBTSxPQUFPLENBQUMs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