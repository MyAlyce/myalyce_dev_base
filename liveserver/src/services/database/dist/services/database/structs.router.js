import { __awaiter, __extends, __generator, __read, __spreadArray } from "tslib";
import { DataTablet, DS } from 'brainsatplay-data';
import { Router } from '../../router/Router';
import { randomId } from '../../common/id.utils';
import StructService from './structs.service';
//Joshua Brewster, Garrett Flynn   -   GNU Affero GPL V3.0 License
//
// Description
// A client-side Router class with macros
//
var StructRouter = /** @class */ (function (_super) {
    __extends(StructRouter, _super);
    function StructRouter(userInfo, options) {
        if (userInfo === void 0) { userInfo = {}; }
        var _this = _super.call(this, options) || this;
        _this.tablet = new DataTablet(); //DataTablet 
        _this.collections = _this.tablet.collections;
        _this.id = randomId();
        //default socket response for the platform
        _this.baseServerCallback = function (data) {
            var structs = data;
            if (typeof data === 'object' && (data === null || data === void 0 ? void 0 : data.structType))
                structs = [data];
            if (Array.isArray(data)) { //getUserData response
                var filtered = structs.filter(function (o) {
                    if (o.structType !== 'notification')
                        return true;
                });
                if (_this.tablet)
                    _this.tablet.sortStructsIntoTable(filtered);
                structs.forEach(function (struct) {
                    var _a;
                    if ((!struct.structType) || struct.structType === 'USER') {
                        // console.log(struct)
                        if (struct.email)
                            struct.structType = 'user';
                        else
                            struct.structType = 'uncategorized';
                    }
                    if (struct.structType === 'user' || struct.structType === 'authorization' || struct.structType === 'group') {
                        if (struct.structType === 'user') {
                            struct._id = struct.id; //replacer
                            // struct = new UserObj(struct); // set user obj
                            // struct = getUserCodes(struct, true);
                        }
                        _this.setLocalData(struct);
                    }
                    else {
                        if (struct.structType === 'notification') {
                            var found = _this.getLocalData('notification', { 'ownerId': struct.ownerId, '_id': struct.parent._id });
                            if (found) {
                                _this.setLocalData(struct);
                            }
                            else {
                                if (_this.getLocalData(struct.structType, { '_id': struct.parent._id })) {
                                    //this.resolveNotifications([struct],false);
                                }
                                else {
                                    _this.overwriteLocalData(struct);
                                }
                            }
                            // TODO: Ignores notifications when the current user still has not resolved
                            if (struct.ownerId === ((_a = _this.currentUser) === null || _a === void 0 ? void 0 : _a._id) &&
                                (struct.parent.structType === 'user' || //all of the notification instances we want to pull automatically, chats etc should resolve when we want to view/are actively viewing them
                                    struct.parent.structType === 'dataInstance' ||
                                    struct.parent.structType === 'schedule' ||
                                    struct.parent.structType === 'authorization')) {
                                _this.resolveNotifications([struct], true);
                            }
                        }
                        else {
                            _this.overwriteLocalData(struct);
                            //console.log(struct)
                        }
                    }
                });
            }
            if ((data === null || data === void 0 ? void 0 : data.message) === 'notifications') {
                _this.checkForNotifications(); //pull notifications
            }
            if ((data === null || data === void 0 ? void 0 : data.message) === 'deleted') {
                _this.deleteLocalData(data.id); //remove local instance
            }
            _this.onResult(data);
        };
        //pass notifications you're ready to resolve and set pull to true to grab the associated data structure.
        _this.resolveNotifications = function (notifications, pull, user) {
            if (notifications === void 0) { notifications = []; }
            if (pull === void 0) { pull = true; }
            if (user === void 0) { user = _this.currentUser; }
            return __awaiter(_this, void 0, void 0, function () {
                var structIds, notificationIds, nTypes, unote;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!user || notifications.length === 0)
                                return [2 /*return*/];
                            structIds = [];
                            notificationIds = [];
                            nTypes = [];
                            unote = false;
                            if (notifications.length === 0)
                                notifications = this.getLocalData('notification', { 'ownerId': user._id });
                            notifications.forEach(function (struct) {
                                if (struct.parent.structType === 'user')
                                    unote = true;
                                nTypes.push(struct.parent.structType);
                                structIds.push(struct.parent._id);
                                notificationIds.push(struct._id);
                                //console.log(struct)
                                _this.deleteLocalData(struct); //delete local entries and update profile
                                //console.log(this.structs.get(struct._id));
                            });
                            this.deleteData(notificationIds); //delete server entries
                            if (!pull) return [3 /*break*/, 2];
                            nTypes.reverse().forEach(function (note, i) {
                                // if(note === 'comment') { //when resolving comments we need to pull the tree (temp)
                                //     this.getParentData(structIds[i],(res)=>{
                                //         this.defaultCallback(res);
                                //         if(res.data) this.getChildData(res.data._id,'comments');
                                //     });
                                //     structIds.splice(i,1);
                                // }
                                if (note === 'user') {
                                    _this.getUser(notificationIds[i]);
                                    structIds.splice(structIds.length - i - 1, 1);
                                }
                            });
                            if (!(structIds.length > 0)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.getDataByIds(structIds, user._id, 'notification')];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2: return [2 /*return*/, true];
                    }
                });
            });
        };
        //get auths where you have granted somebody peer access
        _this.getLocalUserPeerIds = function (user) {
            if (user === void 0) { user = _this.currentUser; }
            if (!user)
                return [];
            var result = [];
            var authorizations = _this.getLocalData('authorization', user._id);
            authorizations.forEach(function (a) {
                if (a.authorizations.indexOf('peer') > -1 && a.authorizerId === user._id)
                    result.push(a.authorizedId);
            });
            return result;
        };
        //TODO: Update the rest of these to use the DB structs but this should all work the same for now
        _this.authorizeUser = function (parentUser, authorizerUserId, authorizerUserName, authorizedUserId, authorizedUserName, authorizations, // TODO: really any[] or has type??
        structs, excluded, groups, expires) {
            if (parentUser === void 0) { parentUser = _this.userStruct(); }
            if (authorizerUserId === void 0) { authorizerUserId = ''; }
            if (authorizerUserName === void 0) { authorizerUserName = ''; }
            if (authorizedUserId === void 0) { authorizedUserId = ''; }
            if (authorizedUserName === void 0) { authorizedUserName = ''; }
            if (authorizations === void 0) { authorizations = []; }
            if (structs === void 0) { structs = []; }
            if (excluded === void 0) { excluded = []; }
            if (groups === void 0) { groups = []; }
            if (expires === void 0) { expires = false; }
            return __awaiter(_this, void 0, void 0, function () {
                var newAuthorization;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            newAuthorization = this.createStruct('authorization', undefined, parentUser, undefined);
                            newAuthorization.authorizedId = authorizedUserId; // Only pass ID
                            newAuthorization.authorizedName = authorizedUserName; //set name
                            newAuthorization.authorizerId = authorizerUserId; // Only pass ID
                            newAuthorization.authorizerName = authorizerUserName; //set name
                            newAuthorization.authorizations = authorizations;
                            newAuthorization.structs = structs;
                            newAuthorization.excluded = excluded;
                            newAuthorization.groups = groups;
                            newAuthorization.expires = expires;
                            newAuthorization.status = 'PENDING';
                            newAuthorization.associatedAuthId = '';
                            newAuthorization.ownerId = parentUser._id;
                            return [4 /*yield*/, this.setAuthorization(newAuthorization)];
                        case 1:
                            newAuthorization = _a.sent();
                            return [2 /*return*/, newAuthorization];
                    }
                });
            });
        };
        _this.addGroup = function (parentUser, name, details, admins, peers, clients, updateServer) {
            if (parentUser === void 0) { parentUser = _this.userStruct(); }
            if (name === void 0) { name = ''; }
            if (details === void 0) { details = ''; }
            if (admins === void 0) { admins = []; }
            if (peers === void 0) { peers = []; }
            if (clients === void 0) { clients = []; }
            if (updateServer === void 0) { updateServer = true; }
            return __awaiter(_this, void 0, void 0, function () {
                var newGroup;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            newGroup = this.createStruct('group', undefined, parentUser);
                            newGroup.name = name;
                            newGroup.details = details;
                            newGroup.admins = admins;
                            newGroup.peers = peers;
                            newGroup.clients = clients;
                            newGroup.users = __spreadArray(__spreadArray(__spreadArray([], __read(admins), false), __read(peers), false), __read(clients), false);
                            newGroup.ownerId = parentUser._id;
                            if (!updateServer) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.setGroup(newGroup)];
                        case 1:
                            newGroup = _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/, newGroup];
                    }
                });
            });
        };
        _this.addData = function (parentUser, author, title, type, data, expires, updateServer) {
            if (parentUser === void 0) { parentUser = _this.userStruct(); }
            if (author === void 0) { author = ''; }
            if (title === void 0) { title = ''; }
            if (type === void 0) { type = ''; }
            if (data === void 0) { data = []; }
            if (expires === void 0) { expires = false; }
            if (updateServer === void 0) { updateServer = true; }
            return __awaiter(_this, void 0, void 0, function () {
                var newDataInstance;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            newDataInstance = this.createStruct('dataInstance', undefined, parentUser);
                            newDataInstance.author = author;
                            newDataInstance.title = title;
                            newDataInstance.type = type;
                            newDataInstance.data = data;
                            newDataInstance.expires = expires;
                            newDataInstance.ownerId = parentUser._id;
                            if (!updateServer) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.updateServerData([newDataInstance])[0]];
                        case 1:
                            newDataInstance = _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/, newDataInstance];
                    }
                });
            });
        };
        _this.addEvent = function (parentUser, author, event, notes, startTime, endTime, grade, attachments, users, updateServer) {
            if (parentUser === void 0) { parentUser = _this.userStruct(); }
            if (author === void 0) { author = ''; }
            if (event === void 0) { event = ''; }
            if (notes === void 0) { notes = ''; }
            if (startTime === void 0) { startTime = 0; }
            if (endTime === void 0) { endTime = 0; }
            if (grade === void 0) { grade = 0; }
            if (attachments === void 0) { attachments = []; }
            if (users === void 0) { users = []; }
            if (updateServer === void 0) { updateServer = true; }
            return __awaiter(_this, void 0, void 0, function () {
                var newEvent;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (users.length === 0)
                                users = this.getLocalUserPeerIds(parentUser);
                            newEvent = this.createStruct('event', undefined, parentUser);
                            newEvent.author = author;
                            newEvent.event = event;
                            newEvent.notes = notes;
                            newEvent.startTime = startTime;
                            newEvent.endTime = endTime;
                            newEvent.grade = grade;
                            newEvent.attachments = attachments;
                            newEvent.users = users;
                            newEvent.ownerId = parentUser._id;
                            if (!updateServer) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.updateServerData([newEvent])[0]];
                        case 1:
                            newEvent = _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/, newEvent];
                    }
                });
            });
        };
        //create discussion board topic
        _this.addDiscussion = function (parentUser, authorId, topic, category, message, attachments, users, updateServer) {
            if (parentUser === void 0) { parentUser = _this.userStruct(); }
            if (authorId === void 0) { authorId = ''; }
            if (topic === void 0) { topic = ''; }
            if (category === void 0) { category = ''; }
            if (message === void 0) { message = ''; }
            if (attachments === void 0) { attachments = []; }
            if (users === void 0) { users = []; }
            if (updateServer === void 0) { updateServer = true; }
            return __awaiter(_this, void 0, void 0, function () {
                var newDiscussion, update;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (users.length === 0)
                                users = this.getLocalUserPeerIds(parentUser); //adds the peer ids if none other provided
                            newDiscussion = this.createStruct('discussion', undefined, parentUser);
                            newDiscussion.topic = topic;
                            newDiscussion.category = category;
                            newDiscussion.message = message;
                            newDiscussion.attachments = attachments;
                            newDiscussion.authorId = authorId;
                            newDiscussion.users = users;
                            newDiscussion.comments = [];
                            newDiscussion.replies = [];
                            newDiscussion.ownerId = parentUser._id;
                            update = [newDiscussion];
                            if (!updateServer) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.updateServerData(update)[0]];
                        case 1:
                            newDiscussion = _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/, newDiscussion];
                    }
                });
            });
        };
        _this.addChatroom = function (parentUser, authorId, message, attachments, users, updateServer) {
            if (parentUser === void 0) { parentUser = _this.userStruct(); }
            if (authorId === void 0) { authorId = ''; }
            if (message === void 0) { message = ''; }
            if (attachments === void 0) { attachments = []; }
            if (users === void 0) { users = []; }
            if (updateServer === void 0) { updateServer = true; }
            return __awaiter(_this, void 0, void 0, function () {
                var newChatroom, update;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (users.length === 0)
                                users = this.getLocalUserPeerIds(parentUser); //adds the peer ids if none other provided
                            newChatroom = this.createStruct('chatroom', undefined, parentUser);
                            newChatroom.message = message;
                            newChatroom.attachments = attachments;
                            newChatroom.authorId = authorId;
                            newChatroom.users = users;
                            newChatroom.replies = [];
                            newChatroom.comments = [];
                            newChatroom.ownerId = parentUser._id;
                            update = [newChatroom];
                            if (!updateServer) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.updateServerData(update)[0]];
                        case 1:
                            newChatroom = _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/, newChatroom];
                    }
                });
            });
        };
        //add comment to chatroom or discussion board
        _this.addComment = function (parentUser, roomStruct, replyTo, authorId, message, attachments, updateServer) {
            if (parentUser === void 0) { parentUser = _this.userStruct(); }
            if (authorId === void 0) { authorId = ''; }
            if (message === void 0) { message = ''; }
            if (attachments === void 0) { attachments = []; }
            if (updateServer === void 0) { updateServer = true; }
            return __awaiter(_this, void 0, void 0, function () {
                var newComment, update;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            newComment = this.createStruct('comment', undefined, parentUser, roomStruct);
                            newComment.authorId = authorId;
                            newComment.replyTo = replyTo === null || replyTo === void 0 ? void 0 : replyTo._id;
                            newComment.message = message;
                            newComment.attachments = attachments;
                            newComment.users = roomStruct === null || roomStruct === void 0 ? void 0 : roomStruct.users;
                            newComment.replies = [];
                            newComment.ownerId = parentUser._id;
                            if (updateServer)
                                replyTo === null || replyTo === void 0 ? void 0 : replyTo.replies.push(newComment._id);
                            else
                                replyTo === null || replyTo === void 0 ? void 0 : replyTo.replies.push(newComment); // push full reply if not on server
                            if (updateServer)
                                roomStruct === null || roomStruct === void 0 ? void 0 : roomStruct.comments.push(newComment._id);
                            else
                                roomStruct === null || roomStruct === void 0 ? void 0 : roomStruct.comments.push(newComment); // push full comment if not on server
                            update = [newComment, roomStruct];
                            if (replyTo._id !== roomStruct._id)
                                update.push(replyTo);
                            if (!updateServer) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.updateServerData(update)[0]];
                        case 1:
                            newComment = _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/, newComment];
                    }
                });
            });
        };
        if (userInfo instanceof Object && Object.keys(userInfo).length > 0)
            _this.setupUser(userInfo); // Declares currentUser
        // Auto-Connect Struct Client Service
        _this.load(new StructService(_this));
        return _this;
    }
    //TODO: make this able to be awaited to return the currentUser
    //uses a bunch of the functions below to set up a user and get their data w/ some cross checking for consistent profiles
    StructRouter.prototype.setupUser = function (userinfo, callback) {
        if (callback === void 0) { callback = function (currentUser) { }; }
        return __awaiter(this, void 0, void 0, function () {
            var changed, user, u, newu, wasSet, structs, prop, dummystruct, i, i, data, notes, comments, toDelete_1, filtered;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!userinfo) {
                            console.error('must provide an info object! e.g. {_id:"abc123"}');
                            callback(undefined);
                            return [2 /*return*/, undefined];
                        }
                        changed = false;
                        if (userinfo.id)
                            userinfo._id = userinfo.id;
                        // let res = await this.login();
                        console.log("Generating/Getting User: ", userinfo._id);
                        return [4 /*yield*/, this.getUser(userinfo._id)];
                    case 1:
                        user = _a.sent();
                        newu = false;
                        if (!!(user === null || user === void 0 ? void 0 : user._id)) return [3 /*break*/, 3];
                        // if(!userinfo._id) userinfo._id = userinfo._id;
                        u = this.userStruct(userinfo, true);
                        newu = true;
                        return [4 /*yield*/, this.setUser(u)];
                    case 2:
                        wasSet = _a.sent();
                        structs = this.getLocalData(undefined, { 'ownerId': u._id });
                        if ((structs === null || structs === void 0 ? void 0 : structs.length) > 0)
                            this.updateServerData(structs, function (data) {
                                console.log('setData', data);
                            });
                        this.setAuthorizationsByGroup(u);
                        return [3 /*break*/, 4];
                    case 3:
                        u = user.user;
                        // u._id = user._id; //replace the unique mongo id for the secondary profile struct with the id for the userinfo for temp lookup purposes
                        for (prop in userinfo) { //checking that the token and user profile overlap correctly
                            dummystruct = this.userStruct();
                            if (u[prop] && prop !== '_id') {
                                if (Array.isArray(userinfo[prop])) {
                                    for (i = 0; i < u[prop].length; i++) { //check user props that are not in the token
                                        //console.log(userinfo[prop][i]);
                                        if (userinfo[prop].indexOf(u[prop][i]) < 0) {
                                            u[prop] = userinfo[prop];
                                            changed = true;
                                            break;
                                        }
                                    }
                                    if (!changed)
                                        for (i = 0; i < userinfo[prop].length; i++) { //check tlken props that are not in the user
                                            //console.log(userinfo[prop][i]);
                                            if (u[prop].indexOf(userinfo[prop][i]) < 0) {
                                                u[prop] = userinfo[prop];
                                                changed = true;
                                                break;
                                            }
                                        }
                                }
                                else if (u[prop] !== userinfo[prop]) {
                                    u[prop] = userinfo[prop];
                                    changed = true;
                                }
                            }
                            else if (u[prop] !== userinfo[prop] && typeof dummystruct[prop] == 'string' && prop !== '_id') {
                                //console.log(prop, u[prop])
                                u[prop] = userinfo[prop];
                                changed = true;
                            }
                        }
                        if (user === null || user === void 0 ? void 0 : user.authorizations) {
                            if (Array.isArray(user.authorizations)) {
                                this.setLocalData(user.authorizations);
                            }
                        }
                        if (user === null || user === void 0 ? void 0 : user.groups) {
                            if (Array.isArray(user.groups)) {
                                this.setLocalData(user.groups);
                            }
                        }
                        _a.label = 4;
                    case 4:
                        if (!newu) return [3 /*break*/, 5];
                        this.currentUser = u;
                        this.setLocalData(u);
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, this.getAllUserData(u._id, undefined)];
                    case 6:
                        data = _a.sent();
                        console.log("getServerData", data);
                        if (!data || data.length === 0) {
                        }
                        else {
                            this.setLocalData(data);
                            notes = data.filter(function (s) {
                                if (s.structType === 'notification') {
                                    if (_this.getLocalData('authorization', s.parent._id)) {
                                        return true;
                                    }
                                    if (s.parent.structType === 'user' || s.parent.structType === 'authorization') {
                                        return true;
                                    }
                                    if (!_this.getLocalData(s.parent.structType, s.parent._id))
                                        return true;
                                }
                            });
                            comments = data.filter(function (s) {
                                if (s.structType === 'comment') {
                                    return true;
                                }
                            });
                            toDelete_1 = [];
                            comments.forEach(function (comment) {
                                if (!_this.getLocalData('comment', { '_id': comment._id }))
                                    toDelete_1.push(comment._id);
                            });
                            if (toDelete_1.length > 0)
                                this.deleteData(toDelete_1); //extraneous comments
                            if (notes.length > 0) {
                                this.resolveNotifications(notes, false, undefined);
                                changed = true;
                            }
                            filtered = data.filter(function (o) {
                                if (o.structType !== 'notification')
                                    return true;
                            });
                            if (this.tablet)
                                this.tablet.sortStructsIntoTable(filtered);
                        }
                        // u = new UserObj(u)
                        // u = getUserCodes(u, true)
                        this.setLocalData(u); //user is now set up in whatever case 
                        console.log('currentUser', u);
                        this.currentUser = u;
                        console.log('collections', this.tablet.collections);
                        _a.label = 7;
                    case 7:
                        callback(this.currentUser);
                        return [2 /*return*/, this.currentUser];
                }
            });
        });
    };
    //just a customizable callback to preserve the default while adding your own
    StructRouter.prototype.onResult = function (data) {
    };
    //---------------------------------------------
    StructRouter.prototype.randomId = function (tag) {
        if (tag === void 0) { tag = ''; }
        return "".concat(tag + Math.floor(Math.random() + Math.random() * Math.random() * 10000000000000000));
    };
    //generically add any struct to a user's server data
    /**
        let struct = {
            _id: randomId(structType+'defaultId'),   //random id associated for unique identification, used for lookup and indexing
            structType: structType,     //this is how you will look it up by type in the server
            ownerId: parentUser?._id,     //owner user
            timestamp: Date.now(),      //date of creation
            parent: {structType:parentStruct?.structType,_id:parentStruct?._id}, //parent struct it's associated with (e.g. if it needs to spawn with it)
        }
     */
    StructRouter.prototype.addStruct = function (structType, props, //add any props you want to set, adding users[] with ids will tell who to notify if this struct is updated
    parentUser, parentStruct, updateServer) {
        if (structType === void 0) { structType = 'struct'; }
        if (props === void 0) { props = {}; }
        if (parentUser === void 0) { parentUser = undefined; }
        if (parentStruct === void 0) { parentStruct = undefined; }
        if (updateServer === void 0) { updateServer = true; }
        return __awaiter(this, void 0, void 0, function () {
            var newStruct;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newStruct = DS.Struct(structType, props, parentUser, parentStruct);
                        if (!updateServer) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.updateServerData([newStruct])[0]];
                    case 1:
                        newStruct = _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, newStruct];
                }
            });
        });
    };
    //simple response test
    StructRouter.prototype.ping = function (callback) {
        var _a;
        if (callback === void 0) { callback = function (res) { console.log(res); }; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.send('ping')];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //send a direct message to somebody
    StructRouter.prototype.sendMessage = function (userId, message, data, callback) {
        var _a;
        if (userId === void 0) { userId = ''; }
        if (message === void 0) { message = ''; }
        if (data === void 0) { data = undefined; }
        if (callback === void 0) { callback = function (res) { console.log(res); }; }
        return __awaiter(this, void 0, void 0, function () {
            var args, res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        args = [userId, message];
                        if (data)
                            args[2] = data;
                        return [4 /*yield*/, this.send.apply(this, __spreadArray(['sendMessage'], __read(args), false))];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //info can be email, id, username, or name. Returns their profile and authorizations
    StructRouter.prototype.getUser = function (info, callback) {
        var _a;
        if (info === void 0) { info = ''; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.send('structs/getUser', info)];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //get user basic info by id
    StructRouter.prototype.getUsers = function (ids, callback) {
        var _a;
        if (ids === void 0) { ids = []; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.send.apply(this, __spreadArray(['structs/getUsers'], __read(ids), false))];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0] // Pass Array
                        ;
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //info can be email, id, username, or name. Returns their profile and authorizations
    StructRouter.prototype.getUsersByRoles = function (userRoles, callback) {
        var _a;
        if (userRoles === void 0) { userRoles = []; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.send('structs/getUsersByRoles', userRoles)];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //pull all of the collections (except excluded collection names e.g. 'groups') for a user from the server
    StructRouter.prototype.getAllUserData = function (ownerId, excluded, callback) {
        var _a;
        if (excluded === void 0) { excluded = []; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.send('structs/getAllData', ownerId, excluded)];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //get data by specified details from the server. You can provide only one of the first 3 elements. The searchDict is for mongoDB search keys
    StructRouter.prototype.getData = function (collection, ownerId, searchDict, limit, skip, callback) {
        var _a;
        if (limit === void 0) { limit = 0; }
        if (skip === void 0) { skip = 0; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.send('structs/getData', collection, ownerId, searchDict, limit, skip)];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //get data by specified details from the server. You can provide only one of the first 3 elements. The searchDict is for mongoDB search keys
    StructRouter.prototype.getDataByIds = function (structIds, ownerId, collection, callback) {
        var _a;
        if (structIds === void 0) { structIds = []; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.send('structs/getDataByIdss', structIds, ownerId, collection)];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //get struct based on the parentId 
    StructRouter.prototype.getStructParentData = function (struct, callback) {
        var _a, _b, _c;
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var args, res;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!struct.parent)
                            return [2 /*return*/];
                        args = [(_a = struct.parent) === null || _a === void 0 ? void 0 : _a.structType, '_id', (_b = struct.parent) === null || _b === void 0 ? void 0 : _b._id];
                        return [4 /*yield*/, this.send.apply(this, __spreadArray(['structs/getData'], __read(args), false))];
                    case 1:
                        res = (_c = (_d.sent())) === null || _c === void 0 ? void 0 : _c[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    // //get struct(s) based on an array of ids or string id in the parent struct
    // async getStructChildData (struct,childPropName='', limit=0, skip=0, callback=this.baseServerCallback) {
    //     let children = struct[childPropName];
    //     if(!children) return;
    //     return await this.WebsocketClient.run(
    //         'getChildren',
    //         [children,limit,skip],
    //         this.socketId,
    //         this.WebsocketClient.origin,
    //         callback
    //     );
    // }
    //sets the user profile data on the server
    StructRouter.prototype.setUser = function (userStruct, callback) {
        var _a;
        if (userStruct === void 0) { userStruct = {}; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.send('structs/setUser', this.stripStruct(userStruct))];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //updates a user's necessary profile details if there are any discrepancies with the token
    StructRouter.prototype.checkUserToken = function (usertoken, user, callback) {
        if (user === void 0) { user = this.currentUser; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var changed, prop, dummystruct, i, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!usertoken)
                            return [2 /*return*/, false];
                        changed = false;
                        for (prop in usertoken) {
                            dummystruct = this.userStruct();
                            if (user[prop] && prop !== '_id') {
                                //console.log(prop)
                                if (Array.isArray(usertoken[prop])) {
                                    for (i = 0; i < user[prop].length; i++) { //check user props that are not in the token
                                        //console.log(usertoken[prop][i]);
                                        if (usertoken[prop].indexOf(user[prop][i]) < 0) {
                                            user[prop] = usertoken[prop];
                                            changed = true;
                                            break;
                                        }
                                    }
                                    if (!changed)
                                        for (i = 0; i < usertoken[prop].length; i++) { //check token props that are not in the user
                                            //console.log(usertoken[prop][i]);
                                            if (user[prop].indexOf(usertoken[prop][i]) < 0) {
                                                user[prop] = usertoken[prop];
                                                changed = true;
                                                break;
                                            }
                                        }
                                }
                                else if (user[prop] !== usertoken[prop]) {
                                    user[prop] = usertoken[prop];
                                    changed = true;
                                }
                            }
                            else if (!user[prop] && dummystruct[prop]) {
                                user[prop] = usertoken[prop];
                                changed = true;
                            }
                        }
                        if (!changed) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.setUser(user, callback)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [2 /*return*/, changed];
                }
            });
        });
    };
    /* strip circular references and update data on the server */
    StructRouter.prototype.updateServerData = function (structs, callback) {
        var _a;
        if (structs === void 0) { structs = []; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var copies, res;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        copies = new Array();
                        structs.forEach(function (struct) {
                            copies.push(_this.stripStruct(struct));
                        });
                        return [4 /*yield*/, this.send.apply(this, __spreadArray(['structs/setData'], __read(copies), false))];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //delete a list of structs from local and server
    StructRouter.prototype.deleteData = function (structs, callback) {
        var _a;
        if (structs === void 0) { structs = []; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var toDelete, res;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        toDelete = [];
                        structs.forEach(function (struct) {
                            if ((struct === null || struct === void 0 ? void 0 : struct.structType) && (struct === null || struct === void 0 ? void 0 : struct._id)) {
                                toDelete.push({
                                    structType: struct.structType,
                                    _id: struct._id
                                });
                                _this.deleteLocalData(struct);
                            }
                        });
                        console.log('deleting', toDelete);
                        return [4 /*yield*/, this.send.apply(this, __spreadArray(['structs/deleteData'], __read(toDelete), false))];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //delete user profile by ID on the server
    StructRouter.prototype.deleteUser = function (userId, callback) {
        var _a;
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!userId)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.send('structs/deleteUser', userId)];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //set a group struct on the server
    StructRouter.prototype.setGroup = function (groupStruct, callback) {
        var _a;
        if (groupStruct === void 0) { groupStruct = {}; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.send('structs/setGroup', this.stripStruct(groupStruct))];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //get group structs or single one by Id
    StructRouter.prototype.getGroups = function (userId, groupId, callback) {
        var _a;
        if (userId === void 0) { userId = this.currentUser._id; }
        if (groupId === void 0) { groupId = ''; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.send('structs/getGroups', userId, groupId)];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //deletes a group off the server
    StructRouter.prototype.deleteGroup = function (groupId, callback) {
        var _a;
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!groupId)
                            return [2 /*return*/];
                        this.deleteLocalData(groupId);
                        return [4 /*yield*/, this.send('structs/deleteGroup', groupId)];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //set an authorization struct on the server
    StructRouter.prototype.setAuthorization = function (authorizationStruct, callback) {
        var _a;
        if (authorizationStruct === void 0) { authorizationStruct = {}; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.send('structs/setAuth', this.stripStruct(authorizationStruct))];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //get an authorization struct by Id
    StructRouter.prototype.getAuthorizations = function (userId, authorizationId, callback) {
        var _a, _b;
        if (userId === void 0) { userId = (_a = this.currentUser) === null || _a === void 0 ? void 0 : _a._id; }
        if (authorizationId === void 0) { authorizationId = ''; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (userId === undefined)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.send('structs/getAuths', userId, authorizationId)];
                    case 1:
                        res = (_b = (_c.sent())) === null || _b === void 0 ? void 0 : _b[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //delete an authoriztion off the server
    StructRouter.prototype.deleteAuthorization = function (authorizationId, callback) {
        var _a;
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!authorizationId)
                            return [2 /*return*/];
                        this.deleteLocalData(authorizationId);
                        return [4 /*yield*/, this.send('structs/deleteAuth', authorizationId)];
                    case 1:
                        res = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                        callback(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    //notifications are GENERALIZED for all structs, where all authorized users will receive notifications when those structs are updated
    StructRouter.prototype.checkForNotifications = function (userId) {
        var _a;
        if (userId === void 0) { userId = (_a = this.currentUser) === null || _a === void 0 ? void 0 : _a._id; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getData('notification', userId)];
                    case 1: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    //setup authorizations automatically based on group
    StructRouter.prototype.setAuthorizationsByGroup = function (user) {
        if (user === void 0) { user = this.currentUser; }
        return __awaiter(this, void 0, void 0, function () {
            var auths;
            var _this = this;
            return __generator(this, function (_a) {
                auths = this.getLocalData('authorization', { 'ownerId': user._id });
                // console.log(u);
                user.userRoles.forEach(function (group) {
                    //group format e.g.
                    //reddoor_client
                    //reddoor_peer
                    var split = group.split('_');
                    var team = split[0];
                    var otherrole;
                    if (group.includes('client')) {
                        otherrole = team + '_peer';
                    }
                    else if (group.includes('peer')) {
                        otherrole = team + '_client';
                    }
                    else if (group.includes('admin')) {
                        otherrole = team + '_owner';
                    }
                    if (otherrole) {
                        _this.getUsersByRoles([otherrole], function (data) {
                            //console.log(res.data)
                            data === null || data === void 0 ? void 0 : data.forEach(function (groupie) {
                                var theirname = groupie.username;
                                if (!theirname)
                                    theirname = groupie.email;
                                if (!theirname)
                                    theirname = groupie.id;
                                var myname = user.username;
                                if (!myname)
                                    myname = user.email;
                                if (!myname)
                                    myname = user.id;
                                if (theirname !== myname) {
                                    if (group.includes('client')) {
                                        //don't re-set up existing authorizations 
                                        var found = auths.find(function (a) {
                                            if (a.authorizerId === groupie.id && a.authorizedId === user.id)
                                                return true;
                                        });
                                        if (!found)
                                            _this.authorizeUser(DS.ProfileStruct('user', user, user), groupie.id, theirname, user.id, myname, ['peer'], undefined, [group]);
                                    }
                                    else if (group.includes('peer')) {
                                        //don't re-set up existing authorizations 
                                        var found = auths.find(function (a) {
                                            if (a.authorizedId === groupie.id && a.authorizerId === user.id)
                                                return true;
                                        });
                                        if (!found)
                                            _this.authorizeUser(DS.ProfileStruct('user', user, user), user.id, myname, groupie.id, theirname, ['peer'], undefined, [group]);
                                    }
                                }
                            });
                        });
                    }
                });
                return [2 /*return*/];
            });
        });
    };
    //delete a discussion or chatroom and associated comments
    StructRouter.prototype.deleteRoom = function (roomStruct) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var toDelete;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!roomStruct)
                            return [2 /*return*/, false];
                        toDelete = [roomStruct];
                        (_a = roomStruct.comments) === null || _a === void 0 ? void 0 : _a.forEach(function (id) {
                            var struct = _this.getLocalData('comment', { '_id': id });
                            toDelete.push(struct);
                        });
                        if (!roomStruct) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.deleteData(toDelete)];
                    case 1: return [2 /*return*/, _b.sent()];
                    case 2: return [2 /*return*/, false];
                }
            });
        });
    };
    //delete comment and associated replies by recursive gets
    StructRouter.prototype.deleteComment = function (commentStruct) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var allReplies, getRepliesRecursive, parent, toUpdate, replyTo, idx;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        allReplies = [commentStruct];
                        getRepliesRecursive = function (head) {
                            if (head === void 0) { head = commentStruct; }
                            if (head === null || head === void 0 ? void 0 : head.replies) {
                                head.replies.forEach(function (replyId) {
                                    var reply = _this.getLocalData('comment', { '_id': replyId });
                                    if (reply) {
                                        if (reply.replies.length > 0) {
                                            reply.replies.forEach(function (replyId2) {
                                                getRepliesRecursive(replyId2); //check down a level if it exists
                                            });
                                        }
                                        allReplies.push(reply); //then return this level's id
                                    }
                                });
                            }
                        };
                        getRepliesRecursive(commentStruct);
                        parent = this.getLocalData((_a = commentStruct.parent) === null || _a === void 0 ? void 0 : _a.structType, { '_id': (_b = commentStruct.parent) === null || _b === void 0 ? void 0 : _b._id });
                        toUpdate = [];
                        if (parent) {
                            toUpdate = [parent];
                            allReplies.forEach(function (r) {
                                var _a, _b;
                                var idx = (_a = parent.replies) === null || _a === void 0 ? void 0 : _a.indexOf(r._id);
                                if (idx > -1)
                                    parent.replies.splice(idx, 1);
                                var idx2 = (_b = parent.comments) === null || _b === void 0 ? void 0 : _b.indexOf(r._id);
                                if (idx2 > -1)
                                    parent.comments.splice(idx2, 1);
                            });
                        }
                        replyTo = this.getLocalData('comment', { '_id': commentStruct.replyTo });
                        if ((replyTo === null || replyTo === void 0 ? void 0 : replyTo._id) !== (parent === null || parent === void 0 ? void 0 : parent._id)) {
                            idx = (_c = replyTo.replies) === null || _c === void 0 ? void 0 : _c.indexOf(parent._id);
                            if (idx > -1)
                                replyTo.replies.splice(idx, 1);
                            toUpdate.push(replyTo);
                        }
                        if (!(toUpdate.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.updateServerData(toUpdate)];
                    case 1:
                        _d.sent();
                        _d.label = 2;
                    case 2: return [4 /*yield*/, this.deleteData(allReplies)];
                    case 3: return [2 /*return*/, _d.sent()];
                }
            });
        });
    };
    //get user data by their auth struct (e.g. if you don't grab their id directly), includes collection, limits, skips
    StructRouter.prototype.getUserDataByAuthorization = function (authorizationStruct, collection, searchDict, limit, skip, callback) {
        if (limit === void 0) { limit = 0; }
        if (skip === void 0) { skip = 0; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var u;
            var _this = this;
            return __generator(this, function (_a) {
                u = authorizationStruct.authorizerId;
                if (u) {
                    return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                            var _this = this;
                            return __generator(this, function (_a) {
                                this.getUser(u, function (data) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!!collection) return [3 /*break*/, 2];
                                                return [4 /*yield*/, this.getAllUserData(u, ['notification'], callback)];
                                            case 1:
                                                _a.sent();
                                                return [3 /*break*/, 4];
                                            case 2: return [4 /*yield*/, this.getData(collection, u, searchDict, limit, skip, callback)];
                                            case 3:
                                                _a.sent();
                                                _a.label = 4;
                                            case 4:
                                                resolve(data);
                                                callback(data);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }); //gets profile deets
                                return [2 /*return*/];
                            });
                        }); })];
                }
                else
                    return [2 /*return*/, undefined];
                return [2 /*return*/];
            });
        });
    };
    //get user data for all users in a group, includes collection, limits, skips
    StructRouter.prototype.getUserDataByAuthorizationGroup = function (groupId, collection, searchDict, limit, skip, callback) {
        if (groupId === void 0) { groupId = ''; }
        if (limit === void 0) { limit = 0; }
        if (skip === void 0) { skip = 0; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function () {
            var auths, results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        auths = this.getLocalData('authorization');
                        results = [];
                        return [4 /*yield*/, Promise.all(auths.map(function (o) { return __awaiter(_this, void 0, void 0, function () {
                                var u, data, user;
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            if (!((_a = o.groups) === null || _a === void 0 ? void 0 : _a.includes(groupId))) return [3 /*break*/, 7];
                                            u = o.authorizerId;
                                            if (!u) return [3 /*break*/, 6];
                                            data = void 0;
                                            return [4 /*yield*/, this.getUser(u, callback)];
                                        case 1:
                                            user = _b.sent();
                                            if (user)
                                                results.push(user);
                                            if (!!collection) return [3 /*break*/, 3];
                                            return [4 /*yield*/, this.getAllUserData(u, ['notification'], callback)];
                                        case 2:
                                            data = _b.sent();
                                            return [3 /*break*/, 5];
                                        case 3: return [4 /*yield*/, this.getData(collection, u, searchDict, limit, skip, callback)];
                                        case 4:
                                            data = _b.sent();
                                            _b.label = 5;
                                        case 5:
                                            if (data)
                                                results.push(data);
                                            _b.label = 6;
                                        case 6: return [2 /*return*/, true];
                                        case 7: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, results]; //will be a weird result till this is tested more
                }
            });
        });
    };
    //
    //just assigns replacement object to old object if it exists, keeps things from losing parent context in UI
    StructRouter.prototype.overwriteLocalData = function (structs) {
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
    StructRouter.prototype.setLocalData = function (structs) {
        this.tablet.setLocalData(structs);
    };
    //pull a struct by collection, owner, and key/value pair from the local platform, leave collection blank to pull all ownerId associated data
    StructRouter.prototype.getLocalData = function (collection, query) {
        return this.tablet.getLocalData(collection, query);
    };
    StructRouter.prototype.getLocalReplies = function (struct) {
        var replies = [];
        if (!struct.replies)
            return replies;
        else if (struct.replies.reduce(function (a, b) { return a * ((typeof b === 'object') ? 1 : 0); }, 1))
            return struct.replies; // just return objects
        replies = this.getLocalData('comment', { 'replyTo': struct._id });
        return replies;
    };
    StructRouter.prototype.hasLocalAuthorization = function (otherUserId, ownerId) {
        if (ownerId === void 0) { ownerId = this.currentUser._id; }
        var auths = this.getLocalData('authorization', { ownerId: ownerId });
        var found = auths.find(function (a) {
            if (a.authorizedId === ownerId && a.authorizerId === otherUserId)
                return true;
            if (a.authorizerId === ownerId && a.authorizedId === otherUserId)
                return true;
        });
        if (found) {
            return found;
        }
        else
            return false;
    };
    //pass a single struct or array of structs
    StructRouter.prototype.deleteLocalData = function (structs) {
        var _this = this;
        if (Array.isArray(structs))
            structs.forEach(function (s) { return _this.deleteStruct(s); });
        else
            this.deleteStruct(structs); //single
        return true;
    };
    StructRouter.prototype.deleteStruct = function (struct) {
        if (typeof struct === 'string')
            struct = this.getLocalData(struct); //get the struct if an id was supplied
        if (!struct)
            throw new Error('Struct not supplied');
        if (!struct.structType || !struct._id)
            return false;
        this.tablet.collections.get(struct.structType).delete(struct._id);
        return true;
    };
    //strips circular references from the struct used clientside, returns a soft copy with the changes
    StructRouter.prototype.stripStruct = function (struct) {
        if (struct === void 0) { struct = {}; }
        var copy = Object.assign({}, struct);
        for (var prop in copy) {
            if (copy[prop] === undefined || copy[prop].constructor.name === 'Map')
                delete copy[prop]; //delete undefined 
        }
        return copy;
    };
    //create a struct with the prepared props to be filled out
    StructRouter.prototype.createStruct = function (structType, props, parentUser, parentStruct) {
        if (parentUser === void 0) { parentUser = this.currentUser; }
        var struct = DS.Struct(structType, props, parentUser, parentStruct);
        return struct;
    };
    StructRouter.prototype.userStruct = function (props, currentUser) {
        if (props === void 0) { props = {}; }
        if (currentUser === void 0) { currentUser = false; }
        var user = DS.ProfileStruct('user', props, props);
        if (props._id)
            user.id = props._id; //references the token id
        else if (props.id)
            user.id = props.id;
        else
            user.id = 'user' + Math.floor(Math.random() * 10000000000);
        user._id = user.id; //for mongo stuff
        user.ownerId = user.id;
        for (var prop in props) {
            if (Object.keys(DS.ProfileStruct()).indexOf(prop) < 0) {
                delete user[prop];
            } //delete non-dependent data (e.g. tokens we only want to keep in a secure collection)
        }
        if (currentUser)
            this.currentUser = user;
        return user;
    };
    //these can be used to add some metadata to arrays of data kept in a DataStruct
    StructRouter.prototype.dataObject = function (data, type, timestamp) {
        if (data === void 0) { data = undefined; }
        if (type === void 0) { type = 'any'; }
        if (timestamp === void 0) { timestamp = Date.now(); }
        return {
            type: type,
            data: data,
            timestamp: timestamp
        };
    };
    return StructRouter;
}(Router));
export default StructRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RydWN0cy5yb3V0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zdHJ1Y3RzLnJvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUVsRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDNUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sYUFBYSxNQUFNLG1CQUFtQixDQUFDO0FBRTlDLGtFQUFrRTtBQUNsRSxFQUFFO0FBQ0YsY0FBYztBQUNkLHlDQUF5QztBQUN6QyxFQUFFO0FBRUY7SUFBMkIsZ0NBQU07SUFPN0Isc0JBQWEsUUFBK0IsRUFBRSxPQUFzQjtRQUF2RCx5QkFBQSxFQUFBLGFBQStCO1FBQTVDLFlBQ0ksa0JBQU0sT0FBTyxDQUFDLFNBTWpCO1FBWEQsWUFBTSxHQUFHLElBQUksVUFBVSxFQUFFLENBQUMsQ0FBQyxhQUFhO1FBQ3hDLGlCQUFXLEdBQUcsS0FBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDdEMsUUFBRSxHQUFXLFFBQVEsRUFBRSxDQUFBO1FBeUp2QiwwQ0FBMEM7UUFDMUMsd0JBQWtCLEdBQUcsVUFBQyxJQUFJO1lBRXRCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztZQUNuQixJQUFHLE9BQU8sSUFBSSxLQUFLLFFBQVEsS0FBSSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsVUFBVSxDQUFBO2dCQUFFLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xFLElBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLHNCQUFzQjtnQkFFNUMsSUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFDLENBQUM7b0JBQzVCLElBQUcsQ0FBQyxDQUFDLFVBQVUsS0FB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