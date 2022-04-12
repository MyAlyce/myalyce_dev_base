import { __assign, __awaiter, __extends, __generator, __read, __spreadArray } from "tslib";
//Local and MongoDB database functions
//Users, user data, notifications, access controls
// Joshua Brewster, Garrett Flynn, AGPL v3.0
import ObjectID from "bson-objectid";
import { Service } from "../../router/Service";
import { randomId } from '../../common/id.utils';
// import * as mongoExtension from './mongoose.extension'
export var safeObjectID = function (str) {
    return (typeof str === 'string' && str.length === 24) ? ObjectID(str) : str;
};
var defaultCollections = [
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
var StructService = /** @class */ (function (_super) {
    __extends(StructService, _super);
    function StructService(Router, dbOptions, debug) {
        if (dbOptions === void 0) { dbOptions = {}; }
        if (debug === void 0) { debug = true; }
        var _this = _super.call(this, Router) || this;
        _this.name = 'structs';
        _this.collections = {};
        _this.wipeDB = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    //await this.collections.authorizations.instance.deleteMany({});
                    //await this.collections.groups.instance.deleteMany({});
                    return [4 /*yield*/, Promise.all(Object.values(this.collections).map(function (c) { return c.instance.deleteMany({}); }))];
                    case 1:
                        //await this.collections.authorizations.instance.deleteMany({});
                        //await this.collections.groups.instance.deleteMany({});
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        }); };
        _this.db = dbOptions === null || dbOptions === void 0 ? void 0 : dbOptions.db;
        _this.mode = (_this.db) ? ((dbOptions.mode) ? dbOptions.mode : 'local') : 'local';
        // JUST USE DB TO FILL IN COLLECTIONS
        // Get default collections
        if (!dbOptions.collections)
            dbOptions.collections = {};
        defaultCollections.forEach(function (k) {
            if (!dbOptions.collections[k]) {
                dbOptions.collections[k] = (_this.db) ? { instance: _this.db.collection(k) } : {};
                dbOptions.collections[k].reference = {};
            }
        });
        _this.collections = dbOptions.collections;
        // Overwrite Other Routes
        _this.routes = [
            {
                route: 'getUser',
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, struct, passed, groups, auths;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!(this.mode === 'mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.getMongoUser(u, args[0])];
                            case 1:
                                data = _a.sent();
                                return [3 /*break*/, 5];
                            case 2:
                                struct = this.getLocalData('user', { _id: args[0] });
                                if (!!struct) return [3 /*break*/, 3];
                                data = { user: {} };
                                return [3 /*break*/, 5];
                            case 3: return [4 /*yield*/, this.checkAuthorization(u, struct)];
                            case 4:
                                passed = _a.sent();
                                if (passed) {
                                    groups = this.getLocalData('group', { ownerId: args[0] });
                                    auths = this.getLocalData('authorization', { ownerId: args[0] });
                                    data = { user: struct, groups: groups, authorizations: auths };
                                }
                                else
                                    data = { user: {} };
                                _a.label = 5;
                            case 5: return [2 /*return*/, data];
                        }
                    });
                }); }
            },
            {
                route: 'setUser',
                aliases: ['addUser'],
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, passed;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!(this.mode === 'mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.setMongoUser(u, args[0])];
                            case 1:
                                data = _a.sent();
                                return [3 /*break*/, 4];
                            case 2: return [4 /*yield*/, this.checkAuthorization(u, args[0], 'WRITE')];
                            case 3:
                                passed = _a.sent();
                                if (passed)
                                    this.setLocalData(args[0]);
                                return [2 /*return*/, true];
                            case 4: return [2 /*return*/, data];
                        }
                    });
                }); }
            },
            {
                route: 'getUsersByIds',
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, struct;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!(this.mode === 'mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.getMongoUsersByIds(u, args[0])];
                            case 1:
                                data = _a.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                data = [];
                                if (Array.isArray(args[0])) {
                                    struct = this.getLocalData('user', { _id: args[0] });
                                    if (struct)
                                        data.push(struct);
                                }
                                _a.label = 3;
                            case 3: return [2 /*return*/, data];
                        }
                    });
                }); }
            },
            {
                route: 'getUsersByRoles',
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, profiles;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!this.mode.includes('mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.getMongoUsersByRoles(u, args[0])];
                            case 1:
                                data = _a.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                profiles = this.getLocalData('user');
                                data = [];
                                profiles.forEach(function (struct) {
                                    var _a;
                                    if ((_a = struct.userRoles) === null || _a === void 0 ? void 0 : _a.includes(args[0])) {
                                        data.push(struct);
                                    }
                                });
                                _a.label = 3;
                            case 3: return [2 /*return*/, data];
                        }
                    });
                }); }
            },
            {
                route: 'deleteUser',
                aliases: ['removeUser'],
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, struct, passed;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!(this.mode === 'mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.deleteMongoUser(u, args[0])];
                            case 1:
                                data = _a.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                data = false;
                                struct = this.getLocalData(args[0]);
                                if (struct) {
                                    passed = this.checkAuthorization(u, struct, 'WRITE');
                                    if (passed)
                                        data = this.deleteLocalData(struct);
                                }
                                _a.label = 3;
                            case 3: return [2 /*return*/, data];
                        }
                    });
                }); }
            },
            {
                route: 'setData',
                aliases: ['setMongoData'],
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, non_notes_1;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!this.mode.includes('mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.setMongoData(u, args)];
                            case 1:
                                data = _a.sent(); //input array of structs
                                return [3 /*break*/, 4];
                            case 2:
                                non_notes_1 = [];
                                data = [];
                                return [4 /*yield*/, Promise.all(args.map(function (structId) { return __awaiter(_this, void 0, void 0, function () {
                                        var struct, passed;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    struct = this.getLocalData(structId);
                                                    return [4 /*yield*/, this.checkAuthorization(u, struct, 'WRITE')];
                                                case 1:
                                                    passed = _a.sent();
                                                    if (passed) {
                                                        this.setLocalData(struct);
                                                        data.push(struct);
                                                        if (struct.structType !== 'notification')
                                                            non_notes_1.push(struct);
                                                    }
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); }))];
                            case 3:
                                _a.sent();
                                if (non_notes_1.length > 0)
                                    this.checkToNotify(u, non_notes_1, this.mode);
                                return [2 /*return*/, true];
                            case 4: return [2 /*return*/, data];
                        }
                    });
                }); }
            },
            {
                route: 'getData',
                aliases: ['getMongoData', 'getUserData'],
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, structs;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!this.mode.includes('mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.getMongoData(u, args[0], args[1], args[2], args[4], args[5])];
                            case 1:
                                data = _a.sent();
                                return [3 /*break*/, 4];
                            case 2:
                                data = [];
                                structs = void 0;
                                if (args[0])
                                    structs = this.getLocalData(args[0]);
                                if (structs && args[1])
                                    structs = structs.filter(function (o) { if (o.ownerId === args[1])
                                        return true; });
                                if (!structs) return [3 /*break*/, 4];
                                return [4 /*yield*/, Promise.all(structs.map(function (s) { return __awaiter(_this, void 0, void 0, function () {
                                        var struct, passed;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    struct = this.getLocalData(s._id);
                                                    return [4 /*yield*/, this.checkAuthorization(u, struct)];
                                                case 1:
                                                    passed = _a.sent();
                                                    if (passed)
                                                        data.push(struct);
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); }))];
                            case 3:
                                _a.sent();
                                _a.label = 4;
                            case 4: return [2 /*return*/, data];
                        }
                    });
                }); }
            },
            {
                route: 'getDataByIds',
                aliases: ['getMongoDataByIds', 'getUserDataByIds'],
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, structs;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!this.mode.includes('mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.getMongoDataByIds(u, args[0], args[1], args[2])];
                            case 1:
                                data = _a.sent();
                                return [3 /*break*/, 4];
                            case 2:
                                data = [];
                                structs = void 0;
                                if (args[2])
                                    structs = this.getLocalData(args[2]);
                                if (structs && args[1])
                                    structs = structs.filter(function (o) { if (o.ownerId === args[1])
                                        return true; });
                                if (!structs) return [3 /*break*/, 4];
                                return [4 /*yield*/, Promise.all(structs.map(function (s) { return __awaiter(_this, void 0, void 0, function () {
                                        var struct, passed;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    struct = this.getLocalData(s._id);
                                                    return [4 /*yield*/, this.checkAuthorization(u, struct)];
                                                case 1:
                                                    passed = _a.sent();
                                                    if (passed)
                                                        data.push(struct);
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); }))];
                            case 3:
                                _a.sent();
                                _a.label = 4;
                            case 4: return [2 /*return*/, data];
                        }
                    });
                }); }
            },
            {
                route: 'getAllData',
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, result;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!this.mode.includes('mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.getAllUserMongoData(u, args[0], args[1])];
                            case 1:
                                data = _a.sent();
                                return [3 /*break*/, 4];
                            case 2:
                                result = this.getLocalData(undefined, { ownerId: args[0] });
                                data = [];
                                return [4 /*yield*/, Promise.all(result.map(function (struct) { return __awaiter(_this, void 0, void 0, function () {
                                        var passed, passed;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    if (!args[1]) return [3 /*break*/, 3];
                                                    if (!(args[1].indexOf(struct.structType) < 0)) return [3 /*break*/, 2];
                                                    return [4 /*yield*/, this.checkAuthorization(u, struct)];
                                                case 1:
                                                    passed = _a.sent();
                                                    if (passed)
                                                        data.push(struct);
                                                    _a.label = 2;
                                                case 2: return [3 /*break*/, 5];
                                                case 3: return [4 /*yield*/, this.checkAuthorization(u, struct)];
                                                case 4:
                                                    passed = _a.sent();
                                                    if (passed)
                                                        data.push(struct);
                                                    _a.label = 5;
                                                case 5: return [2 /*return*/];
                                            }
                                        });
                                    }); }))];
                            case 3:
                                _a.sent();
                                _a.label = 4;
                            case 4: return [2 /*return*/, data];
                        }
                    });
                }); }
            },
            {
                route: 'deleteData',
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!this.mode.includes('mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.deleteMongoData(u, args)];
                            case 1:
                                data = _a.sent();
                                return [3 /*break*/, 4];
                            case 2:
                                data = false;
                                return [4 /*yield*/, Promise.all(args.map(function (structId) { return __awaiter(_this, void 0, void 0, function () {
                                        var struct, passed;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    struct = this.getLocalData(structId);
                                                    return [4 /*yield*/, this.checkAuthorization(u, struct, 'WRITE')];
                                                case 1:
                                                    passed = _a.sent();
                                                    if (passed)
                                                        this.deleteLocalData(struct);
                                                    data = true;
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); }))];
                            case 3:
                                _a.sent();
                                _a.label = 4;
                            case 4: return [2 /*return*/, data];
                        }
                    });
                }); }
            },
            {
                route: 'getGroup',
                aliases: ['getGroups'],
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, result;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!this.mode.includes('mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.getMongoGroups(u, args[0], args[1])];
                            case 1:
                                data = _a.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                if (typeof args[1] === 'string') {
                                    data = this.getLocalData('group', { _id: args[1] });
                                }
                                else {
                                    data = [];
                                    result = this.getLocalData('group');
                                    if (args[0]) {
                                        result.forEach(function (struct) {
                                            if (struct.users.includes(args[0]))
                                                data.push(struct);
                                        });
                                    }
                                    else {
                                        result.forEach(function (struct) {
                                            if (struct.users.includes(u._id))
                                                data.push(struct);
                                        });
                                    }
                                }
                                _a.label = 3;
                            case 3: return [2 /*return*/, data];
                        }
                    });
                }); }
            },
            {
                route: 'setGroup',
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                return [4 /*yield*/, this.setGroup(u, args[0], this.mode)];
                            case 1: return [2 /*return*/, _a.sent()];
                        }
                    });
                }); }
            },
            {
                route: 'deleteGroup',
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, struct, passed;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!this.mode.includes('mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.deleteMongoGroup(u, args[0])];
                            case 1:
                                data = _a.sent();
                                return [3 /*break*/, 5];
                            case 2:
                                struct = this.getLocalData('group', args[0]);
                                passed = false;
                                if (!struct) return [3 /*break*/, 4];
                                return [4 /*yield*/, this.checkAuthorization(u, struct, 'WRITE')];
                            case 3:
                                passed = _a.sent();
                                _a.label = 4;
                            case 4:
                                if (passed) {
                                    data = true;
                                }
                                _a.label = 5;
                            case 5: return [2 /*return*/, data];
                        }
                    });
                }); }
            },
            {
                route: 'setAuth',
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                return [4 /*yield*/, this.setAuthorization(u, args[0], this.mode)];
                            case 1: return [2 /*return*/, _a.sent()];
                        }
                    });
                }); }
            },
            {
                route: 'getAuths',
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, result;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!this.mode.includes('mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.getMongoAuthorizations(u, args[0], args[1])];
                            case 1:
                                data = _a.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                if (args[1]) {
                                    result = this.getLocalData('authorization', { _id: args[1] });
                                    if (result)
                                        data = [result];
                                }
                                else {
                                    data = this.getLocalData('authorization', { ownerId: args[0] });
                                }
                                _a.label = 3;
                            case 3: return [2 /*return*/, data];
                        }
                    });
                }); }
            },
            {
                route: 'deleteAuth',
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, struct, passed;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, false];
                                if (!this.mode.includes('mongo')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.deleteMongoAuthorization(u, args[0])];
                            case 1:
                                data = _a.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                data = true;
                                struct = this.getLocalData('authorization', { _id: args[0] });
                                if (struct) {
                                    passed = this.checkAuthorization(u, struct, 'WRITE');
                                    if (passed)
                                        data = this.deleteLocalData(struct);
                                }
                                return [2 /*return*/, data];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); }
            }
        ];
        return _this;
    }
    StructService.prototype.notificationStruct = function (parentStruct) {
        if (parentStruct === void 0) { parentStruct = {}; }
        var structType = 'notification';
        var struct = {
            structType: structType,
            timestamp: Date.now(),
            id: randomId(structType),
            note: '',
            ownerId: '',
            parentUserId: '',
            parent: { structType: parentStruct === null || parentStruct === void 0 ? void 0 : parentStruct.structType, _id: parentStruct === null || parentStruct === void 0 ? void 0 : parentStruct._id }, //where it belongs
        };
        return struct;
    };
    //when passing structs to be set, check them for if notifications need to be created
    //TODO: need to make this more flexible in the cases you DON'T want an update
    StructService.prototype.checkToNotify = function (user, structs, mode) {
        if (structs === void 0) { structs = []; }
        if (mode === void 0) { mode = this.mode; }
        return __awaiter(this, void 0, void 0, function () {
            var key, obj, usersToNotify, newNotifications, uid;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof user === 'string') {
                            for (key in this.router.USERS) {
                                obj = this.router.USERS[key];
                                if (obj._id === user)
                                    user = obj;
                            }
                        }
                        if (typeof user === 'string' || user == null)
                            return [2 /*return*/, false];
                        usersToNotify = {};
                        newNotifications = [];
                        structs.forEach(function (struct) { return __awaiter(_this, void 0, void 0, function () {
                            var newNotification, auths_1, s;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if ((user === null || user === void 0 ? void 0 : user._id) !== struct.ownerId) { //a struct you own being updated by another user
                                            newNotification = this.notificationStruct(struct);
                                            newNotification.id = 'notification_' + struct._id; //overwrites notifications for the same parent
                                            newNotification.ownerId = struct.ownerId;
                                            newNotification.note = struct.structType; //redundant now
                                            newNotification.parentUserId = struct.ownerId;
                                            newNotifications.push(newNotification);
                                            usersToNotify[struct.ownerId] = struct.ownerId;
                                        }
                                        if (!struct.users) return [3 /*break*/, 1];
                                        struct.users.forEach(function (usr) {
                                            if (usr !== user._id) {
                                                var newNotification = _this.notificationStruct(struct);
                                                newNotification.id = 'notification_' + struct._id; //overwrites notifications for the same parent
                                                newNotification.ownerId = usr;
                                                newNotification.note = struct.structType;
                                                newNotification.parentUserId = struct.ownerId;
                                                newNotifications.push(newNotification);
                                                usersToNotify[usr] = usr;
                                            }
                                        });
                                        return [3 /*break*/, 7];
                                    case 1:
                                        auths_1 = [];
                                        if (!(mode === 'mongo')) return [3 /*break*/, 5];
                                        s = this.collections.authorizations.instance.find({ $or: [{ authorizedId: user._id }, { authorizerId: user._id }] });
                                        return [4 /*yield*/, s.count()];
                                    case 2:
                                        if (!((_a.sent()) > 0)) return [3 /*break*/, 4];
                                        return [4 /*yield*/, s.forEach(function (d) { return auths_1.push(d); })];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4: return [3 /*break*/, 6];
                                    case 5:
                                        auths_1 = this.getLocalData('authorization', { authorizedId: user._id });
                                        auths_1.push.apply(auths_1, __spreadArray([], __read(this.getLocalData('authorization', { authorizerId: user._id })), false));
                                        _a.label = 6;
                                    case 6:
                                        if (auths_1.length > 0) {
                                            auths_1.forEach(function (auth) {
                                                if (struct.authorizerId === struct.ownerId && !usersToNotify[struct.authorizedId]) {
                                                    if (auth.status === 'OKAY' && auth.authorizations.indexOf('peer') > -1) {
                                                        var newNotification = _this.notificationStruct(struct);
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
                                        _a.label = 7;
                                    case 7: return [2 /*return*/];
                                }
                            });
                        }); });
                        if (!(newNotifications.length > 0)) return [3 /*break*/, 4];
                        if (!(mode === 'mongo')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.setMongoData(user, newNotifications)];
                    case 1:
                        _a.sent(); //set the DB, let the user get them 
                        return [3 /*break*/, 3];
                    case 2:
                        this.setLocalData(newNotifications);
                        _a.label = 3;
                    case 3:
                        // console.log(usersToNotify);
                        for (uid in usersToNotify) {
                            this.router.sendMsg(uid, 'notifications', true);
                        }
                        return [2 /*return*/, true];
                    case 4: return [2 /*return*/, false];
                }
            });
        });
    };
    StructService.prototype.setMongoData = function (user, structs) {
        if (structs === void 0) { structs = []; }
        return __awaiter(this, void 0, void 0, function () {
            var firstwrite, passed_1, checkedAuth_1, toReturn_1, non_notes_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        firstwrite = false;
                        if (!(structs.length > 0)) return [3 /*break*/, 5];
                        passed_1 = true;
                        checkedAuth_1 = '';
                        return [4 /*yield*/, Promise.all(structs.map(function (struct) { return __awaiter(_this, void 0, void 0, function () {
                                var copy;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!(((user === null || user === void 0 ? void 0 : user._id) !== struct.ownerId || (user._id === struct.ownerId && user.userRoles.includes('admin_control'))) && checkedAuth_1 !== struct.ownerId)) return [3 /*break*/, 2];
                                            return [4 /*yield*/, this.checkAuthorization(user, struct, 'WRITE')];
                                        case 1:
                                            passed_1 = _a.sent();
                                            checkedAuth_1 = struct.ownerId;
                                            _a.label = 2;
                                        case 2:
                                            if (!passed_1) return [3 /*break*/, 11];
                                            copy = JSON.parse(JSON.stringify(struct));
                                            if (copy._id)
                                                delete copy._id;
                                            if (!struct.id) return [3 /*break*/, 7];
                                            if (!struct.id.includes('defaultId')) return [3 /*break*/, 4];
                                            return [4 /*yield*/, this.db.collection(struct.structType).insertOne(copy)];
                                        case 3:
                                            _a.sent();
                                            firstwrite = true;
                                            return [3 /*break*/, 6];
                                        case 4: return [4 /*yield*/, this.db.collection(struct.structType).updateOne({ id: struct.id }, { $set: copy }, { upsert: true })];
                                        case 5:
                                            _a.sent(); //prevents redundancy in some cases (e.g. server side notifications)
                                            _a.label = 6;
                                        case 6: return [3 /*break*/, 11];
                                        case 7:
                                            if (!struct._id) return [3 /*break*/, 11];
                                            if (!struct._id.includes('defaultId')) return [3 /*break*/, 9];
                                            return [4 /*yield*/, this.db.collection(struct.structType).insertOne(copy)];
                                        case 8:
                                            _a.sent();
                                            firstwrite = true;
                                            return [3 /*break*/, 11];
                                        case 9: return [4 /*yield*/, this.db.collection(struct.structType).updateOne({ _id: safeObjectID(struct._id) }, { $set: copy }, { upsert: false })];
                                        case 10:
                                            _a.sent();
                                            _a.label = 11;
                                        case 11: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        if (!(firstwrite === true)) return [3 /*break*/, 3];
                        toReturn_1 = [];
                        return [4 /*yield*/, Promise.all(structs.map(function (struct, j) { return __awaiter(_this, void 0, void 0, function () {
                                var copy, pulled, comment, copy2, pulledComment, replyToId_1, replyTo, copy3, pulledReply_1, roomId_1, room_1, pulledRoom_1, i, i, toUpdate_1;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            copy = JSON.parse(JSON.stringify(struct));
                                            if (copy._id)
                                                delete copy._id;
                                            if (!(struct.structType !== 'comment')) return [3 /*break*/, 3];
                                            pulled = void 0;
                                            if (!(struct.structType !== 'notification')) return [3 /*break*/, 2];
                                            return [4 /*yield*/, this.db.collection(copy.structType).findOne(copy)];
                                        case 1:
                                            pulled = _a.sent();
                                            _a.label = 2;
                                        case 2:
                                            if (pulled) {
                                                pulled._id = pulled._id.toString();
                                                toReturn_1.push(pulled);
                                            }
                                            return [3 /*break*/, 13];
                                        case 3:
                                            if (!(struct.structType === 'comment')) return [3 /*break*/, 13];
                                            comment = struct;
                                            copy2 = JSON.parse(JSON.stringify(comment));
                                            if (copy2._id)
                                                delete copy2._id;
                                            return [4 /*yield*/, this.db.collection('comment').findOne(copy2)];
                                        case 4:
                                            pulledComment = _a.sent();
                                            replyToId_1 = comment.replyTo;
                                            replyTo = structs.find(function (s) {
                                                if (s._id === replyToId_1)
                                                    return true;
                                            });
                                            if (!replyTo) return [3 /*break*/, 12];
                                            copy3 = JSON.parse(JSON.stringify(replyTo));
                                            if (copy3._id)
                                                delete copy3._id;
                                            return [4 /*yield*/, Promise.all(['discussion', 'chatroom', 'comment'].map(function (name) { return __awaiter(_this, void 0, void 0, function () {
                                                    var found;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0: return [4 /*yield*/, this.db.collection(name).findOne({ _id: safeObjectID(replyToId_1) })];
                                                            case 1:
                                                                found = _a.sent();
                                                                if (found)
                                                                    pulledReply_1 = found;
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                }); }))];
                                        case 5:
                                            _a.sent();
                                            if (!pulledReply_1) return [3 /*break*/, 11];
                                            roomId_1 = comment.parent._id;
                                            if (!(roomId_1 !== replyToId_1)) return [3 /*break*/, 8];
                                            room_1 = structs.find(function (s) {
                                                if (s._id === roomId_1)
                                                    return true;
                                            });
                                            if (!room_1) return [3 /*break*/, 7];
                                            delete room_1._id;
                                            return [4 /*yield*/, Promise.all(['discussion', 'chatroom'].map(function (name) { return __awaiter(_this, void 0, void 0, function () {
                                                    var found;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0: return [4 /*yield*/, this.db.collection(name).findOne(room_1)];
                                                            case 1:
                                                                found = _a.sent();
                                                                if (found)
                                                                    pulledRoom_1 = found;
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                }); }))];
                                        case 6:
                                            _a.sent();
                                            _a.label = 7;
                                        case 7: return [3 /*break*/, 9];
                                        case 8:
                                            pulledRoom_1 = pulledReply_1;
                                            _a.label = 9;
                                        case 9:
                                            if (pulledReply_1) {
                                                i = pulledReply_1.replies.indexOf(comment._id);
                                                if (i > -1) {
                                                    pulledReply_1.replies[i] = pulledComment._id.toString();
                                                    pulledComment.replyTo = pulledReply_1._id.toString();
                                                }
                                            }
                                            if (pulledRoom_1) {
                                                i = pulledRoom_1.comments.indexOf(comment._id);
                                                if (i > -1) {
                                                    pulledRoom_1.comments[i] = pulledComment._id.toString();
                                                    pulledComment.parent._id = pulledRoom_1._id.toString();
                                                }
                                            }
                                            toUpdate_1 = [pulledComment, pulledReply_1];
                                            if (pulledRoom_1._id.toString() !== pulledReply_1._id.toString())
                                                toUpdate_1.push(pulledRoom_1);
                                            return [4 /*yield*/, Promise.all(toUpdate_1.map(function (s) { return __awaiter(_this, void 0, void 0, function () {
                                                    var copy;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0:
                                                                copy = JSON.parse(JSON.stringify(s));
                                                                delete copy._id;
                                                                return [4 /*yield*/, this.db.collection(s.structType).updateOne({ _id: safeObjectID(s._id) }, { $set: copy }, { upsert: false })];
                                                            case 1:
                                                                _a.sent();
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                }); }))];
                                        case 10:
                                            _a.sent();
                                            // console.log('pulled comment',pulledComment)
                                            // console.log('pulled replyTo',pulledReply)
                                            // console.log('pulled room',pulledRoom);
                                            __spreadArray([], __read(toReturn_1), false).reverse().forEach(function (s, j) {
                                                if (toUpdate_1.find(function (o) {
                                                    if (s._id.toString() === o._id.toString())
                                                        return true;
                                                })) {
                                                    toReturn_1.splice(toReturn_1.length - j - 1, 1); //pop off redundant
                                                }
                                            });
                                            toReturn_1.push.apply(toReturn_1, __spreadArray([], __read(toUpdate_1), false));
                                            _a.label = 11;
                                        case 11: return [3 /*break*/, 13];
                                        case 12:
                                            if (pulledComment) {
                                                toReturn_1.push(pulledComment);
                                            }
                                            _a.label = 13;
                                        case 13: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 2:
                        _a.sent();
                        this.checkToNotify(user, toReturn_1);
                        return [2 /*return*/, toReturn_1];
                    case 3:
                        non_notes_2 = [];
                        structs.forEach(function (s) {
                            if (s.structType !== 'notification')
                                non_notes_2.push(s);
                        });
                        this.checkToNotify(user, non_notes_2);
                        return [2 /*return*/, true];
                    case 4: return [3 /*break*/, 6];
                    case 5: return [2 /*return*/, false];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    StructService.prototype.setMongoUser = function (user, struct) {
        return __awaiter(this, void 0, void 0, function () {
            var passed, copy, _id, toFind;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!struct._id) return [3 /*break*/, 5];
                        if (!(user._id !== struct.ownerId || (user._id === struct.ownerId && user.userRoles.includes('admin_control')))) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.checkAuthorization(user, struct, 'WRITE')];
                    case 1:
                        passed = _a.sent();
                        if (!passed)
                            return [2 /*return*/, false];
                        _a.label = 2;
                    case 2:
                        copy = JSON.parse(JSON.stringify(struct));
                        if (copy._id)
                            delete copy._id;
                        if (this.router.DEBUG)
                            console.log('RETURNS PROFILE', struct);
                        _id = safeObjectID(struct._id);
                        toFind = (_id !== struct._id) ? { _id: _id } : { id: struct.id };
                        return [4 /*yield*/, this.collections.users.instance.updateOne(toFind, { $set: copy }, { upsert: true })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.collections.users.instance.findOne(toFind)];
                    case 4:
                        user = _a.sent();
                        this.checkToNotify(user, [struct]);
                        return [2 /*return*/, user];
                    case 5: return [2 /*return*/, false];
                }
            });
        });
    };
    StructService.prototype.setGroup = function (user, struct, mode) {
        if (struct === void 0) { struct = {}; }
        if (mode === void 0) { mode = this.mode; }
        return __awaiter(this, void 0, void 0, function () {
            var exists, passed, allusers_1, users_1, ids_1, cursor, admins_1, peers_1, clients_1, copy;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!struct._id) return [3 /*break*/, 17];
                        exists = undefined;
                        if (!(mode === 'mongo')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.collections.groups.instance.findOne({ name: struct.name })];
                    case 1:
                        exists = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        exists = this.getLocalData('group', { _id: struct._id });
                        _a.label = 3;
                    case 3:
                        if (exists && (exists.ownerId !== struct.ownerId || struct.admins.indexOf(user._id) < 0))
                            return [2 /*return*/, false]; //BOUNCE
                        if (!(user._id !== struct.ownerId)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.checkAuthorization(user, struct, 'WRITE')];
                    case 4:
                        passed = _a.sent();
                        if (!passed)
                            return [2 /*return*/, false];
                        _a.label = 5;
                    case 5:
                        allusers_1 = [];
                        struct.users.forEach(function (u) {
                            allusers_1.push({ email: u }, { id: u }, { username: u });
                        });
                        users_1 = [];
                        ids_1 = [];
                        if (!(mode === 'mongo')) return [3 /*break*/, 9];
                        cursor = this.collections.users.instance.find({ $or: allusers_1 });
                        return [4 /*yield*/, cursor.count()];
                    case 6:
                        if (!((_a.sent()) > 0)) return [3 /*break*/, 8];
                        return [4 /*yield*/, cursor.forEach(function (user) {
                                users_1.push(user);
                                ids_1.push(user._id);
                            })];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        allusers_1.forEach(function (search) {
                            var result = _this.getLocalData('user', search);
                            if (result.length > 0) {
                                users_1.push(result[0]);
                                ids_1.push(result[0]._id);
                            }
                        });
                        _a.label = 10;
                    case 10:
                        struct.users = ids_1;
                        admins_1 = [];
                        peers_1 = [];
                        clients_1 = [];
                        users_1.forEach(function (u) {
                            struct.admins.find(function (useridentifier, i) {
                                if (useridentifier === u._id || useridentifier === u.email || useridentifier === u.username || u._id === struct.ownerId) {
                                    if (admins_1.indexOf(u._id < 0))
                                        admins_1.push(u._id);
                                    return true;
                                }
                            });
                            struct.peers.find(function (useridentifier, i) {
                                if (useridentifier === u._id || useridentifier === u.email || useridentifier === u.username) {
                                    if (peers_1.indexOf(u._id < 0))
                                        peers_1.push(u._id);
                                    return true;
                                }
                            });
                            struct.clients.find(function (useridentifier, i) {
                                if (useridentifier === u._id || useridentifier === u.email || useridentifier === u.username) {
                                    if (clients_1.indexOf(u._id < 0))
                                        clients_1.push(u._id);
                                    return true;
                                }
                            });
                        });
                        struct.admins = admins_1;
                        struct.peers = peers_1;
                        struct.clients = clients_1;
                        copy = JSON.parse(JSON.stringify(struct));
                        if (copy._id)
                            delete copy._id;
                        if (!(mode === 'mongo')) return [3 /*break*/, 15];
                        if (!struct._id.includes('defaultId')) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.db.collection(struct.structType).insertOne(copy)];
                    case 11:
                        _a.sent();
                        return [3 /*break*/, 14];
                    case 12: return [4 /*yield*/, this.collections.groups.instance.updateOne({ _id: safeObjectID(struct._id) }, { $set: copy }, { upsert: true })];
                    case 13:
                        _a.sent();
                        _a.label = 14;
                    case 14: return [3 /*break*/, 16];
                    case 15:
                        this.setLocalData(struct);
                        _a.label = 16;
                    case 16:
                        this.checkToNotify(user, [struct], this.mode);
                        return [2 /*return*/, struct];
                    case 17: return [2 /*return*/, false];
                }
            });
        });
    };
    //
    StructService.prototype.getMongoUser = function (user, info, bypassAuth) {
        if (info === void 0) { info = ''; }
        if (bypassAuth === void 0) { bypassAuth = false; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                        var query, u, passed, authorizations_1, auths, gs, groups_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    query = [{ email: info }, { id: info }, { username: info }];
                                    try {
                                        query.push({ _id: safeObjectID(info) });
                                    }
                                    catch (e) { }
                                    return [4 /*yield*/, this.collections.users.instance.findOne({ $or: query })];
                                case 1:
                                    u = _a.sent();
                                    if (!(!u || u == null)) return [3 /*break*/, 2];
                                    resolve({});
                                    return [3 /*break*/, 12];
                                case 2:
                                    if (!u._id && u._id)
                                        u._id = u._id.toString();
                                    else if (!u._id && u._id)
                                        u._id = u._id;
                                    if (!u.ownerId)
                                        u.ownerId = u._id;
                                    if (!(u && bypassAuth === false)) return [3 /*break*/, 11];
                                    if (!(user._id !== u._id || (user._id === u._id && user.userRoles.includes('admin_control')))) return [3 /*break*/, 4];
                                    return [4 /*yield*/, this.checkAuthorization(user, u)];
                                case 3:
                                    passed = _a.sent();
                                    if (!passed)
                                        resolve(undefined);
                                    _a.label = 4;
                                case 4:
                                    authorizations_1 = [];
                                    auths = this.collections.authorizations.instance.find({ ownerId: u._id });
                                    return [4 /*yield*/, auths.count()];
                                case 5:
                                    if (!((_a.sent()) > 0)) return [3 /*break*/, 7];
                                    return [4 /*yield*/, auths.forEach(function (d) { return authorizations_1.push(d); })];
                                case 6:
                                    _a.sent();
                                    _a.label = 7;
                                case 7:
                                    gs = this.collections.groups.instance.find({ users: { $all: [u._id] } });
                                    groups_1 = [];
                                    return [4 /*yield*/, gs.count()];
                                case 8:
                                    if (!((_a.sent()) > 0)) return [3 /*break*/, 10];
                                    return [4 /*yield*/, gs.forEach(function (d) { return groups_1.push(d); })];
                                case 9:
                                    _a.sent();
                                    _a.label = 10;
                                case 10:
                                    u.authorizations = authorizations_1;
                                    u.groups = groups_1;
                                    resolve(u);
                                    return [3 /*break*/, 12];
                                case 11:
                                    resolve(u);
                                    _a.label = 12;
                                case 12: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    //safely returns the profile id, username, and email and other basic info based on the user role set applied
    StructService.prototype.getMongoUsersByIds = function (user, userIds) {
        if (user === void 0) { user = {}; }
        if (userIds === void 0) { userIds = []; }
        return __awaiter(this, void 0, void 0, function () {
            var usrs, found, users;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        usrs = [];
                        userIds.forEach(function (u) {
                            try {
                                usrs.push({ _id: safeObjectID(u) });
                            }
                            catch (_a) { }
                        });
                        found = [];
                        if (!(usrs.length > 0)) return [3 /*break*/, 3];
                        users = this.collections.users.instance.find({ $or: usrs });
                        return [4 /*yield*/, users.count()];
                    case 1:
                        if (!((_a.sent()) > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, users.forEach(function (u) {
                                found.push(u);
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, found];
                }
            });
        });
    };
    //safely returns the profile id, username, and email and other basic info based on the user role set applied
    StructService.prototype.getMongoUsersByRoles = function (user, userRoles) {
        if (user === void 0) { user = {}; }
        if (userRoles === void 0) { userRoles = []; }
        return __awaiter(this, void 0, void 0, function () {
            var users, found;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        users = this.collections.users.instance.find({
                            userRoles: { $all: userRoles }
                        });
                        found = [];
                        return [4 /*yield*/, users.count()];
                    case 1:
                        if (!((_a.sent()) > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, users.forEach(function (u) {
                                found.push(u);
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, found];
                }
            });
        });
    };
    StructService.prototype.getMongoDataByIds = function (user, structIds, ownerId, collection) {
        return __awaiter(this, void 0, void 0, function () {
            var query_1, found_1, cursor, passed_2, checkedAuth_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(structIds.length > 0)) return [3 /*break*/, 7];
                        query_1 = [];
                        structIds.forEach(function (_id) {
                            var q = { _id: _id };
                            if (ownerId)
                                q.ownerId = ownerId;
                            query_1.push(q);
                        });
                        found_1 = [];
                        if (!!collection) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(Object.keys(this.collections).map(function (name) { return __awaiter(_this, void 0, void 0, function () {
                                var cursor, passed_3, checkedAuth_3;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.db.collection(name).find({ $or: query_1 })];
                                        case 1:
                                            cursor = _a.sent();
                                            return [4 /*yield*/, cursor.count()];
                                        case 2:
                                            if (!((_a.sent()) > 0)) return [3 /*break*/, 4];
                                            passed_3 = true;
                                            checkedAuth_3 = '';
                                            return [4 /*yield*/, cursor.forEach(function (s) { return __awaiter(_this, void 0, void 0, function () {
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0:
                                                                if (!((user._id !== s.ownerId || (user._id === s.ownerId && user.userRoles.includes('admincontrol'))) && checkedAuth_3 !== s.ownerId)) return [3 /*break*/, 2];
                                                                return [4 /*yield*/, this.checkAuthorization(user, s)];
                                                            case 1:
                                                                passed_3 = _a.sent();
                                                                checkedAuth_3 = s.ownerId;
                                                                _a.label = 2;
                                                            case 2:
                                                                if (passed_3)
                                                                    found_1.push(s);
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                }); })];
                                        case 3:
                                            _a.sent();
                                            _a.label = 4;
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 2: return [4 /*yield*/, this.db.collection(collection).find({ $or: query_1 })];
                    case 3:
                        cursor = _a.sent();
                        return [4 /*yield*/, cursor.count()];
                    case 4:
                        if (!((_a.sent()) > 0)) return [3 /*break*/, 6];
                        passed_2 = true;
                        checkedAuth_2 = '';
                        return [4 /*yield*/, cursor.forEach(function (s) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!((user._id !== s.ownerId || (user._id === s.ownerId && user.userRoles.includes('admincontrol'))) && checkedAuth_2 !== s.ownerId)) return [3 /*break*/, 2];
                                            return [4 /*yield*/, this.checkAuthorization(user, s)];
                                        case 1:
                                            passed_2 = _a.sent();
                                            checkedAuth_2 = s.ownerId;
                                            _a.label = 2;
                                        case 2:
                                            if (passed_2)
                                                found_1.push(s);
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/, found_1];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    //get all data for an associated user, can add a search string
    StructService.prototype.getMongoData = function (user, collection, ownerId, dict, limit, skip) {
        if (dict === void 0) { dict = {}; }
        if (limit === void 0) { limit = 0; }
        if (skip === void 0) { skip = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var structs, passed, checkedAuth, cursor, found;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!ownerId)
                            ownerId = dict === null || dict === void 0 ? void 0 : dict.ownerId; // TODO: Ensure that replacing ownerId, key, value with dict was successful
                        if (dict._id)
                            dict._id = safeObjectID(dict._id);
                        structs = [];
                        passed = true;
                        checkedAuth = '';
                        if (!(!collection && !ownerId && !dict)) return [3 /*break*/, 1];
                        return [2 /*return*/, []];
                    case 1:
                        if (!(!collection && ownerId && Object.keys(dict).length === 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.getAllUserMongoData(user, ownerId)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        if (!(!dict && ownerId)) return [3 /*break*/, 7];
                        cursor = this.db.collection(collection).find({ ownerId: ownerId }).sort({ $natural: -1 }).skip(skip);
                        if (limit > 0)
                            cursor.limit(limit);
                        return [4 /*yield*/, cursor.count()];
                    case 4:
                        if (!((_a.sent()) > 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, cursor.forEach(function (s) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!((user._id !== s.ownerId || (user._id === s.ownerId && user.userRoles.includes('admincontrol'))) && checkedAuth !== s.ownerId)) return [3 /*break*/, 2];
                                            return [4 /*yield*/, this.checkAuthorization(user, s)];
                                        case 1:
                                            passed = _a.sent();
                                            checkedAuth = s.ownerId;
                                            _a.label = 2;
                                        case 2:
                                            if (passed === true)
                                                structs.push(s);
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 11];
                    case 7:
                        if (!(Object.keys(dict).length > 0 && ownerId)) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.db.collection(collection).findOne(__assign({ ownerId: ownerId }, dict))];
                    case 8:
                        found = _a.sent();
                        if (found)
                            structs.push(found);
                        return [3 /*break*/, 11];
                    case 9:
                        if (!(Object.keys(dict).length > 0 && !ownerId)) return [3 /*break*/, 11];
                        return [4 /*yield*/, Promise.all(Object.keys(this.collections).map(function (name) { return __awaiter(_this, void 0, void 0, function () {
                                var found;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.db.collection(name).findOne(dict)];
                                        case 1:
                                            found = _a.sent();
                                            if (!found) return [3 /*break*/, 4];
                                            if (!((user._id !== found.ownerId || (user._id === found.ownerId && user.userRoles.includes('admincontrol'))) && checkedAuth !== found.ownerId)) return [3 /*break*/, 3];
                                            return [4 /*yield*/, this.checkAuthorization(user, found)];
                                        case 2:
                                            passed = _a.sent();
                                            checkedAuth = found.ownerId;
                                            _a.label = 3;
                                        case 3:
                                            structs.push(found);
                                            return [2 /*return*/];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 10:
                        _a.sent();
                        _a.label = 11;
                    case 11:
                        if (!passed)
                            return [2 /*return*/, []];
                        return [2 /*return*/, structs];
                }
            });
        });
    };
    StructService.prototype.getAllUserMongoData = function (user, ownerId, excluded) {
        if (excluded === void 0) { excluded = []; }
        return __awaiter(this, void 0, void 0, function () {
            var structs, passed, checkedId;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        structs = [];
                        passed = true;
                        checkedId = '';
                        return [4 /*yield*/, Promise.all(Object.keys(this.collections).map(function (name, j) { return __awaiter(_this, void 0, void 0, function () {
                                var cursor, count, k, struct;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!(passed && excluded.indexOf(name) < 0)) return [3 /*break*/, 7];
                                            cursor = this.db.collection(name).find({ ownerId: ownerId });
                                            return [4 /*yield*/, cursor.count()];
                                        case 1:
                                            count = _a.sent();
                                            k = 0;
                                            _a.label = 2;
                                        case 2:
                                            if (!(k < count)) return [3 /*break*/, 7];
                                            return [4 /*yield*/, cursor.next()];
                                        case 3:
                                            struct = _a.sent();
                                            if (!((user._id !== ownerId || (user._id === ownerId && user.userRoles.includes('admincontrol'))) && checkedId !== ownerId)) return [3 /*break*/, 5];
                                            return [4 /*yield*/, this.checkAuthorization(user, struct)];
                                        case 4:
                                            passed = _a.sent();
                                            //console.log(passed)
                                            checkedId = ownerId;
                                            _a.label = 5;
                                        case 5:
                                            //if(j === 0 && k === 0) console.log(passed,structs);
                                            if (passed)
                                                structs.push(struct);
                                            _a.label = 6;
                                        case 6:
                                            k++;
                                            return [3 /*break*/, 2];
                                        case 7: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        if (!passed)
                            return [2 /*return*/, []];
                        //console.log(structs);
                        //console.log(passed, structs);
                        return [2 /*return*/, structs];
                }
            });
        });
    };
    //passing in structrefs to define the collection (structType) and id
    StructService.prototype.getMongoDataByRefs = function (user, structRefs) {
        if (structRefs === void 0) { structRefs = []; }
        return __awaiter(this, void 0, void 0, function () {
            var structs, checkedAuth_4;
            var _this = this;
            return __generator(this, function (_a) {
                structs = [];
                //structRef = {structType, id}
                if (structs.length > 0) {
                    checkedAuth_4 = '';
                    structRefs.forEach(function (ref) { return __awaiter(_this, void 0, void 0, function () {
                        var struct, passed, passed_4;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!(ref.structType && ref._id)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, this.db.collection(ref.structType).findOne({ _id: safeObjectID(ref._id) })];
                                case 1:
                                    struct = _a.sent();
                                    if (!struct) return [3 /*break*/, 4];
                                    passed = true;
                                    if (!((user._id !== struct.ownerId || (user._id === struct.ownerId && user.userRoles.includes('admincontrol'))) && checkedAuth_4 !== struct.ownerId)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, this.checkAuthorization(user, struct)];
                                case 2:
                                    passed_4 = _a.sent();
                                    checkedAuth_4 = struct.ownerId;
                                    _a.label = 3;
                                case 3:
                                    if (passed === true) {
                                        structs.push(struct);
                                    }
                                    _a.label = 4;
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                }
                return [2 /*return*/, structs];
            });
        });
    };
    StructService.prototype.getMongoAuthorizations = function (user, ownerId, authId) {
        if (ownerId === void 0) { ownerId = user._id; }
        if (authId === void 0) { authId = ''; }
        return __awaiter(this, void 0, void 0, function () {
            var auths, cursor, _a, _b, passed;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        auths = [];
                        if (!(authId.length === 0)) return [3 /*break*/, 4];
                        cursor = this.collections.authorizations.instance.find({ ownerId: ownerId });
                        return [4 /*yield*/, cursor.count];
                    case 1:
                        if (!((_c.sent()) > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, cursor.forEach(function (a) {
                                auths.push(a);
                            })];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3: return [3 /*break*/, 6];
                    case 4:
                        _b = (_a = auths).push;
                        return [4 /*yield*/, this.collections.authorizations.instance.findOne({ _id: safeObjectID(authId), ownerId: ownerId })];
                    case 5:
                        _b.apply(_a, [_c.sent()]);
                        _c.label = 6;
                    case 6:
                        if (!(user._id !== auths[0].ownerId)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.checkAuthorization(user, auths[0])];
                    case 7:
                        passed = _c.sent();
                        if (!passed)
                            return [2 /*return*/, undefined];
                        _c.label = 8;
                    case 8: return [2 /*return*/, auths];
                }
            });
        });
    };
    StructService.prototype.getMongoGroups = function (user, userId, groupId) {
        if (userId === void 0) { userId = user._id; }
        if (groupId === void 0) { groupId = ''; }
        return __awaiter(this, void 0, void 0, function () {
            var groups, cursor, _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        groups = [];
                        if (!(groupId.length === 0)) return [3 /*break*/, 4];
                        cursor = this.collections.groups.instance.find({ users: { $all: [userId] } });
                        return [4 /*yield*/, cursor.count];
                    case 1:
                        if (!((_d.sent()) > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, cursor.forEach(function (a) {
                                groups.push(a);
                            })];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3: return [3 /*break*/, 7];
                    case 4:
                        _d.trys.push([4, 6, , 7]);
                        _b = (_a = groups).push;
                        return [4 /*yield*/, this.collections.groups.instance.findOne({ _id: safeObjectID(groupId), users: { $all: [userId] } })];
                    case 5:
                        _b.apply(_a, [_d.sent()]);
                        return [3 /*break*/, 7];
                    case 6:
                        _c = _d.sent();
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, groups];
                }
            });
        });
    };
    //general delete function
    StructService.prototype.deleteMongoData = function (user, structRefs) {
        if (structRefs === void 0) { structRefs = []; }
        return __awaiter(this, void 0, void 0, function () {
            var structs, checkedOwner;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        structs = [];
                        return [4 /*yield*/, Promise.all(structRefs.map(function (ref) { return __awaiter(_this, void 0, void 0, function () {
                                var _id, struct, notifications, count, i, note, _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _b.trys.push([0, 8, , 9]);
                                            _id = safeObjectID(ref._id);
                                            return [4 /*yield*/, this.db.collection(ref.structType).findOne({ _id: _id })];
                                        case 1:
                                            struct = _b.sent();
                                            if (!struct) return [3 /*break*/, 7];
                                            structs.push(struct);
                                            return [4 /*yield*/, this.collections.notifications.instance.find({ parent: { structType: ref.structType, id: ref._id } })];
                                        case 2:
                                            notifications = _b.sent();
                                            return [4 /*yield*/, notifications.count()];
                                        case 3:
                                            count = _b.sent();
                                            i = 0;
                                            _b.label = 4;
                                        case 4:
                                            if (!(i < count)) return [3 /*break*/, 7];
                                            return [4 /*yield*/, notifications.next()];
                                        case 5:
                                            note = _b.sent();
                                            if (note)
                                                structs.push(note);
                                            _b.label = 6;
                                        case 6:
                                            i++;
                                            return [3 /*break*/, 4];
                                        case 7: return [3 /*break*/, 9];
                                        case 8:
                                            _a = _b.sent();
                                            return [3 /*break*/, 9];
                                        case 9: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        checkedOwner = '';
                        return [4 /*yield*/, Promise.all(structs.map(function (struct, i) { return __awaiter(_this, void 0, void 0, function () {
                                var passed;
                                var _this = this;
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            passed = true;
                                            if (!((struct.ownerId !== user._id || (user._id === struct.ownerId && ((_a = user.userRoles) === null || _a === void 0 ? void 0 : _a.includes('admincontrol')))) && struct.ownerId !== checkedOwner)) return [3 /*break*/, 2];
                                            checkedOwner = struct.ownerId;
                                            return [4 /*yield*/, this.checkAuthorization(user, struct, 'WRITE')];
                                        case 1:
                                            passed = _b.sent();
                                            _b.label = 2;
                                        case 2:
                                            if (!passed) return [3 /*break*/, 4];
                                            //console.log(passed);
                                            return [4 /*yield*/, this.db.collection(struct.structType).deleteOne({ _id: safeObjectID(struct._id) })];
                                        case 3:
                                            //console.log(passed);
                                            _b.sent();
                                            //delete any associated notifications, too
                                            if (struct.users) {
                                                struct.users.forEach(function (uid) {
                                                    if (uid !== user._id && uid !== struct.ownerId)
                                                        _this.router.sendMsg(uid, 'deleted', struct._id);
                                                });
                                            }
                                            if (struct.ownerId !== user._id) {
                                                this.router.sendMsg(struct.ownerId, 'deleted', struct._id);
                                            }
                                            _b.label = 4;
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    //specific delete functions (the above works for everything)
    StructService.prototype.deleteMongoUser = function (user, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var u, passed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(user._id !== userId || (user._id === userId && user.userRoles.includes('admincontrol')))) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.collections.users.instance.findOne({ id: userId })];
                    case 1:
                        u = _a.sent();
                        return [4 /*yield*/, this.checkAuthorization(user, u, 'WRITE')];
                    case 2:
                        passed = _a.sent();
                        if (!passed)
                            return [2 /*return*/, false];
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.collections.users.instance.deleteOne({ id: userId })];
                    case 4:
                        _a.sent();
                        if (user._id !== userId)
                            this.router.sendMsg(userId, 'deleted', userId);
                        //now delete their authorizations and data too (optional?)
                        return [2 /*return*/, true];
                }
            });
        });
    };
    StructService.prototype.deleteMongoGroup = function (user, groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var s, passed;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.collections.groups.instance.findOne({ _id: safeObjectID(groupId) })];
                    case 1:
                        s = _a.sent();
                        if (!s) return [3 /*break*/, 5];
                        if (!(user._id !== s.ownerId || (user._id === s.ownerId && user.userRoles.includes('admincontrol')))) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.checkAuthorization(user, s, 'WRITE')];
                    case 2:
                        passed = _a.sent();
                        if (!passed)
                            return [2 /*return*/, false];
                        _a.label = 3;
                    case 3:
                        if (s.users) {
                            s.users.forEach(function (u) { _this.router.sendMsg(s.authorizerId, 'deleted', s._id); });
                        }
                        return [4 /*yield*/, this.collections.groups.instance.deleteOne({ _id: safeObjectID(groupId) })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 5: return [2 /*return*/, false];
                }
            });
        });
    };
    StructService.prototype.deleteMongoAuthorization = function (user, authId) {
        return __awaiter(this, void 0, void 0, function () {
            var s, passed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.collections.authorizations.instance.findOne({ _id: safeObjectID(authId) })];
                    case 1:
                        s = _a.sent();
                        if (!s) return [3 /*break*/, 7];
                        if (!(user._id !== s.ownerId || (user._id === s.ownerId && user.userRoles.includes('admincontrol')))) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.checkAuthorization(user, s, 'WRITE')];
                    case 2:
                        passed = _a.sent();
                        if (!passed)
                            return [2 /*return*/, false];
                        _a.label = 3;
                    case 3:
                        if (!s.associatedAuthId) return [3 /*break*/, 5];
                        if (this.router.DEBUG)
                            console.log(s);
                        return [4 /*yield*/, this.collections.authorizations.instance.deleteOne({ _id: safeObjectID(s.associatedAuthId) })];
                    case 4:
                        _a.sent(); //remove the other auth too 
                        if (s.authorizerId !== user._id)
                            this.router.sendMsg(s.authorizerId, 'deleted', s._id);
                        else if (s.authorizedId !== user._id)
                            this.router.sendMsg(s.authorizedId, 'deleted', s._id);
                        _a.label = 5;
                    case 5: return [4 /*yield*/, this.collections.authorizations.instance.deleteOne({ _id: safeObjectID(authId) })];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 7: return [2 /*return*/, false];
                }
            });
        });
    };
    StructService.prototype.setAuthorization = function (user, authStruct, mode) {
        if (mode === void 0) { mode = this.mode; }
        return __awaiter(this, void 0, void 0, function () {
            var u1, u2, passed, auths, s, s, otherAuthset, copy, replacedAuth, otherAuth;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(mode === 'mongo')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.getMongoUser(user, authStruct.authorizedId, true)];
                    case 1:
                        u1 = _a.sent(); //can authorize via email, id, or username
                        return [4 /*yield*/, this.getMongoUser(user, authStruct.authorizerId, true)];
                    case 2:
                        u2 = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        u1 = this.getLocalData('user', { '_id': authStruct.authorizedId });
                        u2 = this.getLocalData('user', { '_id': authStruct.authorizedId });
                        _a.label = 4;
                    case 4:
                        if (!u1 || !u2)
                            return [2 /*return*/, false]; //no profile data
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
                        if (!((user._id !== authStruct.ownerId || (user._id === authStruct.ownerId && user.userRoles.includes('admincontrol'))) && (user._id !== authStruct.authorizedId && user._id !== authStruct.authorizerId))) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.checkAuthorization(user, authStruct, 'WRITE')];
                    case 5:
                        passed = _a.sent();
                        if (!passed)
                            return [2 /*return*/, false];
                        _a.label = 6;
                    case 6:
                        auths = [];
                        if (!(mode === 'mongo')) return [3 /*break*/, 10];
                        s = this.collections.authorizations.instance.find({ $and: [{ authorizedId: authStruct.authorizedId }, { authorizerId: authStruct.authorizerId }] });
                        return [4 /*yield*/, s.count()];
                    case 7:
                        if (!((_a.sent()) > 0)) return [3 /*break*/, 9];
                        return [4 /*yield*/, s.forEach(function (d) { return auths.push(d); })];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        s = this.getLocalData('authorization', { authorizedId: authStruct.authorizedId });
                        if (Array.isArray(s)) {
                            s.forEach(function (d) {
                                if (d.authorizerId === authStruct.authorizerId)
                                    auths.push(d);
                            });
                        }
                        _a.label = 11;
                    case 11:
                        if (Array.isArray(auths)) {
                            auths.forEach(function (auth) { return __awaiter(_this, void 0, void 0, function () {
                                var copy_1;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!(auth.ownerId === user._id)) return [3 /*break*/, 1];
                                            return [3 /*break*/, 4];
                                        case 1:
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
                                            copy_1 = JSON.parse(JSON.stringify(auth));
                                            if (!this.mode.includes('mongo')) return [3 /*break*/, 3];
                                            delete copy_1._id;
                                            return [4 /*yield*/, this.collections.authorizations.instance.updateOne({ $and: [{ authorizedId: authStruct.authorizedId }, { authorizerId: authStruct.authorizerId }, { ownerId: auth.ownerId }] }, { $set: copy_1 }, { upsert: true })];
                                        case 2:
                                            _a.sent();
                                            return [3 /*break*/, 4];
                                        case 3:
                                            this.setLocalData(copy_1);
                                            _a.label = 4;
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); });
                        }
                        copy = JSON.parse(JSON.stringify(authStruct));
                        if (!(mode === 'mongo')) return [3 /*break*/, 13];
                        delete copy._id;
                        return [4 /*yield*/, this.collections.authorizations.instance.updateOne({ $and: [{ authorizedId: authStruct.authorizedId }, { authorizerId: authStruct.authorizerId }, { ownerId: authStruct.ownerId }] }, { $set: copy }, { upsert: true })];
                    case 12:
                        _a.sent();
                        return [3 /*break*/, 14];
                    case 13:
                        this.setLocalData(copy);
                        _a.label = 14;
                    case 14:
                        if (!(authStruct._id.includes('defaultId') && mode === 'mongo')) return [3 /*break*/, 18];
                        return [4 /*yield*/, this.collections.authorizations.instance.findOne(copy)];
                    case 15:
                        replacedAuth = _a.sent();
                        if (!replacedAuth) return [3 /*break*/, 18];
                        authStruct._id = replacedAuth._id.toString();
                        if (!otherAuthset) return [3 /*break*/, 18];
                        return [4 /*yield*/, this.collections.authorizations.instance.findOne({ $and: [{ authorizedId: otherAuthset.authorizedId }, { authorizerId: otherAuthset.authorizerId }, { ownerId: otherAuthset.ownerId }] })];
                    case 16:
                        otherAuth = _a.sent();
                        if (!otherAuth) return [3 /*break*/, 18];
                        otherAuth.associatedAuthId = authStruct._id;
                        delete otherAuth._id;
                        return [4 /*yield*/, this.collections.authorizations.instance.updateOne({ $and: [{ authorizedId: otherAuth.authorizedId }, { authorizerId: otherAuth.authorizerId }, { ownerId: otherAuth.ownerId }] }, { $set: otherAuth }, { upsert: true })];
                    case 17:
                        _a.sent();
                        this.checkToNotify(user, [otherAuth]);
                        _a.label = 18;
                    case 18: return [2 /*return*/, authStruct]; //pass back the (potentially modified) authStruct
                }
            });
        });
    };
    StructService.prototype.checkAuthorization = function (user, struct, request, //'WRITE'
    mode) {
        var _a, _b, _c;
        if (request === void 0) { request = 'READ'; }
        if (mode === void 0) { mode = this.mode; }
        return __awaiter(this, void 0, void 0, function () {
            var auth1, auth2, passed;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        /*
                            If user is not the owner of the struct, check that they have permissions
                        */
                        //console.log(struct)
                        if (!user || !struct)
                            return [2 /*return*/, false];
                        if (typeof user === 'object') {
                            if (struct.ownerId === user._id) {
                                if ((_a = user.userRoles) === null || _a === void 0 ? void 0 : _a.includes('admin_control')) {
                                }
                                else
                                    return [2 /*return*/, true];
                            }
                        }
                        else if (typeof user === 'string') {
                            if (struct.ownerId === user) {
                                return [2 /*return*/, true];
                            }
                            else
                                user = { _id: user };
                        }
                        if (!(mode === 'mongo')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.collections.authorizations.instance.findOne({ $or: [{ authorizedId: user._id, authorizerId: struct.ownerId, ownerId: user._id }, { authorizedId: struct.ownerId, authorizerId: user._id, ownerId: user._id }] })];
                    case 1:
                        auth1 = _d.sent();
                        return [4 /*yield*/, this.collections.authorizations.instance.findOne({ $or: [{ authorizedId: user._id, authorizerId: struct.ownerId, ownerId: struct.ownerId }, { authorizedId: struct.ownerId, authorizerId: user._id, ownerId: struct.ownerId }] })];
                    case 2:
                        auth2 = _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        auth1 = this.getLocalData('authorization', { ownerId: user._id }).find(function (o) {
                            if (o.authorizedId === user._id && o.authorizerId === struct.ownerId)
                                return true;
                        });
                        auth2 = this.getLocalData('authorization', { ownerId: struct.ownerId }).find(function (o) {
                            if (o.authorizedId === user._id && o.authorizerId === struct.ownerId)
                                return true;
                        });
                        _d.label = 4;
                    case 4:
                        if (!auth1 || !auth2) {
                            //console.log('auth bounced', user, struct, auth1, auth2);
                            return [2 /*return*/, false];
                        }
                        passed = false;
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
                        return [2 /*return*/, passed];
                }
            });
        });
    };
    //Local Data stuff (for non-mongodb usage of this server)
    //just assigns replacement object to old object if it exists, keeps things from losing parent context in UI
    StructService.prototype.overwriteLocalData = function (structs) {
        var _this = this;
        if (Array.isArray(structs)) {
            structs.forEach(function (struct) {
                var localdat = _this.getLocalData(struct.structType, { 'ownerId': struct.ownerId, '_id': struct._id });
                if (!localdat || (localdat === null || localdat === void 0 ? void 0 : localdat.length) === 0) {
                    _this.setLocalData(struct); //set
                }
                else
                    Object.assign(localdat, struct); //overwrite
            });
        }
        else {
            var localdat = this.getLocalData(structs.structType, { 'ownerId': structs.ownerId, '_id': structs._id });
            if (!localdat || (localdat === null || localdat === void 0 ? void 0 : localdat.length) === 0) {
                this.setLocalData(structs); //set
            }
            else
                Object.assign(localdat, structs); //overwrite
        }
    };
    StructService.prototype.setLocalData = function (structs) {
        var _this = this;
        var setInCollection = function (s) {
            var type = s.structType;
            var collection = _this.collections[type].reference;
            if (!collection) {
                collection = {};
                _this.collections[type].reference = collection;
            }
            collection[s._id] = s;
        };
        if (Array.isArray(structs)) {
            structs.forEach(function (s) {
                setInCollection(s);
            });
        }
        else
            setInCollection(structs);
    };
    //pull a struct by collection, owner, and key/value pair from the local platform, leave collection blank to pull all ownerId associated data
    StructService.prototype.getLocalData = function (collection, query) {
        // Split Query
        var ownerId, key, value;
        if (typeof query === 'object') {
            ownerId = query.ownerId;
            // TODO: Make more robust. Does not support more than one key (aside from ownerId)
            var keys = Object.keys(query).filter(function (k) { return k != 'ownerId'; });
            key = keys[0];
            value = query[key];
        }
        else
            value = query;
        if (!collection && !ownerId && !key && !value)
            return [];
        var result = [];
        if (!collection && (ownerId || key)) {
            Object.values(this.collections).forEach(function (c) {
                c = c.reference; // Drop to reference
                if ((key === '_id' || key === 'id') && value) {
                    var found = c[value];
                    if (found)
                        result.push(found);
                }
                else {
                    Object.values(c).forEach(function (struct) {
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
            var c_1 = this.collections[collection].reference;
            if (!c_1)
                return result;
            if (!key && !ownerId) {
                Object.values(c_1).forEach(function (struct) { result.push(struct); });
                return result; //return the whole collection
            }
            if ((key === '_id' || key === 'id') && value)
                return c_1[value]; //collections store structs by id so just get the one struct
            else {
                Object.keys(c_1).forEach(function (k) {
                    var struct = c_1[k];
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
    };
    StructService.prototype.deleteLocalData = function (struct) {
        if (!struct)
            throw new Error('Struct not supplied');
        if (!struct.structType || !struct._id)
            return false;
        // Delete the Reference by ID
        if (this.collections[struct.structType])
            delete this.collections[struct.structType].reference[struct._id];
        return true;
    };
    return StructService;
}(Service));
export { StructService };
export default StructService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RydWN0cy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3RydWN0cy5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxzQ0FBc0M7QUFDdEMsa0RBQWtEO0FBQ2xELDRDQUE0QztBQUM1QyxPQUFPLFFBQVEsTUFBTSxlQUFlLENBQUE7QUFHcEMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUVqRCx5REFBeUQ7QUFFekQsTUFBTSxDQUFDLElBQU0sWUFBWSxHQUFHLFVBQUMsR0FBRztJQUM1QixPQUFPLENBQUMsT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFBO0FBQy9FLENBQUMsQ0FBQTtBQW9CRCxJQUFNLGtCQUFrQixHQUFHO0lBQ3ZCLE1BQU07SUFDTixPQUFPO0lBQ1AsZUFBZTtJQUNmLFlBQVk7SUFDWixVQUFVO0lBQ1YsU0FBUztJQUNULGNBQWM7SUFDZCxPQUFPO0lBQ1AsY0FBYztJQUNkLFVBQVU7SUFDVixNQUFNO0NBQ1QsQ0FBQztBQUVGO0lBQW1DLGlDQUFPO0lBVXRDLHVCQUFhLE1BQU0sRUFBRSxTQUlmLEVBQUUsS0FBVTtRQUpHLDBCQUFBLEVBQUEsY0FJZjtRQUFFLHNCQUFBLEVBQUEsWUFBVTtRQUpsQixZQUtJLGtCQUFNLE1BQU0sQ0FBQyxTQXVXaEI7UUFwWEQsVUFBSSxHQUFHLFNBQVMsQ0FBQTtRQUdoQixpQkFBVyxHQUFvQixFQUFFLENBQUE7UUFnd0NqQyxZQUFNLEdBQUc7Ozs7b0JBQ0wsZ0VBQWdFO29CQUNoRSx3REFBd0Q7b0JBQ3hELHFCQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1B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