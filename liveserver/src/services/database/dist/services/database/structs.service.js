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
                        console.log('getUser origin', origin, args, 'user found:', u);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RydWN0cy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3RydWN0cy5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxzQ0FBc0M7QUFDdEMsa0RBQWtEO0FBQ2xELDRDQUE0QztBQUM1QyxPQUFPLFFBQVEsTUFBTSxlQUFlLENBQUE7QUFHcEMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUVqRCx5REFBeUQ7QUFFekQsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUU7SUFDaEMsT0FBTyxDQUFDLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQTtBQUMvRSxDQUFDLENBQUE7QUFvQkQsTUFBTSxrQkFBa0IsR0FBRztJQUN2QixNQUFNO0lBQ04sT0FBTztJQUNQLGVBQWU7SUFDZixZQUFZO0lBQ1osVUFBVTtJQUNWLFNBQVM7SUFDVCxjQUFjO0lBQ2QsT0FBTztJQUNQLGNBQWM7SUFDZCxVQUFVO0lBQ1YsTUFBTTtDQUNULENBQUM7QUFFRixNQUFNLE9BQU8sYUFBYyxTQUFRLE9BQU87SUFVdEMsWUFBYSxNQUFNLEVBQUUsWUFJakIsRUFBRSxFQUFFLEtBQUssR0FBQyxLQUFLO1FBQ2YsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBYmpCLFNBQUksR0FBRyxTQUFTLENBQUE7UUFHaEIsZ0JBQVcsR0FBb0IsRUFBRSxDQUFBO1FBQ2pDLFVBQUssR0FBWSxLQUFLLENBQUE7UUFpeEN0QixXQUFNLEdBQUcsR0FBUyxFQUFFO1lBQ2hCLGdFQUFnRTtZQUNoRSx3REFBd0Q7WUFDeEQsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUV0RixPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDLENBQUEsQ0FBQTtRQTV3Q0csSUFBSSxDQUFDLEVBQUUsR0FBRyxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsRUFBRSxDQUFDO1FBRXhCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBRW5CLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUE7UUFFL0UscUNBQXFDO1FBQ3JDLDBCQUEwQjtRQUMxQixJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVc7WUFBRSxTQUFTLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQTtRQUN0RCxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDM0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUc7Z0JBQzVCLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtnQkFDN0UsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBO2FBQzFDO1FBQ0wsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUE7UUFFeEMseUJBQXlCO1FBQ3pCLElBQUksQ0FBQyxNQUFNLEdBQUc7WUFDVjtnQkFDSSxLQUFLLEVBQUMsU0FBUztnQkFDZixJQUFJLEVBQUMsQ0FBTyxJQUFJLEVBQUMsSUFBSSxFQUFDLE1BQU0sRUFBRSxFQUFFO29CQUM1QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUM3QixJQUFHLElBQUksQ0FBQyxLQUFLO3dCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUE7b0JBQzVFLElBQUksQ0FBQyxDQUFDO3dCQUFFLE9BQU8sS0FBSyxDQUFBO29CQUVwQixJQUFJLElBQUksQ0FBQztvQkFDVCxJQUFHLElBQUksQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFO3dCQUN0QixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDN0M7eUJBQU07d0JBQ0gsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUMsRUFBQyxHQUFHLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQzt3QkFDckQsSUFBRyxDQUFDLE1BQU07NEJBQUUsSUFBSSxHQUFHLEVBQUMsSUFBSSxFQUFDLEVBQUUsRUFBQyxDQUFDOzZCQUN4Qjs0QkFDRCxJQUFJLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUMsTUFBTSxDQUFDLENBQUM7NEJBQ3JELElBQUcsTUFBTSxFQUFFO2dDQUNQLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFDLEVBQUMsT0FBTyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0NBQzFELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFDLEVBQUMsT0FBTyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0NBQ2pFLElBQUksR0FBRyxFQUFDLElBQUksRUFBQyxNQUFNLEVBQUMsTUFBTSxFQUFDLE1BQU0sRUFBQyxjQUFjLEVBQUMsS0FBSyxFQUFDLENBQUM7NkJBQzNEOztnQ0FBTSxJQUFJLEdBQUcsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFDLENBQUM7eUJBQzNCO3FCQUNKO29CQUNELElBQUcsSUFBSSxDQUFDLEtBQUs7d0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQTtvQkFDckQsT0FBTyxJQUFJLENBQUM7Z0JBQ2hCLENBQUMsQ0FBQTthQUNKO1lBQ0Q7Z0JBQ0ksS0FBSyxFQUFDLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLENBQUMsU0FBUyxDQUFDO2dCQUNwQixJQUFJLEVBQUMsQ0FBTyxJQUFJLEVBQUMsSUFBSSxFQUFDLE1BQU0sRUFBRSxFQUFFO29CQUM1QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO29CQUM1QixJQUFJLENBQUMsQ0FBQzt3QkFBRSxPQUFPLEtBQUssQ0FBQTtvQkFDcEIsSUFBSSxJQUFJLENBQUM7b0JBQ1QsSUFBRyxJQUFJLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRTt3QkFDdEIsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQzdDO3lCQUFNO3dCQUNILElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7d0JBQy9ELElBQUcsTUFBTTs0QkFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN0QyxPQUFPLElBQUksQ0FBQztxQkFDZjtvQkFDRCxJQUFHLElBQUksQ0FBQyxLQUFLO3dCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUE7b0JBQ3BELE9BQU8sSUFBSSxDQUFDO2dCQUNoQixDQUFDLENBQUE7YUFDSjtZQUNEO2dCQUNJLEtBQUssRUFBQyxlQUFlO2dCQUNyQixJQUFJLEVBQUMsQ0FBTyxJQUFJLEVBQUMsSUFBSSxFQUFDLE1BQU0sRUFBRSxFQUFFO29CQUM1QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO29CQUM1QixJQUFJLENBQUMsQ0FBQzt3QkFBRSxPQUFPLEtBQUssQ0FBQTtvQkFFcEIsSUFBSSxJQUFJLENBQUM7b0JBQ1QsSUFBRyxJQUFJLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRTt3QkFDdEIsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDbkQ7eUJBQU07d0JBQ0gsSUFBSSxHQUFHLEVBQUUsQ0FBQzt3QkFDVixJQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7NEJBQ3ZCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFDLEVBQUMsR0FBRyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7NEJBQ3JELElBQUcsTUFBTTtnQ0FBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3lCQUNoQztxQkFDSjtvQkFDRCxJQUFHLElBQUksQ0FBQyxLQUFLO3dCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUE7b0JBQzFELE9BQU8sSUFBSSxDQUFDO2dCQUNoQixDQUFDLENBQUE7YUFDSjtZQUNEO2dCQUNJLEtBQUssRUFBQyxpQkFBaUI7Z0JBQ3ZCLElBQUksRUFBQyxDQUFPLElBQUksRUFBQyxJQUFJLEVBQUMsTUFBTSxFQUFFLEVBQUU7b0JBQzVCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7b0JBQzVCLElBQUksQ0FBQyxDQUFDO3dCQUFFLE9BQU8sS0FBSyxDQUFBO29CQUVwQixJQUFJLElBQUksQ0FBQztvQkFDVCxJQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUM1QixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUNyRDt5QkFBTTt3QkFDSCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUN6QyxJQUFJLEdBQUcsRUFBRSxDQUFDO3dCQUNWLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTs7NEJBQ3hCLElBQUcsTUFBQSxNQUFNLENBQUMsU0FBUywwQ0FBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0NBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7NkJBQ3JCO3dCQUNMLENBQUMsQ0FBQyxDQUFDO3FCQUNOO29CQUNELElBQUcsSUFBSSxDQUFDLEtBQUs7d0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxDQUFBO29CQUMzRCxPQUFPLElBQUksQ0FBQztnQkFDaEIsQ0FBQyxDQUFBO2FBQ0o7WUFFRDtnQkFDSSxLQUFLLEVBQUMsWUFBWTtnQkFDbEIsT0FBTyxFQUFFLENBQUMsWUFBWSxDQUFDO2dCQUN2QixJQUFJLEVBQUMsQ0FBTyxJQUFJLEVBQUMsSUFBSSxFQUFDLE1BQU0sRUFBRSxFQUFFO29CQUM1QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO29CQUM1QixJQUFJLENBQUMsQ0FBQzt3QkFBRSxPQUFPLEtBQUssQ0FBQTtvQkFFcEIsSUFBSSxJQUFJLENBQUM7b0JBQ1QsSUFBRyxJQUFJLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRTt3QkFDdEIsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQ2hEO3lCQUFNO3dCQUNILElBQUksR0FBRyxLQUFLLENBQUM7d0JBQ2IsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDeEMsSUFBRyxNQUFNLEVBQUU7NEJBQ1AsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBQyxNQUFNLEVBQUMsT0FBTyxDQUFDLENBQUM7NEJBQ3ZELElBQUcsTUFBTTtnQ0FBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQzt5QkFDbEQ7cUJBQ0o7b0JBQ0QsSUFBRyxJQUFJLENBQUMsS0FBSzt3QkFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxDQUFBO29CQUN4RCxPQUFPLElBQUksQ0FBQztnQkFDaEIsQ0FBQyxDQUFBO2FBQ0o7WUFDRDtnQkFDSSxLQUFLLEVBQUMsU0FBUztnQkFDZixPQUFPLEVBQUMsQ0FBQyxjQUFjLENBQUM7Z0JBQ3hCLElBQUksRUFBRSxDQUFPLElBQUksRUFBQyxJQUFJLEVBQUMsTUFBTSxFQUFFLEVBQUU7b0JBQzdCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7b0JBQzVCLElBQUksQ0FBQyxDQUFDO3dCQUFFLE9BQU8sS0FBSyxDQUFBO29CQUVwQixJQUFJLElBQUksQ0FBQztvQkFDVCxJQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUM1QixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLHdCQUF3QjtxQkFDbkU7eUJBQU07d0JBQ0gsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO3dCQUNuQixJQUFJLEdBQUcsRUFBRSxDQUFDO3dCQUNWLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQU0sUUFBUSxFQUFFLEVBQUU7NEJBQ3pDLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7NEJBQ3pDLElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUMsT0FBTyxDQUFDLENBQUM7NEJBQzlELElBQUcsTUFBTSxFQUFFO2dDQUNQLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7Z0NBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0NBQ2xCLElBQUcsTUFBTSxDQUFDLFVBQVUsS0FBSyxjQUFjO29DQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7NkJBQ25FO3dCQUNMLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQzt3QkFDSixJQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQzs0QkFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNyRSxJQUFHLElBQUksQ0FBQyxLQUFLOzRCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFDLENBQUMsRUFBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ25ELE9BQU8sSUFBSSxDQUFDO3FCQUNmO29CQUNELElBQUcsSUFBSSxDQUFDLEtBQUs7d0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUMsQ0FBQyxFQUFDLElBQUksRUFBQyxJQUFJLENBQUMsQ0FBQTtvQkFDbEQsT0FBTyxJQUFJLENBQUM7Z0JBQ2hCLENBQUMsQ0FBQTthQUNKO1lBQ0Q7Z0JBQ0ksS0FBSyxFQUFDLFNBQVM7Z0JBQ2YsT0FBTyxFQUFDLENBQUMsY0FBYyxFQUFDLGFBQWEsQ0FBQztnQkFDdEMsSUFBSSxFQUFDLENBQU8sSUFBSSxFQUFDLElBQUksRUFBQyxNQUFNLEVBQUUsRUFBRTtvQkFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtvQkFDNUIsSUFBSSxDQUFDLENBQUM7d0JBQUUsT0FBTyxLQUFLLENBQUE7b0JBRXBCLElBQUksSUFBSSxDQUFDO29CQUNULElBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUU7d0JBQzVCLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDbEY7eUJBQU07d0JBQ0gsSUFBSSxHQUFHLEVBQUUsQ0FBQzt3QkFDVixJQUFJLE9BQU8sQ0FBQzt3QkFDWixJQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7NEJBQUUsT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2pELElBQUcsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7NEJBQUUsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxHQUFDLElBQUcsQ0FBQyxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dDQUFFLE9BQU8sSUFBSSxDQUFDLENBQUEsQ0FBQyxDQUFDLENBQUM7d0JBQy9GLFNBQVM7d0JBQ1QsSUFBRyxPQUFPOzRCQUFFLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQU0sQ0FBQyxFQUFFLEVBQUU7Z0NBQ2pELElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dDQUN0QyxJQUFJLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUMsTUFBTSxDQUFDLENBQUM7Z0NBQ3JELElBQUcsTUFBTTtvQ0FBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDOzRCQUNqQyxDQUFDLENBQUEsQ0FBQyxDQUFDLENBQUM7cUJBQ1A7b0JBQ0QsSUFBRyxJQUFJLENBQUMsS0FBSzt3QkFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBQyxDQUFDLEVBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxDQUFBO29CQUNsRCxPQUFPLElBQUksQ0FBQztnQkFDaEIsQ0FBQyxDQUFBO2FBQ0o7WUFDRDtnQkFDQSxLQUFLLEVBQUMsY0FBYztnQkFDcEIsT0FBTyxFQUFDLENBQUMsbUJBQW1CLEVBQUMsa0JBQWtCLENBQUM7Z0JBQ2hELElBQUksRUFBQyxDQUFPLElBQUksRUFBQyxJQUFJLEVBQUMsTUFBTSxFQUFFLEVBQUU7b0JBQzVCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7b0JBQzVCLElBQUksQ0FBQyxDQUFDO3dCQUFFLE9BQU8sS0FBSyxDQUFBO29CQUVwQixJQUFJLElBQUksQ0FBQztvQkFDVCxJQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUM1QixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQ3JFO3lCQUFNO3dCQUNILElBQUksR0FBRyxFQUFFLENBQUM7d0JBQ1YsSUFBSSxPQUFPLENBQUM7d0JBQ1osSUFBRyxJQUFJLENBQUMsQ0FBQyxDQUFDOzRCQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNqRCxJQUFHLE9BQU8sSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDOzRCQUFFLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsR0FBQyxJQUFHLENBQUMsQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztnQ0FBRSxPQUFPLElBQUksQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO3dCQUMvRixJQUFHLE9BQU87NEJBQUMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBTSxDQUFDLEVBQUUsRUFBRTtnQ0FDaEQsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Z0NBQ3RDLElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBQyxNQUFNLENBQUMsQ0FBQztnQ0FDckQsSUFBRyxNQUFNO29DQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7NEJBQ2pDLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQztxQkFDUDtvQkFDRCxJQUFHLElBQUksQ0FBQyxLQUFLO3dCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFDLENBQUMsRUFBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLENBQUE7b0JBQ3ZELE9BQU8sSUFBSSxDQUFDO2dCQUNoQixDQUFDLENBQUE7YUFDSjtZQUNEO2dCQUNJLEtBQUssRUFBQyxZQUFZO2dCQUNsQixJQUFJLEVBQUMsQ0FBTyxJQUFJLEVBQUMsSUFBSSxFQUFDLE1BQU0sRUFBRSxFQUFFO29CQUM1QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO29CQUM1QixJQUFJLENBQUMsQ0FBQzt3QkFBRSxPQUFPLEtBQUssQ0FBQTtvQkFFcEIsSUFBSSxJQUFJLENBQUM7b0JBQ1QsSUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRTt3QkFDNUIsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQzVEO3lCQUFNO3dCQUNILElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFDLEVBQUMsT0FBTyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7d0JBQzVELElBQUksR0FBRyxFQUFFLENBQUM7d0JBQ1YsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBTyxNQUFNLEVBQUUsRUFBRTs0QkFDMUMsSUFBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0NBQ1IsSUFBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7b0NBQ3ZDLElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBQyxNQUFNLENBQUMsQ0FBQztvQ0FDckQsSUFBRyxNQUFNO3dDQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7aUNBQ2hDOzZCQUNKO2lDQUFNO2dDQUNILElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBQyxNQUFNLENBQUMsQ0FBQztnQ0FDckQsSUFBRyxNQUFNO29DQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7NkJBQ2hDO3dCQUNMLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQztxQkFDUDtvQkFDRCxJQUFHLElBQUksQ0FBQyxLQUFLO3dCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFDLENBQUMsRUFBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLENBQUE7b0JBQ3JELE9BQU8sSUFBSSxDQUFDO2dCQUNoQixDQUFDLENBQUE7YUFDSjtZQUNEO2dCQUNJLEtBQUssRUFBQyxZQUFZO2dCQUNsQixJQUFJLEVBQUMsQ0FBTyxJQUFJLEVBQUMsSUFBSSxFQUFDLE1BQU0sRUFBRSxFQUFFO29CQUM1QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO29CQUM1QixJQUFJLENBQUMsQ0FBQzt3QkFBRSxPQUFPLEtBQUssQ0FBQTtvQkFFcEIsSUFBSSxJQUFJLENBQUM7b0JBQ1QsSUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRTt3QkFDNUIsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUM7cUJBQzdDO3lCQUFNO3dCQUNILElBQUksR0FBRyxLQUFLLENBQUM7d0JBQ2IsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBTyxRQUFRLEVBQUUsRUFBRTs0QkFDMUMsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQzs0QkFDekMsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFDLE1BQU0sRUFBQyxPQUFPLENBQUMsQ0FBQzs0QkFDN0QsSUFBRyxNQUFNO2dDQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7NEJBQ3hDLElBQUksR0FBRyxJQUFJLENBQUM7d0JBQ2hCLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQztxQkFDUDtvQkFDRCxJQUFHLElBQUksQ0FBQyxLQUFLO3dCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFDLENBQUMsRUFBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLENBQUE7b0JBQ3JELE9BQU8sSUFBSSxDQUFDO2dCQUNoQixDQUFDLENBQUE7YUFDSjtZQUNEO2dCQUNJLEtBQUssRUFBQyxVQUFVO2dCQUNoQixPQUFPLEVBQUMsQ0FBQyxXQUFXLENBQUM7Z0JBQ3JCLElBQUksRUFBQyxDQUFPLElBQUksRUFBQyxJQUFJLEVBQUMsTUFBTSxFQUFFLEVBQUU7b0JBQzVCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7b0JBQzVCLElBQUksQ0FBQyxDQUFDO3dCQUFFLE9BQU8sS0FBSyxDQUFBO29CQUVwQixJQUFJLElBQUksQ0FBQztvQkFDVCxJQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUM1QixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQ3ZEO3lCQUFNO3dCQUNILElBQUcsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFOzRCQUM1QixJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUMsRUFBQyxHQUFHLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQzt5QkFDbkQ7NkJBQU07NEJBQ0gsSUFBSSxHQUFHLEVBQUUsQ0FBQzs0QkFDVixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDOzRCQUN4QyxJQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRTtnQ0FDUixNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFDLEVBQUU7b0NBQ3JCLElBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dDQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0NBQ3pELENBQUMsQ0FBQyxDQUFDOzZCQUNOO2lDQUNJO2dDQUNELE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUMsRUFBRTtvQ0FDckIsSUFBRyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO3dDQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0NBQ3ZELENBQUMsQ0FBQyxDQUFDOzZCQUNOO3lCQUNKO3FCQUNKO29CQUNELElBQUcsSUFBSSxDQUFDLEtBQUs7d0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUMsQ0FBQyxFQUFDLElBQUksRUFBQyxJQUFJLENBQUMsQ0FBQTtvQkFDcEQsT0FBTyxJQUFJLENBQUM7Z0JBQ2hCLENBQUMsQ0FBQTthQUNKO1lBQ0Q7Z0JBQ0ksS0FBSyxFQUFDLFVBQVU7Z0JBQ2hCLElBQUksRUFBQyxDQUFPLElBQUksRUFBQyxJQUFJLEVBQUMsTUFBTSxFQUFFLEVBQUU7b0JBQzVCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7b0JBQzVCLElBQUksQ0FBQyxDQUFDO3dCQUFFLE9BQU8sS0FBSyxDQUFDO29CQUNyQixJQUFJLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3JELElBQUcsSUFBSSxDQUFDLEtBQUs7d0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUMsQ0FBQyxFQUFDLElBQUksRUFBQyxJQUFJLENBQUMsQ0FBQTtnQkFDdkQsQ0FBQyxDQUFBO2FBQ0o7WUFDRDtnQkFDSSxLQUFLLEVBQUMsYUFBYTtnQkFDbkIsSUFBSSxFQUFDLENBQU8sSUFBSSxFQUFDLElBQUksRUFBQyxNQUFNLEVBQUUsRUFBRTtvQkFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtvQkFDNUIsSUFBSSxDQUFDLENBQUM7d0JBQUUsT0FBTyxLQUFLLENBQUE7b0JBRXBCLElBQUksSUFBSSxDQUFDO29CQUNULElBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUU7d0JBQzVCLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQ2pEO3lCQUFNO3dCQUNILElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNoRCxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7d0JBQ25CLElBQUcsTUFBTTs0QkFBRSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFDLE1BQU0sRUFBQyxPQUFPLENBQUMsQ0FBQzt3QkFDcEUsSUFBRyxNQUFNLEVBQUU7NEJBQ1AsSUFBSSxHQUFHLElBQUksQ0FBQzt5QkFDZjtxQkFDSjtvQkFDRCxJQUFHLElBQUksQ0FBQyxLQUFLO3dCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFDLENBQUMsRUFBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLENBQUE7b0JBQ3RELE9BQU8sSUFBSSxDQUFDO2dCQUNoQixDQUFDLENBQUE7YUFDSjtZQUNEO2dCQUNJLEtBQUssRUFBQyxTQUFTO2dCQUNmLElBQUksRUFBQyxDQUFPLElBQUksRUFBQyxJQUFJLEVBQUMsTUFBTSxFQUFFLEVBQUU7b0JBQzVCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7b0JBQzVCLElBQUksQ0FBQyxDQUFDO3dCQUFFLE9BQU8sS0FBSyxDQUFDO29CQUNyQixJQUFJLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDOUQsSUFBRyxJQUFJLENBQUMsS0FBSzt3QkFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBQyxDQUFDLEVBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxDQUFBO29CQUN0RCxPQUFPLElBQUksQ0FBQTtnQkFDZixDQUFDLENBQUE7YUFDSjtZQUNEO2dCQUNJLEtBQUssRUFBQyxVQUFVO2dCQUNoQixJQUFJLEVBQUMsQ0FBTyxJQUFJLEVBQUMsSUFBSSxFQUFDLE1BQU0sRUFBRSxFQUFFO29CQUM1QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO29CQUM1QixJQUFJLENBQUMsQ0FBQzt3QkFBRSxPQUFPLEtBQUssQ0FBQTtvQkFFcEIsSUFBSSxJQUFJLENBQUM7b0JBQ1QsSUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRTt3QkFDNUIsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQy9EO3lCQUFNO3dCQUNILElBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFOzRCQUNSLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFDLEVBQUMsR0FBRyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7NEJBQzlELElBQUcsTUFBTTtnQ0FBRSxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQzt5QkFDOUI7NkJBQU07NEJBQ0gsSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFDLEVBQUMsT0FBTyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7eUJBQy9EO3FCQUNKO29CQUNELElBQUcsSUFBSSxDQUFDLEtBQUs7d0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUMsQ0FBQyxFQUFDLElBQUksRUFBQyxJQUFJLENBQUMsQ0FBQTtvQkFDdEQsT0FBTyxJQUFJLENBQUM7Z0JBQ2hCLENBQUMsQ0FBQTthQUNKO1lBQ0Q7Z0JBQ0ksS0FBSyxFQUFDLFlBQVk7Z0JBQ2xCLElBQUksRUFBQyxDQUFPLElBQUksRUFBQyxJQUFJLEVBQUMsTUFBTSxFQUFFLEVBQUU7b0JBQzVCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7b0JBQzVCLElBQUksQ0FBQyxDQUFDO3dCQUFFLE9BQU8sS0FBSyxDQUFBO29CQUVwQixJQUFJLElBQUksQ0FBQztvQkFDVCxJQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUM1QixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUN6RDt5QkFBTTt3QkFDSCxJQUFJLEdBQUcsSUFBSSxDQUFDO3dCQUNaLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFDLEVBQUMsR0FBRyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7d0JBQzlELElBQUcsTUFBTSxFQUFFOzRCQUNQLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUMsTUFBTSxFQUFDLE9BQU8sQ0FBQyxDQUFDOzRCQUN2RCxJQUFHLE1BQU07Z0NBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7eUJBQ2xEO3FCQUNKO29CQUNELElBQUcsSUFBSSxDQUFDLEtBQUs7d0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUMsQ0FBQyxFQUFDLElBQUksRUFBQyxJQUFJLENBQUMsQ0FBQTtvQkFDdEQsT0FBTyxJQUFJLENBQUM7Z0JBQ2hCLENBQUMsQ0FBQTthQUNKO1NBQUMsQ0FBQTtJQUVOLENBQUM7SUFFRCxrQkFBa0IsQ0FBQyxlQUFrQixFQUFFO1FBQ25DLElBQUksVUFBVSxHQUFHLGNBQWMsQ0FBQztRQUNoQyxJQUFJLE1BQU0sR0FBRztZQUNULFVBQVUsRUFBQyxVQUFVO1lBQ3JCLFNBQVMsRUFBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ3BCLEVBQUUsRUFBQyxRQUFRLENBQUMsVUFBVSxDQUFDO1lBQ3ZCLElBQUksRUFBQyxFQUFFO1lBQ1AsT0FBTyxFQUFFLEVBQUU7WUFDWCxZQUFZLEVBQUUsRUFBRTtZQUNoQixNQUFNLEVBQUUsRUFBQyxVQUFVLEVBQUMsWUFBWSxhQUFaLFlBQVksdUJBQVosWUFBWSxDQUFFLFVBQVUsRUFBQyxHQUFHLEVBQUMsWUFBWSxhQUFaLFlBQVksdUJBQVosWUFBWSxDQUFFLEdBQUcsRUFBQyxFQUFFLGtCQUFrQjtTQUMxRixDQUFDO1FBRUYsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUVELG9GQUFvRjtJQUNwRiw2RUFBNkU7SUFDdkUsYUFBYSxDQUFDLElBQWUsRUFBQyxVQUFjLEVBQUUsRUFBRSxJQUFJLEdBQUMsSUFBSSxDQUFDLElBQUk7O1lBRWhFLElBQUcsT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO2dCQUN6QixLQUFLLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFDO29CQUM5QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtvQkFDbEMsSUFBSSxHQUFHLENBQUMsR0FBRyxLQUFNLElBQVk7d0JBQUUsSUFBSSxHQUFHLEdBQUcsQ0FBQztpQkFDN0M7YUFDSjtZQUNELElBQUcsT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksSUFBSSxJQUFJO2dCQUFFLE9BQU8sS0FBSyxDQUFDO1lBQzFELElBQUksYUFBYSxHQUFHLEVBQUUsQ0FBQztZQUN2QiwrQ0FBK0M7WUFFL0MsSUFBSSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7WUFDMUIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFPLE1BQU0sRUFBQyxFQUFFO2dCQUM1QixJQUFJLENBQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLEdBQUcsTUFBSyxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUUsZ0RBQWdEO29CQUNoRixJQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ3RELGVBQWUsQ0FBQyxFQUFFLEdBQUcsZUFBZSxHQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyw4Q0FBOEM7b0JBQy9GLGVBQWUsQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztvQkFDekMsZUFBZSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsZUFBZTtvQkFDekQsZUFBZSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO29CQUM5QyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ3ZDLGFBQWEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztpQkFDbEQ7Z0JBQ0QsSUFBRyxNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsMkNBQTJDO29CQUMxRCxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBQyxFQUFFO3dCQUN4QixJQUFHLEdBQUcsS0FBSyxJQUFJLENBQUMsR0FBRyxFQUFFOzRCQUNqQixJQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7NEJBQ3RELGVBQWUsQ0FBQyxFQUFFLEdBQUcsZUFBZSxHQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyw4Q0FBOEM7NEJBQy9GLGVBQWUsQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDOzRCQUM5QixlQUFlLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7NEJBQ3pDLGVBQWUsQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQzs0QkFDOUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDOzRCQUN2QyxhQUFhLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO3lCQUM1QjtvQkFDTCxDQUFDLENBQUMsQ0FBQztpQkFDTjtxQkFDSSxFQUFFLGtGQUFrRjtvQkFDckYsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO29CQUNmLElBQUcsSUFBSSxLQUFLLE9BQU8sRUFBRTt3QkFDakIsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBQyxDQUFDLEVBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUMsRUFBQyxFQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQ25ILElBQUcsQ0FBQSxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBRyxDQUFDLEVBQUU7NEJBQ3BCLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt5QkFDdkM7cUJBQ0o7eUJBQU07d0JBQ0gsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFDLEVBQUMsWUFBWSxFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDO3dCQUNuRSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUMsRUFBQyxZQUFZLEVBQUMsSUFBSSxDQUFDLEdBQUcsRUFBQyxDQUFDLENBQUMsQ0FBQztxQkFDN0U7b0JBQ0QsSUFBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTt3QkFDakIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBQyxFQUFFOzRCQUNsQixJQUFHLE1BQU0sQ0FBQyxZQUFZLEtBQUssTUFBTSxDQUFDLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUU7Z0NBQzlFLElBQUcsSUFBSSxDQUFDLE1BQU0sS0FBSyxNQUFNLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7b0NBQ25FLElBQUksZUFBZSxHQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQ0FDdkQsZUFBZSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO29DQUM1QyxlQUFlLENBQUMsRUFBRSxHQUFHLGVBQWUsR0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsOENBQThDO29DQUMvRixlQUFlLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7b0NBQ3pDLGVBQWUsQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztvQ0FDOUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29DQUN2QyxhQUFhLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUM7aUNBQ3BFOzZCQUNKO3dCQUNMLENBQUMsQ0FBQyxDQUFDO3FCQUNOO2lCQUNKO1lBQ0wsQ0FBQyxDQUFBLENBQUMsQ0FBQztZQUVILElBQUcsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDNUIsSUFBRyxJQUFJLEtBQUssT0FBTyxFQUFDO29CQUNoQixNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxvQ0FBb0M7aUJBQ3hGO3FCQUFNO29CQUNILElBQUksQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztpQkFDdkM7Z0JBQ0QsOEJBQThCO2dCQUM5QixLQUFJLE1BQU0sR0FBRyxJQUFJLGFBQWEsRUFBRTtvQkFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDbkQ7Z0JBRUQsT0FBTyxJQUFJLENBQUM7YUFDZjs7Z0JBQU0sT0FBTyxLQUFLLENBQUM7UUFDeEIsQ0FBQztLQUFBO0lBR0ssWUFBWSxDQUFDLElBQWUsRUFBQyxVQUFnQixFQUFFOztZQUVqRCw0QkFBNEI7WUFDNUIsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLHVCQUF1QjtZQUN2QixJQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNuQixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUM7Z0JBQ2xCLElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBTyxNQUFNLEVBQUUsRUFBRTtvQkFDM0MsSUFBRyxDQUFDLENBQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLEdBQUcsTUFBSyxNQUFNLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxNQUFNLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBSSxXQUFXLEtBQUssTUFBTSxDQUFDLE9BQU8sRUFBRTt3QkFDOUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBQyxNQUFNLEVBQUMsT0FBTyxDQUFDLENBQUM7d0JBQzVELFdBQVcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO3FCQUNoQztvQkFDRCxJQUFHLE1BQU0sRUFBRTt3QkFDUCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzt3QkFDOUMsSUFBRyxJQUFJLENBQUMsR0FBRzs0QkFBRSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7d0JBQzdCLHFFQUFxRTt3QkFDckUsSUFBRyxNQUFNLENBQUMsRUFBRSxFQUFDOzRCQUNULElBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0NBQ2hDLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQ0FDNUQsVUFBVSxHQUFHLElBQUksQ0FBQzs2QkFDckI7O2dDQUNJLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLEVBQUUsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDLG9FQUFvRTt5QkFDcEw7NkJBQU0sSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFOzRCQUNuQixJQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dDQUNqQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7Z0NBQzVELFVBQVUsR0FBRyxJQUFJLENBQUM7NkJBQ3JCOztnQ0FDSSxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBQyxFQUFFLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxFQUFFLEVBQUMsTUFBTSxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7eUJBQzlIO3FCQUNKO2dCQUNMLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQztnQkFFSixJQUFJLFVBQXNCLEtBQUssSUFBSSxFQUFFO29CQUNqQyw0QkFBNEI7b0JBQzVCLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFDLDZDQUE2QztvQkFDaEUsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBTyxNQUFNLEVBQUMsQ0FBQyxFQUFDLEVBQUU7d0JBQzVDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUM5QyxJQUFHLElBQUksQ0FBQyxHQUFHOzRCQUFFLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQzt3QkFFN0IsSUFBRyxNQUFNLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTs0QkFDaEMsSUFBSSxNQUFNLENBQUM7NEJBQ1gsSUFBRyxNQUFNLENBQUMsVUFBVSxLQUFLLGNBQWM7Z0NBQUUsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDMUcsSUFBRyxNQUFNLEVBQUM7Z0NBQ04sTUFBTSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dDQUNuQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDOzZCQUN6Qjt5QkFDSjs2QkFDSSxJQUFHLE1BQU0sQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFLEVBQUUsdUZBQXVGOzRCQUM5SCxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUM7NEJBQ3JCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDOzRCQUNoRCxJQUFHLEtBQUssQ0FBQyxHQUFHO2dDQUFFLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQzs0QkFDL0IsSUFBSSxhQUFhLEdBQUcsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBRXZFLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7NEJBQ2hDLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRTtnQ0FDNUIsSUFBRyxDQUFDLENBQUMsR0FBRyxLQUFLLFNBQVM7b0NBQUUsT0FBTyxJQUFJLENBQUM7NEJBQ3hDLENBQUMsQ0FBQyxDQUFDOzRCQUNILElBQUcsT0FBTyxFQUFFO2dDQUNSLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dDQUNoRCxJQUFHLEtBQUssQ0FBQyxHQUFHO29DQUFFLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQztnQ0FDL0IsSUFBSSxXQUFXLENBQUM7Z0NBRWhCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFlBQVksRUFBQyxVQUFVLEVBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQU8sSUFBSSxFQUFFLEVBQUU7b0NBQ3JFLElBQUksS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUMsR0FBRyxFQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsRUFBQyxDQUFDLENBQUM7b0NBQ2xGLElBQUcsS0FBSzt3Q0FBRSxXQUFXLEdBQUcsS0FBSyxDQUFDO2dDQUNsQyxDQUFDLENBQUEsQ0FBQyxDQUFDLENBQUM7Z0NBQ0osMEJBQTBCO2dDQUMxQixJQUFHLFdBQVcsRUFBRTtvQ0FFWixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztvQ0FDaEMsSUFBSSxJQUFJLEVBQUUsVUFBVSxDQUFDO29DQUNyQixJQUFHLE1BQU0sS0FBSyxTQUFTLEVBQUU7d0NBQ3JCLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUU7NENBQ3JCLElBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxNQUFNO2dEQUFFLE9BQU8sSUFBSSxDQUFDO3dDQUNyQyxDQUFDLENBQUMsQ0FBQzt3Q0FDSCxJQUFHLElBQUksRUFBRTs0Q0FDTCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7NENBQ2hCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFlBQVksRUFBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBTyxJQUFJLEVBQUUsRUFBRTtnREFDM0QsSUFBSSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0RBQ3pELElBQUcsS0FBSztvREFBRSxVQUFVLEdBQUcsS0FBSyxDQUFDOzRDQUNqQyxDQUFDLENBQUEsQ0FBQyxDQUFDLENBQUM7eUNBQ1A7cUNBQ0o7O3dDQUFNLFVBQVUsR0FBRyxXQUFXLENBQUM7b0NBRWhDLElBQUcsV0FBVyxFQUFFO3dDQUNaLElBQUksQ0FBQyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzt3Q0FDakQsSUFBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7NENBQ1AsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDOzRDQUN0RCxhQUFhLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7eUNBQ3REO3FDQUNKO29DQUNELElBQUksVUFBVSxFQUFFO3dDQUNaLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzt3Q0FDakQsSUFBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7NENBQ1AsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDOzRDQUN0RCxhQUFhLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO3lDQUN4RDtxQ0FDSjtvQ0FDRCxJQUFJLFFBQVEsR0FBRyxDQUFDLGFBQWEsRUFBQyxXQUFXLENBQUMsQ0FBQztvQ0FDM0MsSUFBRyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFO3dDQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7b0NBQ3ZGLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQU0sQ0FBQyxFQUFDLEVBQUU7d0NBQ3JDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dDQUN6QyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7d0NBQ2hCLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFDLEdBQUcsRUFBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFDLEVBQUMsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLEVBQUMsRUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztvQ0FDN0csQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO29DQUVKLDhDQUE4QztvQ0FDOUMsNENBQTRDO29DQUM1Qyx5Q0FBeUM7b0NBQ3pDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFFLEVBQUU7d0NBQ3BDLElBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFOzRDQUNsQixJQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUU7Z0RBQUUsT0FBTyxJQUFJLENBQUM7d0NBQzFELENBQUMsQ0FBQyxFQUFDOzRDQUNDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CO3lDQUM5RDtvQ0FDTCxDQUFDLENBQUMsQ0FBQztvQ0FDSCxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7aUNBQzlCOzZCQUNKO2lDQUFNLElBQUcsYUFBYSxFQUFFO2dDQUNyQixRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDOzZCQUNoQzt5QkFDSjtvQkFDTCxDQUFDLENBQUEsQ0FBQyxDQUFDLENBQUM7b0JBQ0osSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ2xDLE9BQU8sUUFBUSxDQUFDO2lCQUNuQjtxQkFDSTtvQkFDRCxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7b0JBQ25CLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTt3QkFDbEIsSUFBRyxDQUFDLENBQUMsVUFBVSxLQUFLLGNBQWM7NEJBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUQsQ0FBQyxDQUFDLENBQUE7b0JBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ25DLE9BQU8sSUFBSSxDQUFDO2lCQUNmO2FBQ0o7O2dCQUNJLE9BQU8sS0FBSyxDQUFDO1FBQ3RCLENBQUM7S0FBQTtJQUVLLFlBQVksQ0FBQyxJQUFlLEVBQUMsTUFBb0I7O1lBR25ELElBQUcsTUFBTSxDQUFDLEdBQUcsRUFBRSxFQUFFLGdEQUFnRDtnQkFFN0QsSUFBRyxJQUFJLENBQUMsR0FBRyxLQUFLLE1BQU0sQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLE1BQU0sQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRTtvQkFDekcsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFDLE1BQU0sRUFBQyxPQUFPLENBQUMsQ0FBQztvQkFDaEUsSUFBRyxDQUFDLE1BQU07d0JBQUUsT0FBTyxLQUFLLENBQUM7aUJBQzVCO2dCQUVELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxJQUFHLElBQUksQ0FBQyxHQUFHO29CQUFFLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFFN0IsSUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUs7b0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFFNUQsOEJBQThCO2dCQUM5QixNQUFNLEdBQUcsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2dCQUNwQyxNQUFNLE1BQU0sR0FBRyxDQUFDLEdBQUcsS0FBSyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFLEVBQUMsQ0FBQTtnQkFDL0QsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUMsRUFBRSxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO2dCQUV0RixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM3RCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLE9BQU8sSUFBSSxDQUFDO2FBQ2Y7O2dCQUFNLE9BQU8sS0FBSyxDQUFDO1FBQ3hCLENBQUM7S0FBQTtJQUVLLFFBQVEsQ0FBQyxJQUFlLEVBQUMsU0FBVyxFQUFFLEVBQUUsSUFBSSxHQUFDLElBQUksQ0FBQyxJQUFJOztZQUV4RCxJQUFHLE1BQU0sQ0FBQyxHQUFHLEVBQUU7Z0JBQ1gsSUFBSSxNQUFNLEdBQUcsU0FBUyxDQUFDO2dCQUN2QixJQUFHLElBQUksS0FBSyxPQUFPLEVBQUU7b0JBQ2pCLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBQyxJQUFJLEVBQUMsTUFBTSxDQUFDLElBQUksRUFBQyxDQUFDLENBQUM7aUJBQy9FO3FCQUFNO29CQUNILE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBQyxFQUFDLEdBQUcsRUFBQyxNQUFNLENBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQztpQkFDeEQ7Z0JBQ0QsSUFBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxLQUFLLE1BQU0sQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFBRyxPQUFPLEtBQUssQ0FBQyxDQUFDLFFBQVE7Z0JBRWhILElBQUcsSUFBSSxDQUFDLEdBQUcsS0FBSyxNQUFNLENBQUMsT0FBTyxFQUFFO29CQUM1QixJQUFJLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUMsTUFBTSxFQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUNoRSxJQUFHLENBQUMsTUFBTTt3QkFBRSxPQUFPLEtBQUssQ0FBQztpQkFDNUI7Z0JBRUQsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO2dCQUNsQixNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO29CQUN2QixRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBQyxFQUFDLEVBQUMsRUFBRSxFQUFFLENBQUMsRUFBQyxFQUFDLEVBQUMsUUFBUSxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUE7Z0JBQ2xELENBQUMsQ0FBQyxDQUFDO2dCQUVILDZCQUE2QjtnQkFDN0IsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUNmLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztnQkFDYixJQUFHLElBQUksS0FBSyxPQUFPLEVBQUU7b0JBQ2pCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLHVCQUF1QjtvQkFDN0YsSUFBSSxDQUFBLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFHLENBQUMsRUFBRTt3QkFDMUIsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7NEJBQzFCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7NEJBQ2pCLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUN2QixDQUFDLENBQUMsQ0FBQztxQkFDTjtpQkFDSjtxQkFBTTtvQkFDSCxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7d0JBQ3hCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUM5QyxJQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFOzRCQUNsQixLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUN0QixHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzt5QkFDM0I7b0JBQ0wsQ0FBQyxDQUFDLENBQUM7aUJBQ047Z0JBRUQsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7Z0JBQ25CLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUNmLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDakIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO29CQUNoQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLGNBQWMsRUFBQyxDQUFDLEVBQUMsRUFBRTt3QkFDbkMsSUFBRyxjQUFjLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxjQUFjLEtBQUssQ0FBQyxDQUFDLEtBQUssSUFBSSxjQUFjLEtBQUssQ0FBQyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLE1BQU0sQ0FBQyxPQUFPLEVBQUU7NEJBQ3BILElBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztnQ0FBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDakQsT0FBTyxJQUFJLENBQUM7eUJBQ2Y7b0JBQ0wsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxjQUFjLEVBQUMsQ0FBQyxFQUFDLEVBQUU7d0JBQ2xDLElBQUcsY0FBYyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksY0FBYyxLQUFLLENBQUMsQ0FBQyxLQUFLLElBQUksY0FBYyxLQUFLLENBQUMsQ0FBQyxRQUFRLEVBQUU7NEJBQ3hGLElBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztnQ0FBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDL0MsT0FBTyxJQUFJLENBQUM7eUJBQ2Y7b0JBQ0wsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxjQUFjLEVBQUMsQ0FBQyxFQUFDLEVBQUU7d0JBQ3BDLElBQUcsY0FBYyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksY0FBYyxLQUFLLENBQUMsQ0FBQyxLQUFLLElBQUksY0FBYyxLQUFLLENBQUMsQ0FBQyxRQUFRLEVBQUU7NEJBQ3hGLElBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztnQ0FBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDbkQsT0FBTyxJQUFJLENBQUM7eUJBQ2Y7b0JBQ0wsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7Z0JBQ3ZCLE1BQU0sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2dCQUNyQixNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztnQkFHekIsa0NBQWtDO2dCQUVsQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDOUMsSUFBRyxJQUFJLENBQUMsR0FBRztvQkFBRSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQzdCLHFCQUFxQjtnQkFDckIsSUFBRyxJQUFJLEtBQUssT0FBTyxFQUFDO29CQUNoQixJQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFO3dCQUNqQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQy9EOzt3QkFDSSxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7aUJBQzFIO3FCQUFNO29CQUNILElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQzdCO2dCQUNELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QyxPQUFPLE1BQU0sQ0FBQzthQUNqQjs7Z0JBQU0sT0FBTyxLQUFLLENBQUM7UUFDeEIsQ0FBQztLQUFBO0lBRUQsRUFBRTtJQUNJLFlBQVksQ0FBQyxJQUFlLEVBQUMsSUFBSSxHQUFDLEVBQUUsRUFBRSxVQUFVLEdBQUMsS0FBSzs7WUFDeEQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFNLE9BQU8sRUFBQyxFQUFFO2dCQUMvQixNQUFNLEtBQUssR0FBUyxDQUFDLEVBQUMsS0FBSyxFQUFFLElBQUksRUFBQyxFQUFDLEVBQUMsRUFBRSxFQUFFLElBQUksRUFBQyxFQUFDLEVBQUMsUUFBUSxFQUFDLElBQUksRUFBQyxDQUFDLENBQUE7Z0JBQzlELElBQUk7b0JBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxDQUFBO2lCQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUU7Z0JBRXhELElBQUksQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDLENBQUMsdUJBQXVCO2dCQUU1RixJQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJO29CQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztxQkFDM0I7b0JBQ0QsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUc7d0JBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFBO3lCQUN4QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRzt3QkFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7b0JBRXhDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTzt3QkFBRSxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUE7b0JBRWpDLElBQUksQ0FBQyxJQUFJLFVBQVUsS0FBSyxLQUFLLEVBQUM7d0JBQzFCLElBQUcsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsRUFBRSw0RkFBNEY7NEJBQ3JMLElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQzs0QkFDbkQsSUFBRyxDQUFDLE1BQU07Z0NBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO3lCQUNsQzt3QkFDRCxrQkFBa0I7d0JBQ2xCLElBQUksY0FBYyxHQUFHLEVBQUUsQ0FBQzt3QkFDeEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFDLE9BQU8sRUFBQyxDQUFDLENBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQzt3QkFDM0UsSUFBRyxDQUFDLENBQUEsTUFBTSxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUcsQ0FBQyxDQUFDLEVBQUU7NEJBQzFCLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt5QkFDcEQ7d0JBQ0QsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFDLEtBQUssRUFBQyxFQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBQyxFQUFDLENBQUMsQ0FBQzt3QkFDdkUsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO3dCQUNoQixJQUFHLENBQUMsQ0FBQSxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBRyxDQUFDLENBQUMsRUFBRTs0QkFDdkIsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3lCQUN6Qzt3QkFFRCxDQUFDLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQTt3QkFDakMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7d0JBQ2pCLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDZDs7d0JBQU0sT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNyQjtZQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7UUFDUCxDQUFDO0tBQUE7SUFFRCw0R0FBNEc7SUFDdEcsa0JBQWtCLENBQUMsSUFBSSxHQUFDLEVBQUUsRUFBQyxPQUFPLEdBQUMsRUFBRTs7WUFDdkMsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ2QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUNsQixJQUFJO29CQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBQyxHQUFHLEVBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztpQkFBQztnQkFBQyxXQUFNLEdBQUU7WUFDcEQsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDZixJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFDO2dCQUNoQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUMsR0FBRyxFQUFDLElBQUksRUFBQyxDQUFDLENBQUM7Z0JBQzdELElBQUcsQ0FBQSxNQUFNLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBRyxDQUFDLEVBQUU7b0JBQ3hCLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO3dCQUN0QixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsQixDQUFDLENBQUMsQ0FBQztpQkFDTjthQUNKO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDakIsQ0FBQztLQUFBO0lBRUQsNEdBQTRHO0lBQ3RHLG9CQUFvQixDQUFDLElBQUksR0FBQyxFQUFFLEVBQUMsU0FBUyxHQUFDLEVBQUU7O1lBQzNDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7Z0JBQzdDLFNBQVMsRUFBQyxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUM7YUFDOUIsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ2YsSUFBRyxDQUFBLE1BQU0sS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFHLENBQUMsRUFBRTtnQkFDeEIsTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7b0JBQ3RCLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLENBQUMsQ0FBQyxDQUFDO2FBQ047WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDO0tBQUE7SUFFSyxpQkFBaUIsQ0FBQyxJQUFlLEVBQUUsU0FBWSxFQUFFLE9BQXdCLEVBQUUsVUFBMkI7O1lBQ3hHLElBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ3JCLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDZixTQUFTLENBQUMsT0FBTyxDQUNiLENBQUMsR0FBRyxFQUFDLEVBQUU7b0JBQ0gsSUFBSSxDQUFDLEdBQUcsRUFBQyxHQUFHLEVBQUMsQ0FBQztvQkFDZCxJQUFHLE9BQU87d0JBQUcsQ0FBUyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7b0JBQ3pDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLENBQUMsQ0FBQyxDQUFBO2dCQUNOLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDZixJQUFHLENBQUMsVUFBVSxFQUFFO29CQUNaLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBTyxJQUFJLEVBQUUsRUFBRTt3QkFDL0QsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxHQUFHLEVBQUMsS0FBSyxFQUFDLENBQUMsQ0FBQzt3QkFFOUQsSUFBRyxDQUFBLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFHLENBQUMsRUFBRTs0QkFDekIsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDOzRCQUNsQixJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7NEJBQ3JCLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFPLENBQUMsRUFBRSxFQUFFO2dDQUM3QixJQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxXQUFXLEtBQUssQ0FBQyxDQUFDLE9BQU8sRUFBRTtvQ0FDN0gsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQztvQ0FDL0MsV0FBVyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7aUNBQzNCO2dDQUNELElBQUcsTUFBTTtvQ0FBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUM3QixDQUFDLENBQUEsQ0FBQyxDQUFBO3lCQUNMO29CQUNMLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQztpQkFDUDtxQkFDSTtvQkFDRCxJQUFJLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLEdBQUcsRUFBQyxLQUFLLEVBQUMsQ0FBQyxDQUFDO29CQUVoRSxJQUFHLENBQUEsTUFBTSxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUcsQ0FBQyxFQUFFO3dCQUN6QixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUM7d0JBQ2xCLElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQzt3QkFDckIsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQU8sQ0FBQyxFQUFFLEVBQUU7NEJBQzdCLElBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLFdBQVcsS0FBSyxDQUFDLENBQUMsT0FBTyxFQUFFO2dDQUM3SCxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUMvQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQzs2QkFDM0I7NEJBQ0QsSUFBRyxNQUFNO2dDQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzdCLENBQUMsQ0FBQSxDQUFDLENBQUE7cUJBQ0w7aUJBQ1I7Z0JBQ0QsT0FBTyxLQUFLLENBQUM7YUFDaEI7UUFDTCxDQUFDO0tBQUE7SUFFRCw4REFBOEQ7SUFDeEQsWUFBWSxDQUFDLElBQWUsRUFBRSxVQUEyQixFQUFFLE9BQXdCLEVBQUUsT0FBbUIsRUFBRSxFQUFFLEtBQUssR0FBQyxDQUFDLEVBQUUsSUFBSSxHQUFDLENBQUM7O1lBQzdILElBQUksQ0FBQyxPQUFPO2dCQUFFLE9BQU8sR0FBRyxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsT0FBTyxDQUFBLENBQUMsMkVBQTJFO1lBQ2pILElBQUksSUFBSSxDQUFDLEdBQUc7Z0JBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBRS9DLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNqQixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO1lBQ3JCLElBQUcsQ0FBQyxVQUFVLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJO2dCQUFFLE9BQU8sRUFBRSxDQUFDO2lCQUMxQyxJQUFHLENBQUMsVUFBVSxJQUFJLE9BQU8sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDO2dCQUFFLE9BQU8sTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUNqSCxJQUFHLENBQUMsSUFBSSxJQUFJLE9BQU8sRUFBRTtnQkFDdEIsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUYsSUFBRyxLQUFLLEdBQUcsQ0FBQztvQkFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsQyxJQUFHLENBQUEsTUFBTSxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUcsQ0FBQyxFQUFFO29CQUN6QixNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBTyxDQUFDLEVBQUUsRUFBRTt3QkFDN0IsSUFBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUksV0FBVyxLQUFLLENBQUMsQ0FBQyxPQUFPLEVBQUU7NEJBQzdILE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQy9DLFdBQVcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO3lCQUMzQjt3QkFDRCxJQUFHLE1BQU0sS0FBSyxJQUFJOzRCQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3hDLENBQUMsQ0FBQSxDQUFDLENBQUM7aUJBQ047YUFDSjtpQkFBTSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxPQUFPLEVBQUU7Z0JBQ2hELElBQUksS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxpQkFBRSxPQUFPLEVBQUMsT0FBTyxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUNwRixJQUFHLEtBQUs7b0JBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNqQztpQkFBTSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLDZDQUE2QztnQkFDaEcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFPLElBQUksRUFBRSxFQUFFO29CQUMvRCxJQUFJLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDekQsSUFBRyxLQUFLLEVBQUU7d0JBQ04sSUFBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssS0FBSyxDQUFDLE9BQU8sSUFBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssS0FBSyxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUksV0FBVyxLQUFLLEtBQUssQ0FBQyxPQUFPLEVBQUU7NEJBQzFJLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ25ELFdBQVcsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO3lCQUMvQjt3QkFDRCxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUNwQixPQUFNO3FCQUNUO2dCQUNMLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQzthQUNQO1lBQ0QsSUFBRyxDQUFDLE1BQU07Z0JBQUUsT0FBTyxFQUFFLENBQUM7WUFDdEIsT0FBTyxPQUFPLENBQUM7UUFDbkIsQ0FBQztLQUFBO0lBRUssbUJBQW1CLENBQUMsSUFBZSxFQUFDLE9BQU8sRUFBQyxRQUFRLEdBQUMsRUFBRTs7WUFDekQsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBRWpCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQztZQUNsQixJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFDbkIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFPLElBQUksRUFBQyxDQUFDLEVBQUUsRUFBRTtnQkFDakUsSUFBRyxNQUFNLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ3JDLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLE9BQU8sRUFBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDO29CQUM5RCxJQUFJLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDakMsS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTt3QkFDM0IsSUFBSSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ2pDLElBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLE9BQU8sSUFBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssT0FBTyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxTQUFTLEtBQUssT0FBTyxFQUFFOzRCQUN0SCxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFDLE1BQU0sQ0FBQyxDQUFDOzRCQUNwRCxxQkFBcUI7NEJBQ3JCLFNBQVMsR0FBRyxPQUFPLENBQUM7eUJBQ3ZCO3dCQUNELHFEQUFxRDt3QkFDckQsSUFBRyxNQUFNOzRCQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQ25DO2lCQUVKO1lBQ0wsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBRyxDQUFDLE1BQU07Z0JBQUUsT0FBTyxFQUFFLENBQUM7WUFDdEIsdUJBQXVCO1lBQ3ZCLCtCQUErQjtZQUMvQixPQUFPLE9BQU8sQ0FBQztRQUNuQixDQUFDO0tBQUE7SUFFRCxvRUFBb0U7SUFDOUQsa0JBQWtCLENBQUMsSUFBZSxFQUFDLFVBQVUsR0FBQyxFQUFFOztZQUNsRCxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDakIsOEJBQThCO1lBQzlCLElBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ25CLElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQztnQkFDckIsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFPLEdBQUcsRUFBQyxFQUFFO29CQUM1QixJQUFHLEdBQUcsQ0FBQyxVQUFVLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRTt3QkFDMUIsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxDQUFDO3dCQUM1RixJQUFHLE1BQU0sRUFBRTs0QkFDUCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUM7NEJBQ2xCLElBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLE1BQU0sQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLE1BQU0sQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLFdBQVcsS0FBSyxNQUFNLENBQUMsT0FBTyxFQUFFO2dDQUM1SSxJQUFJLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUMsTUFBTSxDQUFDLENBQUM7Z0NBQ3hELFdBQVcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDOzZCQUNoQzs0QkFDRCxJQUFHLE1BQU0sS0FBSyxJQUFJLEVBQUU7Z0NBQ2hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7NkJBQ3hCO3lCQUNKO3FCQUNKO2dCQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7YUFDTjtZQUNELE9BQU8sT0FBTyxDQUFDO1FBQ25CLENBQUM7S0FBQTtJQUVLLHNCQUFzQixDQUFDLElBQWUsRUFBQyxPQUFPLEdBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEdBQUMsRUFBRTs7WUFDcEUsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ2YsSUFBRyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRztnQkFDckIsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFDLE9BQU8sRUFBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDO2dCQUM5RSxJQUFHLENBQUEsTUFBTSxNQUFNLENBQUMsS0FBSyxJQUFHLENBQUMsRUFBRTtvQkFDdkIsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7d0JBQ3ZCLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQ2pCLENBQUMsQ0FBQyxDQUFDO2lCQUNOO2FBQ0o7O2dCQUNJLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLEVBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RILElBQUcsSUFBSSxDQUFDLEdBQUcsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFO2dCQUM5QixJQUFJLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFELElBQUcsQ0FBQyxNQUFNO29CQUFFLE9BQU8sU0FBUyxDQUFDO2FBQ2hDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFFakIsQ0FBQztLQUFBO0lBRUssY0FBYyxDQUFDLElBQWUsRUFBRSxNQUFNLEdBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLEdBQUMsRUFBRTs7WUFDN0QsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLElBQUcsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUc7Z0JBQ3RCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUMsRUFBQyxJQUFJLEVBQUMsQ0FBQyxNQUFNLENBQUMsRUFBQyxFQUFDLENBQUMsQ0FBQztnQkFDNUUsSUFBRyxDQUFBLE1BQU0sTUFBTSxDQUFDLEtBQUssSUFBRyxDQUFDLEVBQUU7b0JBQ3ZCLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO3dCQUN2QixNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUNsQixDQUFDLENBQUMsQ0FBQztpQkFDTjthQUNKO2lCQUNJO2dCQUNELElBQUk7b0JBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBQyxHQUFHLEVBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBQyxFQUFDLElBQUksRUFBQyxDQUFDLE1BQU0sQ0FBQyxFQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQUM7Z0JBQUMsV0FBTSxHQUFFO2FBQ2xJO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDbEIsQ0FBQztLQUFBO0lBRUQseUJBQXlCO0lBQ25CLGVBQWUsQ0FBQyxJQUFlLEVBQUMsVUFBVSxHQUFDLEVBQUU7O1lBQy9DLGdCQUFnQjtZQUNoQixJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFFakIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBTyxHQUFHLEVBQUUsRUFBRTtnQkFFM0MsSUFBSTtvQkFDQSxJQUFJLEdBQUcsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO29CQUMvQixJQUFJLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDO29CQUNyRSxJQUFHLE1BQU0sRUFBRTt3QkFDUCxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNyQixJQUFJLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBQyxNQUFNLEVBQUMsRUFBQyxVQUFVLEVBQUMsR0FBRyxDQUFDLFVBQVUsRUFBQyxFQUFFLEVBQUMsR0FBRyxDQUFDLEdBQUcsRUFBQyxFQUFDLENBQUMsQ0FBQzt3QkFDeEgsSUFBSSxLQUFLLEdBQUcsTUFBTSxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ3hDLEtBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7NEJBQzNCLElBQUksSUFBSSxHQUFHLE1BQU0sYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDOzRCQUN0QyxJQUFHLElBQUk7Z0NBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzt5QkFDL0I7cUJBQ0o7aUJBQ0o7Z0JBQUMsV0FBTSxHQUFFO1lBRWQsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO1lBQ3RCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQU8sTUFBTSxFQUFDLENBQUMsRUFBQyxFQUFFOztnQkFDNUMsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDO2dCQUNsQixJQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxNQUFNLENBQUMsT0FBTyxLQUFJLE1BQUEsSUFBSSxDQUFDLFNBQVMsMENBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFBLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssWUFBWSxFQUFFO29CQUM5SSxZQUFZLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztvQkFDOUIsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUMsT0FBTyxDQUFDLENBQUM7aUJBQ2hFO2dCQUNELElBQUcsTUFBTSxFQUFFO29CQUNQLHNCQUFzQjtvQkFDdEIsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUMsR0FBRyxFQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxDQUFDO29CQUN0RiwwQ0FBMEM7b0JBQzFDLElBQUcsTUFBTSxDQUFDLEtBQUssRUFBRTt3QkFDYixNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBQyxFQUFFOzRCQUN4QixJQUFHLEdBQUcsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsS0FBSyxNQUFNLENBQUMsT0FBTztnQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUMsU0FBUyxFQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDakcsQ0FBQyxDQUFDLENBQUM7cUJBQ047b0JBQ0QsSUFBRyxNQUFNLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxHQUFHLEVBQUU7d0JBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztxQkFDNUQ7aUJBQ0o7WUFDTCxDQUFDLENBQUEsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0tBQUE7SUFFRCw0REFBNEQ7SUFDdEQsZUFBZSxDQUFDLElBQWUsRUFBQyxNQUFNOztZQUV4QyxJQUFHLElBQUksQ0FBQyxHQUFHLEtBQUssTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRTtnQkFDeEYsSUFBSSxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ3RFLElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBQyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzNELElBQUcsQ0FBQyxNQUFNO29CQUFFLE9BQU8sS0FBSyxDQUFDO2FBQzVCO1lBRUQsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFFaEUsSUFBRyxJQUFJLENBQUMsR0FBRyxLQUFLLE1BQU07Z0JBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFDLFNBQVMsRUFBQyxNQUFNLENBQUMsQ0FBQztZQUVyRSwwREFBMEQ7WUFDMUQsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztLQUFBO0lBRUssZ0JBQWdCLENBQUMsSUFBZSxFQUFDLE9BQU87O1lBQzFDLElBQUksQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZGLElBQUcsQ0FBQyxFQUFFO2dCQUNGLElBQUcsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUc7b0JBQy9GLElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBQyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzNELElBQUcsQ0FBQyxNQUFNO3dCQUFFLE9BQU8sS0FBSyxDQUFDO2lCQUM1QjtnQkFDRCxJQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUU7b0JBQ1IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNwRjtnQkFDRCxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLEVBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDaEYsT0FBTyxJQUFJLENBQUM7YUFDZjs7Z0JBQU0sT0FBTyxLQUFLLENBQUM7UUFDeEIsQ0FBQztLQUFBO0lBR0ssd0JBQXdCLENBQUMsSUFBZSxFQUFDLE1BQU07O1lBQ2pELElBQUksQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzlGLElBQUcsQ0FBQyxFQUFFO2dCQUNGLElBQUcsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUU7b0JBQzlGLElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBQyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzNELElBQUcsQ0FBQyxNQUFNO3dCQUFFLE9BQU8sS0FBSyxDQUFDO2lCQUM1QjtnQkFDRCxJQUFHLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRTtvQkFDbkIsSUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUs7d0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyw0QkFBNEI7b0JBQ2pJLElBQUcsQ0FBQyxDQUFDLFlBQVksS0FBSyxJQUFJLENBQUMsR0FBRzt3QkFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsWUFBWSxFQUFDLFNBQVMsRUFBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7eUJBQy9FLElBQUksQ0FBQyxDQUFDLFlBQVksS0FBSyxJQUFJLENBQUMsR0FBRzt3QkFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsWUFBWSxFQUFDLFNBQVMsRUFBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQzdGO2dCQUNELE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN4RixPQUFPLElBQUksQ0FBQzthQUNmOztnQkFBTSxPQUFPLEtBQUssQ0FBQztRQUN4QixDQUFDO0tBQUE7SUFFSyxnQkFBZ0IsQ0FBQyxJQUFlLEVBQUUsVUFBVSxFQUFFLElBQUksR0FBQyxJQUFJLENBQUMsSUFBSTs7WUFDOUQsK0VBQStFO1lBQy9FLGlIQUFpSDtZQUVqSDs7Ozs7Ozs7Ozs7Ozs7ZUFjRztZQUVILElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUNYLElBQUcsSUFBSSxLQUFLLE9BQU8sRUFBRTtnQkFDakIsRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLDBDQUEwQztnQkFDN0csRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQzthQUNyRTtpQkFBTTtnQkFDSCxFQUFFLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUMsRUFBQyxLQUFLLEVBQUMsVUFBVSxDQUFDLFlBQVksRUFBQyxDQUFDLENBQUM7Z0JBQy9ELEVBQUUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBQyxFQUFDLEtBQUssRUFBQyxVQUFVLENBQUMsWUFBWSxFQUFDLENBQUMsQ0FBQzthQUNsRTtZQUVELElBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUFFLE9BQU8sS0FBSyxDQUFDLENBQUMsaUJBQWlCO1lBRTlDLElBQUcsVUFBVSxDQUFDLFlBQVksS0FBSyxFQUFFLENBQUMsR0FBRztnQkFBRSxVQUFVLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDeEUsSUFBRyxVQUFVLENBQUMsWUFBWSxLQUFLLEVBQUUsQ0FBQyxHQUFHO2dCQUFFLFVBQVUsQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUV4RSxJQUFHLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRTtnQkFDM0IsSUFBRyxFQUFFLENBQUMsUUFBUTtvQkFBRSxVQUFVLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUM7cUJBQ25ELElBQUksRUFBRSxDQUFDLEtBQUs7b0JBQUUsVUFBVSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDO2FBQzNEO1lBQ0QsSUFBRyxDQUFDLFVBQVUsQ0FBQyxjQUFjLEVBQUU7Z0JBQzNCLElBQUcsRUFBRSxDQUFDLFFBQVE7b0JBQUUsVUFBVSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDO3FCQUNuRCxJQUFJLEVBQUUsQ0FBQyxLQUFLO29CQUFFLFVBQVUsQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQzthQUMzRDtZQUVELDBCQUEwQjtZQUUxQixJQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxVQUFVLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxVQUFVLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssVUFBVSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsR0FBRyxLQUFLLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRTtnQkFDcE0sSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFDLFVBQVUsRUFBQyxPQUFPLENBQUMsQ0FBQztnQkFDcEUsSUFBRyxDQUFDLE1BQU07b0JBQUUsT0FBTyxLQUFLLENBQUM7YUFDNUI7WUFFRCxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7WUFFZixJQUFHLElBQUksS0FBSyxPQUFPLEVBQUM7Z0JBQ2hCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQ2pELEVBQUUsSUFBSSxFQUFFLENBQUUsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLFlBQVksRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBRSxFQUFFLENBQ3JHLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUN2QixNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ3ZDO2FBQ0o7aUJBQU07Z0JBQ0gsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUMsRUFBQyxZQUFZLEVBQUMsVUFBVSxDQUFDLFlBQVksRUFBQyxDQUFDLENBQUM7Z0JBQ2xGLElBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDakIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFO3dCQUNYLElBQUcsQ0FBQyxDQUFDLFlBQVksS0FBSyxVQUFVLENBQUMsWUFBWTs0QkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNqRSxDQUFDLENBQUMsQ0FBQztpQkFDTjthQUNKO1lBRUQsSUFBSSxZQUFZLENBQUM7WUFDakIsSUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNyQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQU8sSUFBSSxFQUFFLEVBQUU7b0JBQ3pCLElBQUcsSUFBSSxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsbUJBQW1CO3dCQUMvQyw0RUFBNEU7cUJBQy9FO3lCQUFNLEVBQUUsa0VBQWtFO3dCQUN2RSxJQUFHLFVBQVUsQ0FBQyxZQUFZLEtBQUssSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLGdDQUFnQzs0QkFDdkUsSUFBSSxDQUFDLGNBQWMsR0FBRyxVQUFVLENBQUMsY0FBYyxDQUFDLENBQUMsMkJBQTJCOzRCQUM1RSxJQUFJLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQywyQkFBMkI7NEJBQ2xFLElBQUksQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQzs0QkFDcEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDOzRCQUNsQyxrQ0FBa0M7NEJBQ2xDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDOzRCQUNyQixVQUFVLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLGdEQUFnRDt5QkFDL0U7NkJBQU0sRUFBRSw0QkFBNEI7NEJBQ2pDLFVBQVUsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLDJCQUEyQjs0QkFDNUUsVUFBVSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsMkJBQTJCOzRCQUNsRSxVQUFVLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7NEJBQ3BDLFVBQVUsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzs0QkFDbEMsa0NBQWtDOzRCQUNsQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQzs0QkFDckIsVUFBVSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxnREFBZ0Q7eUJBQy9FO3dCQUNELFVBQVUsQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUNsRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQzt3QkFDbEQsWUFBWSxHQUFHLElBQUksQ0FBQzt3QkFDcEIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQzVDLElBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUU7NEJBQzVCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQzs0QkFDaEIsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUUsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLFlBQVksRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUUsRUFBRSxFQUFFLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7eUJBQ3pOOzZCQUFNOzRCQUNILElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7eUJBQzNCO3FCQUNKO2dCQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7YUFDTjtZQUdELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ2xELElBQUcsSUFBSSxLQUFJLE9BQU8sRUFBRTtnQkFDaEIsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDO2dCQUNoQixNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBRSxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsWUFBWSxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLFlBQVksRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBRSxFQUFFLEVBQUUsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLEVBQUUsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQzthQUMvTjtpQkFBTTtnQkFDSCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzNCO1lBRUQsSUFBRyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFO2dCQUN6RCxJQUFJLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hGLElBQUcsWUFBWSxFQUFFO29CQUNiLFVBQVUsQ0FBQyxHQUFHLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDN0MsSUFBRyxZQUFZLEVBQUU7d0JBQ2IsSUFBSSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUMsSUFBSSxFQUFFLENBQUUsRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLFlBQVksRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLFlBQVksQ0FBQyxZQUFZLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUUsRUFBRSxDQUFDLENBQUM7d0JBQ2pOLElBQUcsU0FBUyxFQUFFOzRCQUNWLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDOzRCQUM1QyxPQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7NEJBQ3JCLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFFLEVBQUUsWUFBWSxFQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxTQUFTLENBQUMsWUFBWSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFFLEVBQUUsRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUMsRUFBRSxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDOzRCQUM5TixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7eUJBQ3hDO3FCQUNKO2lCQUNKO2FBQ0o7WUFFRCxPQUFPLFVBQVUsQ0FBQyxDQUFDLGlEQUFpRDtRQUN4RSxDQUFDO0tBQUE7SUFHSyxrQkFBa0IsQ0FDcEIsSUFBc0MsRUFDdEMsTUFBTSxFQUNOLE9BQU8sR0FBQyxNQUFNLEVBQUUsU0FBUztJQUN6QixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUk7OztZQUVoQjs7Y0FFRTtZQUNGLHFCQUFxQjtZQUNyQixJQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTTtnQkFBRSxPQUFPLEtBQUssQ0FBQztZQUVsQyxJQUFHLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtnQkFDekIsSUFBRyxNQUFNLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxHQUFHLEVBQUU7b0JBQzVCLElBQUcsTUFBQyxJQUFzQixDQUFDLFNBQVMsMENBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFO3FCQUVoRTs7d0JBQ0ksT0FBTyxJQUFJLENBQUM7aUJBQ3BCO2FBQ0o7aUJBQU0sSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7Z0JBQ2pDLElBQUcsTUFBTSxDQUFDLE9BQU8sS0FBSyxJQUFJLEVBQUU7b0JBQ3hCLE9BQU8sSUFBSSxDQUFDO2lCQUNmOztvQkFDSSxJQUFJLEdBQUcsRUFBQyxHQUFHLEVBQUMsSUFBSSxFQUFDLENBQUM7YUFDMUI7WUFFRCxJQUFJLEtBQUssRUFBRSxLQUFLLENBQUM7WUFDakIsSUFBRyxJQUFJLEtBQUssT0FBTyxFQUFFO2dCQUNqQixLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUMsR0FBRyxFQUFFLENBQUMsRUFBQyxZQUFZLEVBQUMsSUFBSSxDQUFDLEdBQUcsRUFBQyxZQUFZLEVBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUMsSUFBSSxDQUFDLEdBQUcsRUFBQyxFQUFDLEVBQUMsWUFBWSxFQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUMsWUFBWSxFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDck4sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUMsWUFBWSxFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUMsWUFBWSxFQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUMsRUFBQyxFQUFDLFlBQVksRUFBQyxNQUFNLENBQUMsT0FBTyxFQUFDLFlBQVksRUFBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBQyxNQUFNLENBQUMsT0FBTyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7YUFDcE87aUJBQ0k7Z0JBQ0QsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLEVBQUMsT0FBTyxFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO29CQUN0RSxJQUFHLENBQUMsQ0FBQyxZQUFZLEtBQU0sSUFBWSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsWUFBWSxLQUFLLE1BQU0sQ0FBQyxPQUFPO3dCQUFFLE9BQU8sSUFBSSxDQUFDO2dCQUM5RixDQUFDLENBQUMsQ0FBQztnQkFDSCxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsRUFBQyxPQUFPLEVBQUMsTUFBTSxDQUFDLE9BQU8sRUFBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7b0JBQzVFLElBQUcsQ0FBQyxDQUFDLFlBQVksS0FBTSxJQUFZLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxZQUFZLEtBQUssTUFBTSxDQUFDLE9BQU87d0JBQUUsT0FBTyxJQUFJLENBQUM7Z0JBQzlGLENBQUMsQ0FBQyxDQUFDO2FBQ047WUFDQSxJQUFHLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUNsQiwwREFBMEQ7Z0JBQzFELE9BQU8sS0FBSyxDQUFDO2FBQ2hCO1lBRUQ7Ozs7OztjQU1FO1lBRUYsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBRW5CLElBQUcsS0FBSyxDQUFDLE1BQU0sS0FBSyxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxNQUFNLEVBQUU7Z0JBQ25ELElBQUcsTUFBTSxDQUFDLFVBQVUsS0FBSyxPQUFPLEVBQUU7b0JBQzlCLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksR0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDOzt3QkFDakksTUFBTSxHQUFHLEtBQUssQ0FBQztpQkFDdkI7cUJBQ0ksSUFBRyxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQUUsTUFBTSxHQUFHLElBQUksQ0FBQztxQkFDakgsSUFBRyxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQUUsTUFBTSxHQUFHLElBQUksQ0FBQztxQkFDekcsSUFBRyxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQUUsTUFBTSxHQUFHLElBQUksQ0FBQztxQkFDL0csSUFBSSxDQUFBLE1BQUEsS0FBSyxDQUFDLFNBQVMsMENBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBRyxDQUFDLENBQUMsSUFBSSxDQUFBLE1BQUEsS0FBSyxDQUFDLFNBQVMsMENBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBRyxDQUFDLENBQUM7b0JBQUUsTUFBTSxHQUFHLElBQUksQ0FBQztxQkFDMUcsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLE9BQU8sS0FBSyxPQUFPO29CQUFFLE1BQU0sR0FBRyxLQUFLLENBQUM7Z0JBQzlILGdCQUFnQjthQUNuQjtZQUVELHdEQUF3RDtZQUV4RCxPQUFPLE1BQU0sQ0FBQzs7S0FDakI7SUFXRCx5REFBeUQ7SUFFekQsMkdBQTJHO0lBQzNHLGtCQUFrQixDQUFFLE9BQU87UUFDdkIsSUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFDO1lBQ3RCLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDdkIsSUFBSSxRQUFRLEdBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFDLEVBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDO2dCQUNuRyxJQUFHLENBQUMsUUFBUSxJQUFJLENBQUEsUUFBUSxhQUFSLFFBQVEsdUJBQVIsUUFBUSxDQUFFLE1BQU0sTUFBSyxDQUFDLEVBQUU7b0JBQ3BDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBTyxLQUFLO2lCQUN6Qzs7b0JBQ0ksTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxXQUFXO1lBQ3BELENBQUMsQ0FBQyxDQUFBO1NBQ0w7YUFBTTtZQUNILElBQUksUUFBUSxHQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBQyxFQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQztZQUN0RyxJQUFHLENBQUMsUUFBUSxJQUFJLENBQUEsUUFBUSxhQUFSLFFBQVEsdUJBQVIsUUFBUSxDQUFFLE1BQU0sTUFBSyxDQUFDLEVBQUU7Z0JBQ3BDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBTyxLQUFLO2FBQzFDOztnQkFDSSxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVc7U0FDcEQ7SUFDTCxDQUFDO0lBRUQsWUFBWSxDQUFFLE9BQU87UUFFakIsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUN4QixJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDO1lBRXhCLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFBO1lBQ2pELElBQUcsQ0FBQyxVQUFVLEVBQUU7Z0JBQ1osVUFBVSxHQUFHLEVBQUUsQ0FBQTtnQkFDZixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUE7YUFDaEQ7WUFDRCxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUV6QixDQUFDLENBQUE7UUFFRCxJQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDdkIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFO2dCQUNqQixlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDdEIsQ0FBQyxDQUFDLENBQUM7U0FDTjs7WUFDSSxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDakMsQ0FBQztJQUVELDRJQUE0STtJQUM1SSxZQUFZLENBQUMsVUFBVSxFQUFFLEtBQU07UUFFM0IsY0FBYztRQUNkLElBQUksT0FBTyxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUM7UUFDeEIsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUM7WUFDMUIsT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUE7WUFDdkIsa0ZBQWtGO1lBQ2xGLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxDQUFBO1lBQzNELEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDYixLQUFLLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ3JCOztZQUFNLEtBQUssR0FBRyxLQUFLLENBQUE7UUFFcEIsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUs7WUFBRSxPQUFPLEVBQUUsQ0FBQztRQUV6RCxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBRyxDQUFDLFVBQVUsSUFBSSxDQUFDLE9BQU8sSUFBSSxHQUFHLENBQUMsRUFBRTtZQUNoQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFrQixFQUFFLEVBQUU7Z0JBQzNELENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFBLENBQUMsb0JBQW9CO2dCQUNwQyxJQUFHLENBQUMsR0FBRyxLQUFLLEtBQUssSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFO29CQUN6QyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUE7b0JBQ3BCLElBQUcsS0FBSzt3QkFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUNoQztxQkFDSTtvQkFDRCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO3dCQUNoQyxJQUFHLEdBQUcsSUFBSSxLQUFLLEVBQUU7NEJBQ2IsSUFBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssT0FBTyxFQUFFO2dDQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDOzZCQUN2Qjt5QkFDSjs2QkFDSSxJQUFHLE1BQU0sQ0FBQyxPQUFPLEtBQUssT0FBTyxFQUFFOzRCQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3lCQUN2QjtvQkFDTCxDQUFDLENBQUMsQ0FBQztpQkFDTjtZQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxNQUFNLENBQUM7U0FDakI7YUFDSTtZQUNELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsU0FBUyxDQUFBO1lBQzlDLElBQUcsQ0FBQyxDQUFDO2dCQUFFLE9BQU8sTUFBTSxDQUFDO1lBRXJCLElBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2pCLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsR0FBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUEsQ0FBQyxDQUFDLENBQUE7Z0JBQzVELE9BQU8sTUFBTSxDQUFDLENBQUMsNkJBQTZCO2FBQy9DO1lBRUQsSUFBRyxDQUFDLEdBQUcsS0FBSyxLQUFLLElBQUksR0FBRyxLQUFLLElBQUksQ0FBQyxJQUFJLEtBQUs7Z0JBQUUsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUEsQ0FBQyw0REFBNEQ7aUJBQ3BIO2dCQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7b0JBQ3pCLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDbkIsSUFBRyxHQUFHLElBQUksS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFFO3dCQUN6QixJQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxLQUFLOzRCQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQ2pEO3lCQUNJLElBQUcsT0FBTyxJQUFJLENBQUMsR0FBRyxFQUFFO3dCQUNyQixJQUFHLE1BQU0sQ0FBQyxPQUFPLEtBQUssT0FBTzs0QkFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3FCQUN0RDt5QkFDSSxJQUFJLE9BQU8sSUFBSSxHQUFHLElBQUksS0FBSyxFQUFFO3dCQUM5QixJQUFHLE1BQU0sQ0FBQyxPQUFPLEtBQUssT0FBTyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTs0QkFDMUMsSUFBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSztnQ0FBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3lCQUNqRDtxQkFDSjtnQkFDTCxDQUFDLENBQUMsQ0FBQzthQUNOO1NBQ0o7UUFDRCxPQUFPLE1BQU0sQ0FBQyxDQUE0Qiw0QkFBNEI7SUFDMUUsQ0FBQztJQUdELGVBQWUsQ0FBQyxNQUFNO1FBQ2xCLElBQUcsQ0FBQyxNQUFNO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBO1FBQ2xELElBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUc7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUVuRCw2QkFBNkI7UUFDN0IsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7WUFBRSxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDekcsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUdKO0FBRUQsZUFBZSxhQUFhLENBQUEifQ==