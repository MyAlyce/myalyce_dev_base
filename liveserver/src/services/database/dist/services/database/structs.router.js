import { __awaiter } from "tslib";
import { DataTablet, DS } from 'brainsatplay-data';
import { Router } from '../../router/Router';
import { randomId } from '../../common/id.utils';
import StructService from './structs.service';
//Joshua Brewster, Garrett Flynn   -   GNU Affero GPL V3.0 License
//
// Description
// A client-side Router class with macros
//
class StructRouter extends Router {
    constructor(userInfo = {}, options) {
        super(options);
        this.tablet = new DataTablet(); //DataTablet 
        this.collections = this.tablet.collections;
        this.id = randomId();
        //default socket response for the platform
        this.baseServerCallback = (data) => {
            let structs = data;
            if (typeof data === 'object' && (data === null || data === void 0 ? void 0 : data.structType))
                structs = [data];
            if (Array.isArray(data)) { //getUserData response
                let filtered = structs.filter((o) => {
                    if (o.structType !== 'notification')
                        return true;
                });
                if (this.tablet)
                    this.tablet.sortStructsIntoTable(filtered);
                structs.forEach((struct) => {
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
                        this.setLocalData(struct);
                    }
                    else {
                        if (struct.structType === 'notification') {
                            let found = this.getLocalData('notification', { 'ownerId': struct.ownerId, '_id': struct.parent._id });
                            if (found) {
                                this.setLocalData(struct);
                            }
                            else {
                                if (this.getLocalData(struct.structType, { '_id': struct.parent._id })) {
                                    //this.resolveNotifications([struct],false);
                                }
                                else {
                                    this.overwriteLocalData(struct);
                                }
                            }
                            // TODO: Ignores notifications when the current user still has not resolved
                            if (struct.ownerId === ((_a = this.currentUser) === null || _a === void 0 ? void 0 : _a._id) &&
                                (struct.parent.structType === 'user' || //all of the notification instances we want to pull automatically, chats etc should resolve when we want to view/are actively viewing them
                                    struct.parent.structType === 'dataInstance' ||
                                    struct.parent.structType === 'schedule' ||
                                    struct.parent.structType === 'authorization')) {
                                this.resolveNotifications([struct], true);
                            }
                        }
                        else {
                            this.overwriteLocalData(struct);
                            //console.log(struct)
                        }
                    }
                });
            }
            if ((data === null || data === void 0 ? void 0 : data.message) === 'notifications') {
                this.checkForNotifications(); //pull notifications
            }
            if ((data === null || data === void 0 ? void 0 : data.message) === 'deleted') {
                this.deleteLocalData(data.id); //remove local instance
            }
            this.onResult(data);
        };
        //pass notifications you're ready to resolve and set pull to true to grab the associated data structure.
        this.resolveNotifications = (notifications = [], pull = true, user = this.currentUser) => __awaiter(this, void 0, void 0, function* () {
            if (!user || notifications.length === 0)
                return;
            let structIds = [];
            let notificationIds = [];
            let nTypes = [];
            //console.log(notifications);
            let unote = false;
            if (notifications.length === 0)
                notifications = this.getLocalData('notification', { 'ownerId': user._id });
            notifications.forEach((struct) => {
                if (struct.parent.structType === 'user')
                    unote = true;
                nTypes.push(struct.parent.structType);
                structIds.push(struct.parent._id);
                notificationIds.push(struct._id);
                //console.log(struct)
                this.deleteLocalData(struct); //delete local entries and update profile
                //console.log(this.structs.get(struct._id));
            });
            this.deleteData(notificationIds); //delete server entries
            if (pull) {
                nTypes.reverse().forEach((note, i) => {
                    // if(note === 'comment') { //when resolving comments we need to pull the tree (temp)
                    //     this.getParentData(structIds[i],(res)=>{
                    //         this.defaultCallback(res);
                    //         if(res.data) this.getChildData(res.data._id,'comments');
                    //     });
                    //     structIds.splice(i,1);
                    // }
                    if (note === 'user') {
                        this.getUser(notificationIds[i]);
                        structIds.splice(structIds.length - i - 1, 1);
                    }
                });
                if (structIds.length > 0)
                    return yield this.getDataByIds(structIds, user._id, 'notification');
            }
            return true;
        });
        //get auths where you have granted somebody peer access
        this.getLocalUserPeerIds = (user = this.currentUser) => {
            if (!user)
                return [];
            let result = [];
            let authorizations = this.getLocalData('authorization', user._id);
            authorizations.forEach((a) => {
                if (a.authorizations.indexOf('peer') > -1 && a.authorizerId === user._id)
                    result.push(a.authorizedId);
            });
            return result;
        };
        //TODO: Update the rest of these to use the DB structs but this should all work the same for now
        this.authorizeUser = (parentUser, authorizerUserId = '', authorizerUserName = '', authorizedUserId = '', authorizedUserName = '', authorizations = [], // TODO: really any[] or has type??
        structs = [], excluded = [], groups = [], expires = false) => __awaiter(this, void 0, void 0, function* () {
            if (!parentUser)
                return undefined;
            let newAuthorization = this.createStruct('authorization', undefined, parentUser, undefined);
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
            newAuthorization = yield this.setAuthorization(newAuthorization);
            return newAuthorization;
        });
        this.addGroup = (parentUser, name = '', details = '', admins = [], peers = [], clients = [], updateServer = true) => __awaiter(this, void 0, void 0, function* () {
            if (!parentUser)
                return undefined;
            let newGroup = this.createStruct('group', undefined, parentUser); //auto assigns instances to assigned users' data views
            newGroup.name = name;
            newGroup.details = details;
            newGroup.admins = admins;
            newGroup.peers = peers;
            newGroup.clients = clients;
            newGroup.users = [...admins, ...peers, ...clients];
            newGroup.ownerId = parentUser._id;
            //this.setLocalData(newGroup);
            if (updateServer) {
                newGroup = yield this.setGroup(newGroup);
            }
            return newGroup;
        });
        this.addData = (parentUser, author = '', title = '', type = '', data = [], expires = false, updateServer = true) => __awaiter(this, void 0, void 0, function* () {
            if (!parentUser)
                return undefined;
            let newDataInstance = this.createStruct('dataInstance', undefined, parentUser); //auto assigns instances to assigned users' data views
            newDataInstance.author = author;
            newDataInstance.title = title;
            newDataInstance.type = type;
            newDataInstance.data = data;
            newDataInstance.expires = expires;
            newDataInstance.ownerId = parentUser._id;
            //this.setLocalData(newDataInstance);
            if (updateServer)
                newDataInstance = yield this.updateServerData([newDataInstance])[0];
            return newDataInstance;
        });
        this.addEvent = (parentUser, author = '', event = '', notes = '', startTime = 0, endTime = 0, grade = 0, attachments = [], users = [], updateServer = true) => __awaiter(this, void 0, void 0, function* () {
            if (!parentUser)
                return undefined;
            if (users.length === 0)
                users = this.getLocalUserPeerIds(parentUser);
            let newEvent = this.createStruct('event', undefined, parentUser);
            newEvent.author = author;
            newEvent.event = event;
            newEvent.notes = notes;
            newEvent.startTime = startTime;
            newEvent.endTime = endTime;
            newEvent.grade = grade;
            newEvent.attachments = attachments;
            newEvent.users = users;
            newEvent.ownerId = parentUser._id;
            //this.setLocalData(newEvent);
            if (updateServer)
                newEvent = yield this.updateServerData([newEvent])[0];
            return newEvent;
        });
        //create discussion board topic
        this.addDiscussion = (parentUser, authorId = '', topic = '', category = '', message = '', attachments = [], users = [], updateServer = true) => __awaiter(this, void 0, void 0, function* () {
            if (!parentUser)
                return undefined;
            if (users.length === 0)
                users = this.getLocalUserPeerIds(parentUser); //adds the peer ids if none other provided
            let newDiscussion = this.createStruct('discussion', undefined, parentUser);
            newDiscussion.topic = topic;
            newDiscussion.category = category;
            newDiscussion.message = message;
            newDiscussion.attachments = attachments;
            newDiscussion.authorId = authorId;
            newDiscussion.users = users;
            newDiscussion.comments = [];
            newDiscussion.replies = [];
            newDiscussion.ownerId = parentUser._id;
            //this.setLocalData(newDiscussion);
            let update = [newDiscussion];
            if (updateServer)
                newDiscussion = yield this.updateServerData(update)[0];
            return newDiscussion;
        });
        this.addChatroom = (parentUser, authorId = '', message = '', attachments = [], users = [], updateServer = true) => __awaiter(this, void 0, void 0, function* () {
            if (!parentUser)
                return undefined;
            if (users.length === 0)
                users = this.getLocalUserPeerIds(parentUser); //adds the peer ids if none other provided
            let newChatroom = this.createStruct('chatroom', undefined, parentUser);
            newChatroom.message = message;
            newChatroom.attachments = attachments;
            newChatroom.authorId = authorId;
            newChatroom.users = users;
            newChatroom.replies = [];
            newChatroom.comments = [];
            newChatroom.ownerId = parentUser._id;
            let update = [newChatroom];
            if (updateServer)
                newChatroom = yield this.updateServerData(update)[0];
            return newChatroom;
        });
        //add comment to chatroom or discussion board
        this.addComment = (parentUser, roomStruct, replyTo, authorId = '', message = '', attachments = [], updateServer = true) => __awaiter(this, void 0, void 0, function* () {
            if (!parentUser)
                return undefined;
            let newComment = this.createStruct('comment', undefined, parentUser, roomStruct);
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
            //this.setLocalData(newComment);
            let update = [newComment, roomStruct];
            if (replyTo._id !== roomStruct._id)
                update.push(replyTo);
            if (updateServer)
                newComment = yield this.updateServerData(update)[0];
            return newComment;
        });
        if (userInfo instanceof Object && Object.keys(userInfo).length > 0)
            this.setupUser(userInfo); // Declares currentUser
        // Auto-Connect Struct Client Service
        this.load(new StructService(this));
    }
    //TODO: make this able to be awaited to return the currentUser
    //uses a bunch of the functions below to set up a user and get their data w/ some cross checking for consistent profiles
    setupUser(userinfo, callback = (currentUser) => { }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userinfo) {
                console.error('must provide an info object! e.g. {_id:"abc123"}');
                callback(undefined);
                return undefined;
            }
            let changed = false;
            if (userinfo.id)
                userinfo._id = userinfo.id;
            // let res = await this.login();
            console.log("Generating/Getting User: ", userinfo._id);
            let user = yield this.getUser(userinfo._id);
            // console.log("getUser", user);
            let u;
            let newu = false;
            if (!(user === null || user === void 0 ? void 0 : user._id)) { //no profile, create new one and push initial results
                // if(!userinfo._id) userinfo._id = userinfo._id;
                u = this.userStruct(userinfo, true);
                newu = true;
                let wasSet = yield this.setUser(u);
                let structs = this.getLocalData(undefined, { 'ownerId': u._id });
                if ((structs === null || structs === void 0 ? void 0 : structs.length) > 0)
                    this.updateServerData(structs, (data) => {
                        console.log('setData', data);
                    });
                this.setAuthorizationsByGroup(u);
            }
            else {
                u = user.user;
                // u._id = user._id; //replace the unique mongo id for the secondary profile struct with the id for the userinfo for temp lookup purposes
                for (const prop in userinfo) { //checking that the token and user profile overlap correctly
                    let dummystruct = this.userStruct();
                    if (u[prop] && prop !== '_id') {
                        if (Array.isArray(userinfo[prop])) {
                            for (let i = 0; i < u[prop].length; i++) { //check user props that are not in the token
                                //console.log(userinfo[prop][i]);
                                if (userinfo[prop].indexOf(u[prop][i]) < 0) {
                                    u[prop] = userinfo[prop];
                                    changed = true;
                                    break;
                                }
                            }
                            if (!changed)
                                for (let i = 0; i < userinfo[prop].length; i++) { //check tlken props that are not in the user
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
            }
            if (newu) {
                this.currentUser = u;
                this.setLocalData(u);
            }
            else {
                let data = yield this.getAllUserData(u._id, undefined);
                console.log("getServerData", data);
                if (!data || data.length === 0) {
                }
                else {
                    this.setLocalData(data);
                    //resolve redundant notifications
                    let notes = data.filter((s) => {
                        if (s.structType === 'notification') {
                            if (this.getLocalData('authorization', s.parent._id)) {
                                return true;
                            }
                            if (s.parent.structType === 'user' || s.parent.structType === 'authorization') {
                                return true;
                            }
                            if (!this.getLocalData(s.parent.structType, s.parent._id))
                                return true;
                        }
                    });
                    //resolves extraneous comments
                    let comments = data.filter((s) => {
                        if (s.structType === 'comment') {
                            return true;
                        }
                    });
                    let toDelete = [];
                    comments.forEach((comment) => {
                        if (!this.getLocalData('comment', { '_id': comment._id }))
                            toDelete.push(comment._id);
                    });
                    if (toDelete.length > 0)
                        this.deleteData(toDelete); //extraneous comments
                    if (notes.length > 0) {
                        this.resolveNotifications(notes, false, undefined);
                        changed = true;
                    }
                    let filtered = data.filter((o) => {
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
            }
            callback(this.currentUser);
            return this.currentUser;
        });
    }
    //just a customizable callback to preserve the default while adding your own
    onResult(data) {
    }
    //---------------------------------------------
    randomId(tag = '') {
        return `${tag + Math.floor(Math.random() + Math.random() * Math.random() * 10000000000000000)}`;
    }
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
    addStruct(structType = 'struct', props = {}, //add any props you want to set, adding users[] with ids will tell who to notify if this struct is updated
    parentUser = undefined, parentStruct = undefined, updateServer = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let newStruct = DS.Struct(structType, props, parentUser, parentStruct);
            if (updateServer)
                newStruct = yield this.updateServerData([newStruct])[0];
            return newStruct;
        });
    }
    //simple response test
    ping(callback = (res) => { console.log(res); }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let res = (_a = (yield this.send('ping'))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //send a direct message to somebody
    sendMessage(userId = '', message = '', data = undefined, callback = (res) => { console.log(res); }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let args = [userId, message];
            if (data)
                args[2] = data;
            let res = (_a = (yield this.send('sendMessage', ...args))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //info can be email, id, username, or name. Returns their profile and authorizations
    getUser(info = '', callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let res = (_a = (yield this.send('structs/getUser', info))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //get user basic info by id
    getUsers(ids = [], callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let res = (_a = (yield this.send('structs/getUsers', ...ids))) === null || _a === void 0 ? void 0 : _a[0]; // Pass Array
            callback(res);
            return res;
        });
    }
    //info can be email, id, username, or name. Returns their profile and authorizations
    getUsersByRoles(userRoles = [], callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let res = (_a = (yield this.send('structs/getUsersByRoles', userRoles))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //pull all of the collections (except excluded collection names e.g. 'groups') for a user from the server
    getAllUserData(ownerId, excluded = [], callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let res = (_a = (yield this.send('structs/getAllData', ownerId, excluded))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //get data by specified details from the server. You can provide only one of the first 3 elements. The searchDict is for mongoDB search keys
    getData(collection, ownerId, searchDict, limit = 0, skip = 0, callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let res = (_a = (yield this.send('structs/getData', collection, ownerId, searchDict, limit, skip))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //get data by specified details from the server. You can provide only one of the first 3 elements. The searchDict is for mongoDB search keys
    getDataByIds(structIds = [], ownerId, collection, callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let res = (_a = (yield this.send('structs/getDataByIdss', structIds, ownerId, collection))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //get struct based on the parentId 
    getStructParentData(struct, callback = this.baseServerCallback) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!struct.parent)
                return;
            let args = [(_a = struct.parent) === null || _a === void 0 ? void 0 : _a.structType, '_id', (_b = struct.parent) === null || _b === void 0 ? void 0 : _b._id];
            let res = (_c = (yield this.send('structs/getData', ...args))) === null || _c === void 0 ? void 0 : _c[0];
            callback(res);
            return res;
        });
    }
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
    setUser(userStruct = {}, callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let res = (_a = (yield this.send('structs/setUser', this.stripStruct(userStruct)))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //updates a user's necessary profile details if there are any discrepancies with the token
    checkUserToken(usertoken, user = this.currentUser, callback = this.baseServerCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!usertoken)
                return false;
            let changed = false;
            for (const prop in usertoken) {
                let dummystruct = this.userStruct();
                if (user[prop] && prop !== '_id') {
                    //console.log(prop)
                    if (Array.isArray(usertoken[prop])) {
                        for (let i = 0; i < user[prop].length; i++) { //check user props that are not in the token
                            //console.log(usertoken[prop][i]);
                            if (usertoken[prop].indexOf(user[prop][i]) < 0) {
                                user[prop] = usertoken[prop];
                                changed = true;
                                break;
                            }
                        }
                        if (!changed)
                            for (let i = 0; i < usertoken[prop].length; i++) { //check token props that are not in the user
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
            if (changed)
                return yield this.setUser(user, callback);
            return changed;
        });
    }
    /* strip circular references and update data on the server */
    updateServerData(structs = [], callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const copies = new Array();
            structs.forEach((struct) => {
                copies.push(this.stripStruct(struct));
            });
            let res = (_a = (yield this.send('structs/setData', ...copies))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //delete a list of structs from local and server
    deleteData(structs = [], callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let toDelete = [];
            structs.forEach((struct) => {
                if ((struct === null || struct === void 0 ? void 0 : struct.structType) && (struct === null || struct === void 0 ? void 0 : struct._id)) {
                    toDelete.push({
                        structType: struct.structType,
                        _id: struct._id
                    });
                    this.deleteLocalData(struct);
                }
            });
            console.log('deleting', toDelete);
            let res = (_a = (yield this.send('structs/deleteData', ...toDelete))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //delete user profile by ID on the server
    deleteUser(userId, callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId)
                return;
            let res = (_a = (yield this.send('structs/deleteUser', userId))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //set a group struct on the server
    setGroup(groupStruct = {}, callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let res = (_a = (yield this.send('structs/setGroup', this.stripStruct(groupStruct)))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //get group structs or single one by Id
    getGroups(userId = this.currentUser._id, groupId = '', callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let res = (_a = (yield this.send('structs/getGroups', userId, groupId))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //deletes a group off the server
    deleteGroup(groupId, callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!groupId)
                return;
            this.deleteLocalData(groupId);
            let res = (_a = (yield this.send('structs/deleteGroup', groupId))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //set an authorization struct on the server
    setAuthorization(authorizationStruct = {}, callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let res = (_a = (yield this.send('structs/setAuth', this.stripStruct(authorizationStruct)))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //get an authorization struct by Id
    getAuthorizations(userId, authorizationId, callback) {
        var _a, _b;
        if (userId === void 0) { userId = (_a = this.currentUser) === null || _a === void 0 ? void 0 : _a._id; }
        if (authorizationId === void 0) { authorizationId = ''; }
        if (callback === void 0) { callback = this.baseServerCallback; }
        return __awaiter(this, void 0, void 0, function* () {
            if (userId === undefined)
                return;
            let res = (_b = (yield this.send('structs/getAuths', userId, authorizationId))) === null || _b === void 0 ? void 0 : _b[0];
            callback(res);
            return res;
        });
    }
    //delete an authoriztion off the server
    deleteAuthorization(authorizationId, callback = this.baseServerCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!authorizationId)
                return;
            this.deleteLocalData(authorizationId);
            let res = (_a = (yield this.send('structs/deleteAuth', authorizationId))) === null || _a === void 0 ? void 0 : _a[0];
            callback(res);
            return res;
        });
    }
    //notifications are GENERALIZED for all structs, where all authorized users will receive notifications when those structs are updated
    checkForNotifications(userId) {
        var _a;
        if (userId === void 0) { userId = (_a = this.currentUser) === null || _a === void 0 ? void 0 : _a._id; }
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getData('notification', userId);
        });
    }
    //setup authorizations automatically based on group
    setAuthorizationsByGroup(user = this.currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            let auths = this.getLocalData('authorization', { 'ownerId': user._id });
            // console.log(u);
            user.userRoles.forEach((group) => {
                //group format e.g.
                //reddoor_client
                //reddoor_peer
                let split = group.split('_');
                let team = split[0];
                let otherrole;
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
                    this.getUsersByRoles([otherrole], (data) => {
                        //console.log(res.data)
                        data === null || data === void 0 ? void 0 : data.forEach((groupie) => {
                            let theirname = groupie.username;
                            if (!theirname)
                                theirname = groupie.email;
                            if (!theirname)
                                theirname = groupie.id;
                            let myname = user.username;
                            if (!myname)
                                myname = user.email;
                            if (!myname)
                                myname = user.id;
                            if (theirname !== myname) {
                                if (group.includes('client')) {
                                    //don't re-set up existing authorizations 
                                    let found = auths.find((a) => {
                                        if (a.authorizerId === groupie.id && a.authorizedId === user.id)
                                            return true;
                                    });
                                    if (!found)
                                        this.authorizeUser(DS.ProfileStruct('user', user, user), groupie.id, theirname, user.id, myname, ['peer'], undefined, [group]);
                                }
                                else if (group.includes('peer')) {
                                    //don't re-set up existing authorizations 
                                    let found = auths.find((a) => {
                                        if (a.authorizedId === groupie.id && a.authorizerId === user.id)
                                            return true;
                                    });
                                    if (!found)
                                        this.authorizeUser(DS.ProfileStruct('user', user, user), user.id, myname, groupie.id, theirname, ['peer'], undefined, [group]);
                                }
                            }
                        });
                    });
                }
            });
        });
    }
    //delete a discussion or chatroom and associated comments
    deleteRoom(roomStruct) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!roomStruct)
                return false;
            let toDelete = [roomStruct];
            (_a = roomStruct.comments) === null || _a === void 0 ? void 0 : _a.forEach((id) => {
                let struct = this.getLocalData('comment', { '_id': id });
                toDelete.push(struct);
            });
            if (roomStruct)
                return yield this.deleteData(toDelete);
            else
                return false;
        });
    }
    //delete comment and associated replies by recursive gets
    deleteComment(commentStruct) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            let allReplies = [commentStruct];
            let getRepliesRecursive = (head = commentStruct) => {
                if (head === null || head === void 0 ? void 0 : head.replies) {
                    head.replies.forEach((replyId) => {
                        let reply = this.getLocalData('comment', { '_id': replyId });
                        if (reply) {
                            if (reply.replies.length > 0) {
                                reply.replies.forEach((replyId2) => {
                                    getRepliesRecursive(replyId2); //check down a level if it exists
                                });
                            }
                            allReplies.push(reply); //then return this level's id
                        }
                    });
                }
            };
            getRepliesRecursive(commentStruct);
            //need to wipe the commentIds off the parent struct comments and replyTo replies
            let parent = this.getLocalData((_a = commentStruct.parent) === null || _a === void 0 ? void 0 : _a.structType, { '_id': (_b = commentStruct.parent) === null || _b === void 0 ? void 0 : _b._id });
            let toUpdate = [];
            if (parent) {
                toUpdate = [parent];
                allReplies.forEach((r) => {
                    var _a, _b;
                    let idx = (_a = parent.replies) === null || _a === void 0 ? void 0 : _a.indexOf(r._id);
                    if (idx > -1)
                        parent.replies.splice(idx, 1);
                    let idx2 = (_b = parent.comments) === null || _b === void 0 ? void 0 : _b.indexOf(r._id);
                    if (idx2 > -1)
                        parent.comments.splice(idx2, 1);
                });
            }
            let replyTo = this.getLocalData('comment', { '_id': commentStruct.replyTo });
            if ((replyTo === null || replyTo === void 0 ? void 0 : replyTo._id) !== (parent === null || parent === void 0 ? void 0 : parent._id)) {
                let idx = (_c = replyTo.replies) === null || _c === void 0 ? void 0 : _c.indexOf(parent._id); // NOTE: Should this look for the corresponding parent id?
                if (idx > -1)
                    replyTo.replies.splice(idx, 1);
                toUpdate.push(replyTo);
            }
            if (toUpdate.length > 0)
                yield this.updateServerData(toUpdate);
            return yield this.deleteData(allReplies);
        });
    }
    //get user data by their auth struct (e.g. if you don't grab their id directly), includes collection, limits, skips
    getUserDataByAuthorization(authorizationStruct, collection, searchDict, limit = 0, skip = 0, callback = this.baseServerCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            let u = authorizationStruct.authorizerId;
            if (u) {
                return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    this.getUser(u, (data) => __awaiter(this, void 0, void 0, function* () {
                        if (!collection)
                            yield this.getAllUserData(u, ['notification'], callback);
                        else
                            yield this.getData(collection, u, searchDict, limit, skip, callback);
                        resolve(data);
                        callback(data);
                    })); //gets profile deets
                }));
            }
            else
                return undefined;
        });
    }
    //get user data for all users in a group, includes collection, limits, skips
    getUserDataByAuthorizationGroup(groupId = '', collection, searchDict, limit = 0, skip = 0, callback = this.baseServerCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            let auths = this.getLocalData('authorization');
            let results = [];
            yield Promise.all(auths.map((o) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                if ((_a = o.groups) === null || _a === void 0 ? void 0 : _a.includes(groupId)) {
                    let u = o.authorizerId;
                    if (u) {
                        let data;
                        let user = yield this.getUser(u, callback);
                        if (user)
                            results.push(user);
                        if (!collection)
                            data = yield this.getAllUserData(u, ['notification'], callback);
                        else
                            data = yield this.getData(collection, u, searchDict, limit, skip, callback);
                        if (data)
                            results.push(data);
                    }
                    return true;
                }
            })));
            return results; //will be a weird result till this is tested more
        });
    }
    //
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
        this.tablet.setLocalData(structs);
    }
    //pull a struct by collection, owner, and key/value pair from the local platform, leave collection blank to pull all ownerId associated data
    getLocalData(collection, query) {
        return this.tablet.getLocalData(collection, query);
    }
    getLocalReplies(struct) {
        let replies = [];
        if (!struct.replies)
            return replies;
        else if (struct.replies.reduce((a, b) => a * ((typeof b === 'object') ? 1 : 0), 1))
            return struct.replies; // just return objects
        replies = this.getLocalData('comment', { 'replyTo': struct._id });
        return replies;
    }
    hasLocalAuthorization(otherUserId, ownerId = this.currentUser._id) {
        let auths = this.getLocalData('authorization', { ownerId });
        let found = auths.find((a) => {
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
    }
    //pass a single struct or array of structs
    deleteLocalData(structs) {
        if (Array.isArray(structs))
            structs.forEach(s => this.deleteStruct(s));
        else
            this.deleteStruct(structs); //single
        return true;
    }
    deleteStruct(struct) {
        if (typeof struct === 'string')
            struct = this.getLocalData(struct); //get the struct if an id was supplied
        if (!struct)
            throw new Error('Struct not supplied');
        if (!struct.structType || !struct._id)
            return false;
        this.tablet.collections.get(struct.structType).delete(struct._id);
        return true;
    }
    //strips circular references from the struct used clientside, returns a soft copy with the changes
    stripStruct(struct = {}) {
        const copy = Object.assign({}, struct);
        for (const prop in copy) {
            if (copy[prop] === undefined || copy[prop].constructor.name === 'Map')
                delete copy[prop]; //delete undefined 
        }
        return copy;
    }
    //create a struct with the prepared props to be filled out
    createStruct(structType, props, parentUser = this.currentUser, parentStruct) {
        let struct = DS.Struct(structType, props, parentUser, parentStruct);
        return struct;
    }
    userStruct(props = {}, currentUser = false) {
        let user = DS.ProfileStruct(undefined, props, props);
        if (props._id)
            user.id = props._id; //references the token id
        else if (props.id)
            user.id = props.id;
        else
            user.id = 'user' + Math.floor(Math.random() * 10000000000);
        user._id = user.id; //for mongo stuff
        user.ownerId = user.id;
        for (const prop in props) {
            if (Object.keys(DS.ProfileStruct()).indexOf(prop) < 0) {
                delete user[prop];
            } //delete non-dependent data (e.g. tokens we only want to keep in a secure collection)
        }
        if (currentUser)
            this.currentUser = user;
        return user;
    }
    //these can be used to add some metadata to arrays of data kept in a DataStruct
    dataObject(data = undefined, type = 'any', timestamp = Date.now()) {
        return {
            type,
            data,
            timestamp
        };
    }
}
export default StructRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RydWN0cy5yb3V0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zdHJ1Y3RzLnJvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUVsRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDNUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sYUFBYSxNQUFNLG1CQUFtQixDQUFDO0FBRzlDLGtFQUFrRTtBQUNsRSxFQUFFO0FBQ0YsY0FBYztBQUNkLHlDQUF5QztBQUN6QyxFQUFFO0FBRUYsTUFBTSxZQUFhLFNBQVEsTUFBTTtJQU83QixZQUFhLFdBQTZCLEVBQUUsRUFBRSxPQUFzQjtRQUNoRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUE7UUFMbEIsV0FBTSxHQUFHLElBQUksVUFBVSxFQUFFLENBQUMsQ0FBQyxhQUFhO1FBQ3hDLGdCQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDdEMsT0FBRSxHQUFXLFFBQVEsRUFBRSxDQUFBO1FBeUp2QiwwQ0FBMEM7UUFDMUMsdUJBQWtCLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUUxQixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDbkIsSUFBRyxPQUFPLElBQUksS0FBSyxRQUFRLEtBQUksSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFVBQVUsQ0FBQTtnQkFBRSxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRSxJQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxzQkFBc0I7Z0JBRTVDLElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtvQkFDaEMsSUFBRyxDQUFDLENBQUMs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