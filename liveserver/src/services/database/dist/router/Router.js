import { __awaiter, __generator, __read, __spreadArray } from "tslib";
import StateManager from 'anotherstatemanager';
import { getRouteMatches } from '../common/general.utils';
import { randomId, pseudoObjectId, } from '../common/id.utils';
import { getParamNames } from '../common/parse.utils';
import errorPage from '../services/http/404';
import { Endpoint } from './Endpoint';
export var DONOTSEND = 'DONOTSEND';
// export let NODE = false
// */ Router 
// A class for handling arbitrary commands (loaded from custom services)
// through networking protocols including HTTP, Websockets, OSC, and others.
//
// --------------- Route Structure ------------------
// **/
//  Default routes supplied by the Router.routes attribute
//
// */[service]
//  Additional core routes specified by services loaded into the session
//
// */[client_id]
//  Custom routes specified by clients (to implement...)
//
var Router = /** @class */ (function () {
    // -------------------- User-Specified Options --------------------
    function Router(options) {
        var _this = this;
        if (options === void 0) { options = { debug: false }; }
        this.id = randomId();
        // Backend
        this.USERS = {}; //live message passing functions and basic user info
        this.CONNECTIONS = new Map(); //threads or other servers
        this.SUBSCRIPTIONS = []; // an array of handlers (from services)
        this.ENDPOINTS = {};
        this.SERVICES = {};
        this.ROUTES = {}; // Internal Routes Object
        this.INTERVAL = 10;
        this.DEFAULTROUTES = [
            {
                route: 'ping',
                post: function () {
                    return 'pong';
                }
            },
            {
                route: 'services/**',
                get: {
                    object: this.SERVICES,
                    transform: function (reference) {
                        var args = [];
                        for (var _i = 1; _i < arguments.length; _i++) {
                            args[_i - 1] = arguments[_i];
                        }
                        var dict = {};
                        // Use First Argument
                        var keys = (args.length > 0) ? [args[0]] : Object.keys(reference);
                        keys.forEach(function (k) {
                            var o = reference[k];
                            if ((o === null || o === void 0 ? void 0 : o.serviceType) === 'default')
                                dict[k] = o.name;
                        });
                        // Drill on Response
                        args.forEach(function (v, i) { return dict = dict[v]; });
                        return dict;
                    }
                },
            },
            {
                route: '/',
                aliases: ['routes/**'],
                get: {
                    object: this.ROUTES,
                    transform: function (reference) {
                        var args = [];
                        for (var _i = 1; _i < arguments.length; _i++) {
                            args[_i - 1] = arguments[_i];
                        }
                        var o = {};
                        // Shift Arguments
                        var keys = (args.length > 0) ? [args[0]] : Object.keys(reference);
                        keys.forEach(function (key) {
                            if (key)
                                o[key] = {
                                    route: reference[key].route.split('/').filter(function (str) { return !str.match(/\*\*?/); }).join('/'),
                                    args: reference[key].args,
                                    wildcard: key.includes('*')
                                }; // Shallow copy
                        });
                        // Auto-Drill on References
                        args.forEach(function (v, i) { return o = o[v]; });
                        return o;
                    }
                }
            },
            {
                route: 'sendMessage',
                aliases: ['message', 'sendMsg'],
                post: function (Router, args) {
                    return Router.sendMsg(args[0], args[1], args[2]);
                }
            },
            {
                route: 'setUserServerDetails',
                post: function (Router, args, origin) {
                    var user = Router.USERS[origin];
                    if (!user)
                        return false;
                    if (args[0])
                        user.username = args[0];
                    if (args[1])
                        user.password = args[1];
                    if (args[2])
                        user.props = args[2];
                    if (args[3]) {
                        user._id = args[3]; //not very wise to do in our schema
                        user.id = args[3];
                    }
                }
            },
            {
                route: 'setProps',
                post: function (Router, args, origin) {
                    var user = Router.USERS[origin];
                    if (!user)
                        return false;
                    if (typeof args === 'object' && !Array.isArray(args)) {
                        Object.assign(user.props, args);
                        return true;
                    }
                    else if (Array.isArray(args) && typeof args[1] === 'object') {
                        var u = Router.USERS[args[0]];
                        if (u)
                            Object.assign(u.props, args[1]);
                        return true;
                    }
                    return false;
                }
            },
            {
                route: 'getProps',
                post: function (Router, args, origin) {
                    var user = Router.USERS[origin];
                    if (!user)
                        return false;
                    if (args[0]) {
                        var u = Router.USERS[args[0]];
                        if (u)
                            return u.props;
                    }
                    else
                        return user.props;
                }
            },
            {
                route: 'blockUser',
                post: function (Router, args, origin) {
                    var user = Router.USERS[origin];
                    if (!user)
                        return false;
                    return _this.blockUser(user, args[0]);
                }
            },
            {
                route: 'users/**',
                get: {
                    object: this.USERS,
                    transform: function (o) {
                        var args = [];
                        for (var _i = 1; _i < arguments.length; _i++) {
                            args[_i - 1] = arguments[_i];
                        }
                        var dict = {};
                        // Use First Argument
                        var keys = (args.length > 0) ? [args[0]] : Object.keys(o);
                        keys.forEach(function (k) {
                            var u = o[k];
                            dict[k] = {
                                _id: u._id,
                                username: u.username,
                                origin: u.origin,
                                props: u.props,
                                updatedPropNames: u.updatedPropNames,
                                lastUpdate: u.lastUpdate,
                                lastTransmit: u.lastTransmit,
                                latency: u.latency
                            };
                        });
                        // rill References
                        args.forEach(function (v, i) { return dict = dict[v]; });
                        return dict;
                    }
                }
            },
            {
                route: 'getUser',
                post: function (Router, args, origin) {
                    var user = Router.USERS[origin];
                    if (!user)
                        return false;
                    if (args[0]) {
                        var u = _this.USERS[args[0]];
                        if (u) {
                            return {
                                _id: u._id,
                                username: u.username,
                                origin: u.origin,
                                props: u.props,
                                updatedPropNames: u.updatedPropNames,
                                lastUpdate: u.lastUpdate,
                                lastTransmit: u.lastTransmit,
                                latency: u.latency
                            };
                        }
                    }
                    else {
                        return {
                            _id: user._id,
                            username: user.username,
                            origin: user.origin,
                            props: user.props,
                            updatedPropNames: user.updatedPropNames,
                            lastUpdate: user.lastUpdate,
                            lastTransmit: user.lastTransmit,
                            latency: user.latency
                        };
                    }
                }
            },
            {
                route: 'login',
                aliases: ['addUser', 'startSession'],
                post: function (Router, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, Router.addUser.apply(Router, __spreadArray([], __read(args), false))];
                            case 1:
                                u = _a.sent();
                                return [2 /*return*/, { message: !!u, id: u.id }];
                        }
                    });
                }); }
            },
            {
                route: 'logout',
                aliases: ['removeUser', 'endSession'],
                post: function (Router, args, origin) {
                    var user = Router.USERS[origin];
                    if (!user)
                        return false;
                    if (args[0])
                        Router.removeUser.apply(Router, __spreadArray([], __read(args), false));
                    else
                        Router.removeUser(user);
                }
            },
        ];
        this.protocols = {};
        // -----------------------------------------------
        // 
        // Frontend Methods (OG)
        // 
        // -----------------------------------------------
        this.connect = function (config, onconnect) {
            var endpoint = new Endpoint(config, _this.SERVICES, _this);
            // Register User and Get Available Functions
            _this.ENDPOINTS[endpoint.id] = endpoint;
            endpoint.check().then(function (res) {
                if (res) {
                    if (onconnect)
                        onconnect(endpoint);
                    _this.login(endpoint); // Login user to connect to new remote
                }
            });
            return endpoint;
        };
        this.disconnect = function (id) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.logout(this.ENDPOINTS[id]);
                delete this.ENDPOINTS[id];
                return [2 /*return*/];
            });
        }); };
        this._loadBackend = function (service, name) {
            var _a;
            if (name === void 0) { name = service.name; }
            _this.SERVICES[name] = service;
            _this.SERVICES[name].status = true;
            (_a = service.routes) === null || _a === void 0 ? void 0 : _a.forEach(function (o) { return _this.addRoute(Object.assign({ service: name }, o)); });
            if (service.subscribe) {
                service.subscribe(function (o, type, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var res;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleMessage(o, type)];
                            case 1:
                                res = _a.sent();
                                if (origin === null || origin === void 0 ? void 0 : origin.includes('worker')) {
                                    if (res !== null && service[origin])
                                        service[origin].postMessage({ route: 'worker/workerPost', message: res, origin: service.id, callbackId: o.callbackId });
                                    else
                                        return [2 /*return*/, res];
                                }
                                return [2 /*return*/, res];
                        }
                    });
                }); });
            }
            if ((service === null || service === void 0 ? void 0 : service.serviceType) === 'subscription')
                _this.SUBSCRIPTIONS.push(service.updateSubscribers);
        };
        this._loadService = function (service, name) {
            if (name === void 0) { name = service === null || service === void 0 ? void 0 : service.name; }
            return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this._loadBackend(service, name); // Load a backend Service
                            return [4 /*yield*/, this._loadClient(service, name, true)]; // Load a client Service but skip waiting to resolve the remote name
                        case 1: // Load a backend Service
                        return [2 /*return*/, _a.sent()]; // Load a client Service but skip waiting to resolve the remote name
                    }
                });
            });
        };
        this._loadClient = function (service, _, onlySubscribe) {
            if (onlySubscribe === void 0) { onlySubscribe = false; }
            return new Promise(function (resolve) {
                // let worker = false;
                // if(name.includes('worker')) worker = true;
                var name = service.name;
                // NOTE: This is where you listen for service.notify()
                if (service.subscribe) {
                    service.subscribe(function (o, type) { return __awaiter(_this, void 0, void 0, function () {
                        var client, available, res;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    client = this.SERVICES[name];
                                    available = client.status === true;
                                    if (!(type === 'local')) return [3 /*break*/, 2];
                                    return [4 /*yield*/, this.handleLocalRoute(o)];
                                case 1:
                                    res = _b.sent();
                                    return [3 /*break*/, 4];
                                case 2:
                                    if (!available) return [3 /*break*/, 4];
                                    return [4 /*yield*/, this.send.apply(this, __spreadArray([{
                                                route: "".concat(client.route, "/").concat(o.route),
                                                endpoint: service === null || service === void 0 ? void 0 : service.endpoint // If remote is bound to client
                                            }], __read((_a = o.message) !== null && _a !== void 0 ? _a : []), false))]; // send automatically with extension
                                case 3:
                                    res = _b.sent(); // send automatically with extension
                                    _b.label = 4;
                                case 4: return [2 /*return*/, res];
                            }
                        });
                    }); });
                }
                if (onlySubscribe)
                    resolve(service);
                else {
                    // Load Client Handler
                    _this.SERVICES[name] = service;
                    var toResolve = function (route) {
                        _this.SERVICES[name].status = true;
                        if (service.setEndpointRoute instanceof Function)
                            service.setEndpointRoute(route);
                        // Expect Certain Callbacks from the Service
                        service.routes.forEach(function (o) {
                            _this.ROUTES["".concat(route, "/").concat(o.route)] = o;
                        });
                        resolve(service);
                    };
                    // Auto-Resolve if Already Available
                    if (_this.SERVICES[name].status === true)
                        toResolve(_this.SERVICES[name]);
                    else
                        _this.SERVICES[name].status = toResolve;
                }
            });
        };
        this.get = function (routeSpec) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return _this._send.apply(_this, __spreadArray([routeSpec, 'GET'], __read(args), false));
        };
        this.delete = function (routeSpec) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return _this._send.apply(_this, __spreadArray([routeSpec, 'DELETE'], __read(args), false));
        };
        this.post = function (routeSpec) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return _this._send.apply(_this, __spreadArray([routeSpec, 'POST'], __read(args), false));
        };
        this.send = this.post;
        this._send = function (routeSpec, method) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            return __awaiter(_this, void 0, void 0, function () {
                var endpoint, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (typeof routeSpec === 'string' || (routeSpec === null || routeSpec === void 0 ? void 0 : routeSpec.endpoint) == null)
                                endpoint = Object.values(this.ENDPOINTS)[0];
                            else
                                endpoint = routeSpec.endpoint;
                            if (!endpoint)
                                return [2 /*return*/];
                            return [4 /*yield*/, endpoint.send(routeSpec, {
                                    message: args,
                                    method: method
                                })];
                        case 1:
                            response = _a.sent();
                            if (response)
                                this.handleLocalRoute(response, endpoint);
                            // Pass Back to the User
                            return [2 /*return*/, response === null || response === void 0 ? void 0 : response.message];
                    }
                });
            });
        };
        // NOTE: Client can call itself. Server cannot.
        this.handleLocalRoute = function (o, endpoint, route) { return __awaiter(_this, void 0, void 0, function () {
            var route_1;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                // Notify through Subscription (if not suppressed)
                if (endpoint && route && !o.suppress && endpoint.connection)
                    (_c = (_b = (_a = endpoint.connection) === null || _a === void 0 ? void 0 : _a.service) === null || _b === void 0 ? void 0 : _b.responses) === null || _c === void 0 ? void 0 : _c.forEach(function (f) { return f(Object.assign({ route: route }, o)); }); // Include send route if none returned
                // Activate Internal Routes if Relevant (currently blocking certain command chains)
                if (!o.block) {
                    route_1 = this.ROUTES[o === null || o === void 0 ? void 0 : o.route];
                    if ((route_1 === null || route_1 === void 0 ? void 0 : route_1.post) instanceof Function)
                        return [2 /*return*/, route_1.post(this, o.message, o.id)]; // TODO: Enable non-post
                }
                return [2 /*return*/];
            });
        }); };
        this.subscribe = function (callback, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(Object.keys(this.ENDPOINTS).length > 0 || (options === null || options === void 0 ? void 0 : options.endpoint))) return [3 /*break*/, 2];
                            if (!options.endpoint)
                                options.endpoint = Object.values(this.ENDPOINTS)[0];
                            return [4 /*yield*/, options.endpoint._subscribe(options).then(function (res) { return options.endpoint.subscribe(callback); })];
                        case 1:
                            res = _a.sent();
                            return [2 /*return*/, res];
                        case 2: throw 'Remote is not specified';
                    }
                });
            });
        };
        this.handleMessage = function (msg, type) { return __awaiter(_this, void 0, void 0, function () {
            var o, cmd, u, res;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        o = {};
                        if (Array.isArray(msg)) { //handle commands sent as arrays [username,cmd,arg1,arg2]
                            o.route = msg[0];
                            o.message = msg.slice(1);
                            o.callbackId = undefined;
                            // o.id = socketId
                        }
                        else if (typeof msg === 'string') { //handle string commands with spaces, 'username command arg1 arg2'
                            cmd = msg.split(' ');
                            o.route = cmd[0];
                            o.message = cmd.slice(1);
                            o.callbackId = undefined;
                            // o.id = socketId
                        }
                        else if (typeof msg === 'object')
                            Object.assign(o, msg);
                        if (!(typeof o === 'object' && !Array.isArray(o))) return [3 /*break*/, 2];
                        if (!(o.route != null)) return [3 /*break*/, 2];
                        u = this.USERS[o === null || o === void 0 ? void 0 : o.id];
                        console.log('runRoute', o.route);
                        return [4 /*yield*/, this.runRoute(o.route, o.method, o.message, (_a = u === null || u === void 0 ? void 0 : u.id) !== null && _a !== void 0 ? _a : o.id, o.callbackId)];
                    case 1:
                        res = _b.sent();
                        if (res && o.suppress)
                            res.suppress = o.suppress; // only suppress when handling messages here
                        // }
                        return [2 /*return*/, res];
                    case 2: return [2 /*return*/, null];
                }
            });
        }); };
        if (options.interval)
            this.INTERVAL = options.interval;
        this.STATE = new StateManager({}, this.INTERVAL, undefined //false
        );
        this.DEBUG = options === null || options === void 0 ? void 0 : options.debug;
        // Browser-Only
        if ('onbeforeunload' in globalThis) {
            globalThis.onbeforeunload = function () {
                Object.values(_this.ENDPOINTS).forEach(function (e) { if (e.type != 'webrtc')
                    _this.logout(e); }); // TODO: Make generic. Currently excludes WebRTC
            };
        }
        // Load Default Routes
        this.load({ routes: this.DEFAULTROUTES });
        if (this.DEBUG)
            this.runCallback('routes', [true]);
        if (options === null || options === void 0 ? void 0 : options.endpoints)
            options.endpoints.forEach(function (e) { return _this.connect(e); });
    }
    Router.prototype.login = function (endpoint, user) {
        return __awaiter(this, void 0, void 0, function () {
            var arr, res;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.logout(endpoint)];
                    case 1:
                        _a.sent();
                        arr = Object.values((endpoint) ? { endpoint: endpoint } : this.ENDPOINTS);
                        return [4 /*yield*/, Promise.all(arr.map(function (endpoint) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (user)
                                                endpoint.setCredentials(user);
                                            return [4 /*yield*/, this.send({
                                                    route: 'login',
                                                    endpoint: endpoint
                                                }, endpoint.credentials)];
                                        case 1: return [2 /*return*/, _a.sent()];
                                    }
                                });
                            }); }))];
                    case 2:
                        res = _a.sent();
                        return [2 /*return*/, res.reduce(function (a, b) { return a * b[0]; }, true) === 1];
                }
            });
        });
    };
    Router.prototype.logout = function (endpoint) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(Object.values((endpoint) ? { endpoint: endpoint } : this.ENDPOINTS).map(function (endpoint) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.send({
                                            route: 'logout',
                                            endpoint: endpoint
                                        }, endpoint.credentials)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); }))];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.reduce(function (a, b) { return a * b[0]; }, true) === 1];
                }
            });
        });
    };
    // -----------------------------------------------
    // 
    // Backend Methods (OG)
    // 
    // -----------------------------------------------
    Router.prototype.load = function (service, name) {
        if (name === void 0) { name = service.name; }
        return __awaiter(this, void 0, void 0, function () {
            var isClient, isService, isBackend;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        isClient = service.constructor.type === 'client';
                        isService = !service.constructor.type || service.constructor.type === 'service' // Includes objects
                        ;
                        isBackend = service.constructor.type === 'backend';
                        if (!isService) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._loadService(service, name)
                            // Add as Backend
                        ];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!isBackend) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._loadBackend(service, name)
                            // Add as Client
                        ];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!isClient) return [3 /*break*/, 6];
                        return [4 /*yield*/, this._loadClient(service)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/, service];
                }
            });
        });
    };
    Router.prototype.format = function (o, info) {
        if (info === void 0) { info = {}; }
        if (o !== undefined) { // Can pass false and null
            if (!o || !(typeof o === 'object') || (!('message' in o) && !('route' in o)))
                o = { message: o };
            if (!Array.isArray(o.message))
                o.message = [o.message];
            if (info.service && (o === null || o === void 0 ? void 0 : o.route))
                o.route = "".concat(info.service, "/").concat(o.route); // Correct Route
            // if (routeInfo.get) state.setState(route, res.message)
            if (info.headers)
                o.headers = info.headers; // e.g. text/html for SSR
        }
        // Remove Wildcards
        if (o === null || o === void 0 ? void 0 : o.route)
            o.route = o.route.replace(/\/\*\*?/, '');
        return o;
    };
    Router.prototype.runRoute = function (route, method, args, origin, callbackId) {
        if (args === void 0) { args = []; }
        return __awaiter(this, void 0, void 0, function () {
            var e_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (route == null)
                            return [2 /*return*/]; // NOTE: Now allowing users not on the server to submit requests
                        if (!method && Array.isArray(args))
                            method = (args.length > 0) ? 'POST' : 'GET';
                        if (this.DEBUG)
                            console.log('route', route);
                        return [4 /*yield*/, this.runCallback(route, args, origin, method).then(function (dict) {
                                if (_this.DEBUG)
                                    console.log("Result:", dict);
                                // Convert Output to Message Object
                                if (dict === undefined)
                                    return;
                                else {
                                    dict = _this.format(dict);
                                    // if (!dict.route) dict.route = route // Only send back a route when you want to trigger inside the Router
                                    dict.callbackId = callbackId;
                                    if (_this.ROUTES[dict.route])
                                        dict.block = true; // Block infinite command chains... 
                                    // Pass Out
                                    if (dict.message === DONOTSEND)
                                        return;
                                    return dict;
                                }
                            }).catch(console.error)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_1 = _a.sent();
                        return [2 /*return*/, new Error("Route failed...")];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Track Users Connected to the LiveServer
    Router.prototype.addUser = function (userinfo) {
        var _this = this;
        if (userinfo && (userinfo.id || userinfo._id)) {
            // Grab Proper Id
            if (!userinfo._id)
                userinfo._id = pseudoObjectId();
            if (!userinfo.id)
                userinfo.id = userinfo._id;
            // Get Current User if Exists
            var u = this.USERS[userinfo.id];
            // Grab Base
            var newuser_1 = u !== null && u !== void 0 ? u : {
                id: userinfo.id,
                _id: userinfo._id,
                username: userinfo.id,
                origin: userinfo.id,
                props: {},
                updatedPropNames: [],
                sessions: [],
                blocked: [],
                lastUpdate: Date.now(),
                lastTransmit: 0,
                latency: 0,
                routes: new Map(),
            };
            Object.assign(newuser_1, userinfo); //assign any supplied info to the base
            if (this.DEBUG)
                console.log('Adding User, Id:', userinfo._id);
            this.USERS[userinfo.id] = newuser_1;
            //add any additional properties sent. remote.service has more functions for using these
            for (var key in this.SERVICES) {
                var s = this.SERVICES[key];
                if (s.status === true) {
                    var route = s.name + '/users'; // Default Route
                    var possibilities = getRouteMatches(route);
                    possibilities.forEach(function (r) {
                        if (_this.ROUTES[r]) {
                            _this.runRoute(r, 'POST', [newuser_1], userinfo.id);
                        }
                    });
                }
            }
            return newuser_1; //returns the generated id so you can look up
        }
        else
            return false;
    };
    Router.prototype.removeUser = function (user) {
        var _this = this;
        var u = (typeof user === 'string') ? this.USERS[user] : user;
        if (u) {
            Object.values(this.SERVICES).forEach(function (s) {
                if (s.status === true) {
                    var route = s.name + '/users';
                    if (_this.ROUTES[route])
                        _this.runRoute(route, 'DELETE', [u], u.id);
                }
            });
            delete u.id;
            return true;
        }
        return false;
    };
    //adds an id to a blocklist for access control
    Router.prototype.blockUser = function (user, userId) {
        if (userId === void 0) { userId = ''; }
        if (this.USERS[userId]) {
            if (!user.blocked.includes(userId) && user.id !== userId) { //can't block Router 
                user.blocked.push(userId);
                return true;
            }
        }
        return false;
    };
    //pass user Id or object
    Router.prototype.sendMsg = function (user, message, data) {
        if (user === void 0) { user = ''; }
        if (message === void 0) { message = ''; }
        if (data === void 0) { data = undefined; }
        var toSend = (data) ? Object.assign(data, { message: message }) : { message: message };
        if (typeof user === 'string') {
            var u = this.USERS[user];
            if (u) {
                u.send(toSend);
            }
        }
        else if (typeof user === 'object') {
            user.send(toSend);
            return true;
        }
        return false;
    };
    Router.prototype.addRoute = function (o) {
        var _this = this;
        o = Object.assign({}, o);
        var cases = __spreadArray([o.route], __read((o.aliases) ? o.aliases : []), false);
        delete o.aliases;
        cases.forEach(function (route) {
            var _a;
            var _b, _c;
            if (!route || (!o.post && !o.get))
                return false;
            route = o.route = "".concat((o.service) ? "".concat(o.service, "/") : '') + route;
            _this.removeRoute(route); //removes existing callback if it is there
            if (route[0] === '/')
                route = route.slice(1);
            o.args = getParamNames(o.post);
            _this.ROUTES[route] = Object.assign(o, { route: route });
            if (o.get) {
                // Subscribe to Base Route // TODO: Doube-check that subscriptions are working
                _this.STATE.setState((_a = {}, _a[route] = (_c = (_b = o.get) === null || _b === void 0 ? void 0 : _b.object) !== null && _c !== void 0 ? _c : o.get, _a));
                _this.STATE.subscribe(route, function (data) {
                    var _a;
                    var _b;
                    var message = ((_b = o.get) === null || _b === void 0 ? void 0 : _b.transform) ? (_a = o.get).transform.apply(_a, __spreadArray([data], [], false)) : data;
                    _this.SUBSCRIPTIONS.forEach(function (o) {
                        return o(_this, {
                            route: route,
                            message: message
                        });
                    });
                });
            }
        });
        return true;
    };
    Router.prototype.removeRoute = function (functionName) {
        return delete this.ROUTES[functionName];
    };
    Router.prototype.runCallback = function (route, input, origin, method) {
        var _this = this;
        if (input === void 0) { input = []; }
        if (method === void 0) { method = (input.length > 0) ? 'POST' : 'GET'; }
        return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
            var possibilities, errorRes;
            var _this = this;
            return __generator(this, function (_a) {
                possibilities = getRouteMatches(route);
                errorRes = { route: route, block: true, message: { html: errorPage }, headers: { 'Content-Type': 'text/html' } } // NOTE: Do not include route unless you want it to be parsed as a command
                ;
                // Iterate over Possibilities
                Promise.all(possibilities.map(function (possibleRoute) { return __awaiter(_this, void 0, void 0, function () {
                    var routeInfo, res, value, args, _a, e_2;
                    var _b, _c;
                    var _d;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                routeInfo = this.ROUTES[possibleRoute];
                                if (!routeInfo) return [3 /*break*/, 14];
                                if (this.DEBUG)
                                    console.log('routeInfo', routeInfo);
                                _e.label = 1;
                            case 1:
                                _e.trys.push([1, 13, , 14]);
                                res = void 0;
                                if (!((routeInfo === null || routeInfo === void 0 ? void 0 : routeInfo.delete) && method.toUpperCase() === 'DELETE')) return [3 /*break*/, 3];
                                return [4 /*yield*/, routeInfo.delete(this, input, origin)];
                            case 2:
                                res = _e.sent();
                                return [3 /*break*/, 12];
                            case 3:
                                if (!(method.toUpperCase() === 'GET' || !(routeInfo === null || routeInfo === void 0 ? void 0 : routeInfo.post))) return [3 /*break*/, 9];
                                value = this.STATE.data[routeInfo.route] // Get State by route
                                ;
                                if (!value) return [3 /*break*/, 7];
                                args = route.replace(routeInfo.route.split('/').filter(function (a) { return a != '*' && a != '**'; }).join('/'), '').split('/').filter(function (str) { return !!str; });
                                _b = {};
                                if (!((_d = routeInfo.get) === null || _d === void 0 ? void 0 : _d.transform)) return [3 /*break*/, 5];
                                return [4 /*yield*/, (_c = routeInfo.get).transform.apply(_c, __spreadArray([value], __read(args), false))];
                            case 4:
                                _a = _e.sent();
                                return [3 /*break*/, 6];
                            case 5:
                                _a = value;
                                _e.label = 6;
                            case 6:
                                res = (_b.message = _a, _b);
                                return [3 /*break*/, 8];
                            case 7:
                                res = errorRes;
                                _e.label = 8;
                            case 8: return [3 /*break*/, 12];
                            case 9:
                                if (!(routeInfo === null || routeInfo === void 0 ? void 0 : routeInfo.post)) return [3 /*break*/, 11];
                                return [4 /*yield*/, (routeInfo === null || routeInfo === void 0 ? void 0 : routeInfo.post(this, input, origin))];
                            case 10:
                                res = _e.sent();
                                return [3 /*break*/, 12];
                            case 11:
                                res = errorRes;
                                _e.label = 12;
                            case 12:
                                resolve(this.format(res, routeInfo));
                                return [3 /*break*/, 14];
                            case 13:
                                e_2 = _e.sent();
                                console.log('Callback Failed: ', e_2);
                                return [3 /*break*/, 14];
                            case 14: return [2 /*return*/];
                        }
                    });
                }); })).then(function (_) { return resolve(errorRes); });
                return [2 /*return*/];
            });
        }); });
    };
    Router.prototype.checkRoutes = function (event) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var route;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!event.data)
                            return [2 /*return*/];
                        route = (_b = (_a = this.ROUTES[event.data.foo]) !== null && _a !== void 0 ? _a : this.ROUTES[event.data.route]) !== null && _b !== void 0 ? _b : this.ROUTES[event.data.functionName];
                        if (!route)
                            route = this.ROUTES[event.data.foo];
                        if (!route) return [3 /*break*/, 4];
                        if (!event.data.message) return [3 /*break*/, 2];
                        return [4 /*yield*/, route.post(this, event.data.message, event.data.origin)];
                    case 1: return [2 /*return*/, _c.sent()];
                    case 2: return [2 /*return*/];
                    case 3: return [3 /*break*/, 5];
                    case 4: return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return Router;
}());
export { Router };
export default Router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcm91dGVyL1JvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxZQUFZLE1BQU0scUJBQXFCLENBQUE7QUFDOUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLHlCQUF5QixDQUFBO0FBQ3pELE9BQU8sRUFBRSxRQUFRLEVBQUUsY0FBYyxHQUFJLE1BQU0sb0JBQW9CLENBQUE7QUFHL0QsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBRXRELE9BQU8sU0FBUyxNQUFNLHNCQUFzQixDQUFBO0FBQzVDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFFdEMsTUFBTSxDQUFDLElBQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQztBQUNyQywwQkFBMEI7QUFFMUIsYUFBYTtBQUNiLHdFQUF3RTtBQUN4RSw0RUFBNEU7QUFDNUUsRUFBRTtBQUNGLHFEQUFxRDtBQUNyRCxNQUFNO0FBQ04sMERBQTBEO0FBQzFELEVBQUU7QUFDRixjQUFjO0FBQ2Qsd0VBQXdFO0FBQ3hFLEVBQUU7QUFDRixnQkFBZ0I7QUFDaEIsd0RBQXdEO0FBQ3hELEVBQUU7QUFHRjtJQTZORSxtRUFBbUU7SUFFakUsZ0JBQVksT0FBdUM7UUFBbkQsaUJBMEJDO1FBMUJXLHdCQUFBLEVBQUEsWUFBMEIsS0FBSyxFQUFFLEtBQUssRUFBQztRQTlOckQsT0FBRSxHQUFXLFFBQVEsRUFBRSxDQUFBO1FBRXZCLFVBQVU7UUFDVixVQUFLLEdBQTZCLEVBQUUsQ0FBQSxDQUFDLG9EQUFvRDtRQUN6RixnQkFBVyxHQUFtQixJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsMEJBQTBCO1FBQ25FLGtCQUFhLEdBQWUsRUFBRSxDQUFBLENBQUMsdUNBQXVDO1FBRXRFLGNBQVMsR0FBMEIsRUFBRSxDQUFBO1FBRXJDLGFBQVEsR0FBdUIsRUFBRSxDQUFBO1FBRWpDLFdBQU0sR0FBZ0MsRUFBRSxDQUFBLENBQUMseUJBQXlCO1FBQ2xFLGFBQVEsR0FBQyxFQUFFLENBQUM7UUFHWixrQkFBYSxHQUFHO1lBQ2Q7Z0JBQ0UsS0FBSyxFQUFFLE1BQU07Z0JBQ2IsSUFBSSxFQUFDO29CQUNELE9BQU8sTUFBTSxDQUFDO2dCQUNsQixDQUFDO2FBQ0o7WUFDRDtnQkFDRSxLQUFLLEVBQUUsYUFBYTtnQkFDcEIsR0FBRyxFQUFFO29CQUNILE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUTtvQkFDckIsU0FBUyxFQUFFLFVBQUMsU0FBUzt3QkFBRSxjQUFPOzZCQUFQLFVBQU8sRUFBUCxxQkFBTyxFQUFQLElBQU87NEJBQVAsNkJBQU87O3dCQUM1QixJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7d0JBRWQscUJBQXFCO3dCQUNyQixJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7d0JBQ2pFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBQSxDQUFDOzRCQUNaLElBQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTs0QkFDdEIsSUFBSSxDQUFBLENBQUMsYUFBRCxDQUFDLHVCQUFELENBQUMsQ0FBRSxXQUFXLE1BQUssU0FBUztnQ0FBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQzt3QkFDckQsQ0FBQyxDQUFDLENBQUE7d0JBRUYsb0JBQW9CO3dCQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQyxFQUFDLENBQUMsSUFBSyxPQUFBLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQWQsQ0FBYyxDQUFDLENBQUE7d0JBRXJDLE9BQU8sSUFBSSxDQUFDO29CQUNkLENBQUM7aUJBQ0Y7YUFDRjtZQUNEO2dCQUNFLEtBQUssRUFBRSxHQUFHO2dCQUNWLE9BQU8sRUFBRSxDQUFDLFdBQVcsQ0FBQztnQkFDdEIsR0FBRyxFQUFFO29CQUNILE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtvQkFDbkIsU0FBUyxFQUFFLFVBQUMsU0FBUzt3QkFBRSxjQUFPOzZCQUFQLFVBQU8sRUFBUCxxQkFBTyxFQUFQLElBQU87NEJBQVAsNkJBQU87O3dCQUM1QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUE7d0JBRVYsa0JBQWtCO3dCQUNsQixJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7d0JBQ2pFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBQSxHQUFHOzRCQUNkLElBQUksR0FBRztnQ0FBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUc7b0NBQ2hCLEtBQUssRUFBRSxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQW5CLENBQW1CLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO29DQUNuRixJQUFJLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUk7b0NBQ3pCLFFBQVEsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztpQ0FDNUIsQ0FBQSxDQUFDLGVBQWU7d0JBQ25CLENBQUMsQ0FBQyxDQUFBO3dCQUVGLDJCQUEyQjt3QkFDM0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFDLENBQUMsRUFBQyxDQUFDLElBQUssT0FBQSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFSLENBQVEsQ0FBQyxDQUFBO3dCQUUvQixPQUFPLENBQUMsQ0FBQTtvQkFDVixDQUFDO2lCQUNGO2FBQ0Y7WUFDRDtnQkFDSSxLQUFLLEVBQUMsYUFBYTtnQkFDbkIsT0FBTyxFQUFDLENBQUMsU0FBUyxFQUFDLFNBQVMsQ0FBQztnQkFDN0IsSUFBSSxFQUFDLFVBQUMsTUFBTSxFQUFDLElBQUk7b0JBQ2IsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELENBQUM7YUFDSjtZQUNEO2dCQUNJLEtBQUssRUFBQyxzQkFBc0I7Z0JBQzVCLElBQUksRUFBQyxVQUFDLE1BQU0sRUFBQyxJQUFJLEVBQUMsTUFBTTtvQkFDdEIsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtvQkFDL0IsSUFBSSxDQUFDLElBQUk7d0JBQUUsT0FBTyxLQUFLLENBQUE7b0JBQ3ZCLElBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFBRSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDcEMsSUFBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUFFLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNwQyxJQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2pDLElBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO3dCQUNWLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsbUNBQW1DO3dCQUN2RCxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDbkI7Z0JBQ0gsQ0FBQzthQUNKO1lBQ0Q7Z0JBQ0ksS0FBSyxFQUFDLFVBQVU7Z0JBQ2hCLElBQUksRUFBQyxVQUFDLE1BQU0sRUFBQyxJQUFJLEVBQUMsTUFBTTtvQkFDdEIsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtvQkFDL0IsSUFBSSxDQUFDLElBQUk7d0JBQUUsT0FBTyxLQUFLLENBQUE7b0JBQ3ZCLElBQUcsT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTt3QkFDbkQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFDLElBQUksQ0FBQyxDQUFDO3dCQUMvQixPQUFPLElBQUksQ0FBQztxQkFDYjt5QkFDSSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO3dCQUMzRCxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUM5QixJQUFHLENBQUM7NEJBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNyQyxPQUFPLElBQUksQ0FBQztxQkFDYjtvQkFDRCxPQUFPLEtBQUssQ0FBQztnQkFDZixDQUFDO2FBQ0o7WUFDRDtnQkFDSSxLQUFLLEVBQUMsVUFBVTtnQkFDaEIsSUFBSSxFQUFDLFVBQUMsTUFBTSxFQUFDLElBQUksRUFBQyxNQUFNO29CQUN0QixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO29CQUMvQixJQUFJLENBQUMsSUFBSTt3QkFBRSxPQUFPLEtBQUssQ0FBQTtvQkFFdkIsSUFBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7d0JBQ1YsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDOUIsSUFBRyxDQUFDOzRCQUFFLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQztxQkFDdEI7O3dCQUNJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDekIsQ0FBQzthQUNKO1lBQ0Q7Z0JBQ0UsS0FBSyxFQUFDLFdBQVc7Z0JBQ2pCLElBQUksRUFBQyxVQUFDLE1BQU0sRUFBQyxJQUFJLEVBQUMsTUFBTTtvQkFDdEIsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtvQkFDL0IsSUFBSSxDQUFDLElBQUk7d0JBQUUsT0FBTyxLQUFLLENBQUE7b0JBQ3ZCLE9BQU8sS0FBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7YUFDRjtZQUNEO2dCQUNFLEtBQUssRUFBRSxVQUFVO2dCQUNqQixHQUFHLEVBQUU7b0JBQ0gsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLO29CQUNsQixTQUFTLEVBQUUsVUFBQyxDQUFDO3dCQUFFLGNBQU87NkJBQVAsVUFBTyxFQUFQLHFCQUFPLEVBQVAsSUFBTzs0QkFBUCw2QkFBTzs7d0JBRXBCLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQTt3QkFDWixxQkFBcUI7d0JBQ3JCLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTt3QkFFMUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUM7NEJBQ1osSUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBOzRCQUNaLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRztnQ0FDUixHQUFHLEVBQUMsQ0FBQyxDQUFDLEdBQUc7Z0NBQ1QsUUFBUSxFQUFDLENBQUMsQ0FBQyxRQUFRO2dDQUNuQixNQUFNLEVBQUMsQ0FBQyxDQUFDLE1BQU07Z0NBQ2YsS0FBSyxFQUFDLENBQUMsQ0FBQyxLQUFLO2dDQUNiLGdCQUFnQixFQUFDLENBQUMsQ0FBQyxnQkFBZ0I7Z0NBQ25DLFVBQVUsRUFBQyxDQUFDLENBQUMsVUFBVTtnQ0FDdkIsWUFBWSxFQUFDLENBQUMsQ0FBQyxZQUFZO2dDQUMzQixPQUFPLEVBQUMsQ0FBQyxDQUFDLE9BQU87NkJBQ2xCLENBQUE7d0JBQ1AsQ0FBQyxDQUFDLENBQUE7d0JBRU0sa0JBQWtCO3dCQUNsQixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQyxFQUFDLENBQUMsSUFBSyxPQUFBLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQWQsQ0FBYyxDQUFDLENBQUE7d0JBRTNDLE9BQU8sSUFBSSxDQUFBO29CQUNiLENBQUM7aUJBQ0Y7YUFDRjtZQUNEO2dCQUNJLEtBQUssRUFBQyxTQUFTO2dCQUNmLElBQUksRUFBQyxVQUFDLE1BQU0sRUFBQyxJQUFJLEVBQUMsTUFBTTtvQkFDdEIsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtvQkFDL0IsSUFBSSxDQUFDLElBQUk7d0JBQUUsT0FBTyxLQUFLLENBQUE7b0JBRXZCLElBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO3dCQUNWLElBQUksQ0FBQyxHQUFHLEtBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7d0JBQzNCLElBQUcsQ0FBQyxFQUFFOzRCQUNKLE9BQU87Z0NBQ0wsR0FBRyxFQUFDLENBQUMsQ0FBQyxHQUFHO2dDQUNULFFBQVEsRUFBQyxDQUFDLENBQUMsUUFBUTtnQ0FDbkIsTUFBTSxFQUFDLENBQUMsQ0FBQyxNQUFNO2dDQUNmLEtBQUssRUFBQyxDQUFDLENBQUMsS0FBSztnQ0FDYixnQkFBZ0IsRUFBQyxDQUFDLENBQUMsZ0JBQWdCO2dDQUNuQyxVQUFVLEVBQUMsQ0FBQyxDQUFDLFVBQVU7Z0NBQ3ZCLFlBQVksRUFBQyxDQUFDLENBQUMsWUFBWTtnQ0FDM0IsT0FBTyxFQUFDLENBQUMsQ0FBQyxPQUFPOzZCQUNsQixDQUFBO3lCQUNGO3FCQUNGO3lCQUNJO3dCQUNILE9BQU87NEJBQ0wsR0FBRyxFQUFDLElBQUksQ0FBQyxHQUFHOzRCQUNaLFFBQVEsRUFBQyxJQUFJLENBQUMsUUFBUTs0QkFDdEIsTUFBTSxFQUFDLElBQUksQ0FBQyxNQUFNOzRCQUNsQixLQUFLLEVBQUMsSUFBSSxDQUFDLEtBQUs7NEJBQ2hCLGdCQUFnQixFQUFDLElBQUksQ0FBQyxnQkFBZ0I7NEJBQ3RDLFVBQVUsRUFBQyxJQUFJLENBQUMsVUFBVTs0QkFDMUIsWUFBWSxFQUFDLElBQUksQ0FBQyxZQUFZOzRCQUM5QixPQUFPLEVBQUMsSUFBSSxDQUFDLE9BQU87eUJBQ3JCLENBQUE7cUJBQ0Y7Z0JBQ0gsQ0FBQzthQUNKO1lBQ0Q7Z0JBQ0UsS0FBSyxFQUFDLE9BQU87Z0JBQ2IsT0FBTyxFQUFDLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQztnQkFDbkMsSUFBSSxFQUFFLFVBQU8sTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNOzs7O29DQUN2QixxQkFBTSxNQUFNLENBQUMsT0FBTyxPQUFkLE1BQU0sMkJBQVksSUFBSSxZQUFDOztnQ0FBakMsQ0FBQyxHQUFHLFNBQTZCO2dDQUNyQyxzQkFBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUE7OztxQkFDbEM7YUFDRjtZQUNEO2dCQUNFLEtBQUssRUFBQyxRQUFRO2dCQUNkLE9BQU8sRUFBQyxDQUFDLFlBQVksRUFBQyxZQUFZLENBQUM7Z0JBQ25DLElBQUksRUFBQyxVQUFDLE1BQU0sRUFBQyxJQUFJLEVBQUMsTUFBTTtvQkFDdEIsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtvQkFDN0IsSUFBSSxDQUFDLElBQUk7d0JBQUUsT0FBTyxLQUFLLENBQUE7b0JBQ3pCLElBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFBRSxNQUFNLENBQUMsVUFBVSxPQUFqQixNQUFNLDJCQUFlLElBQUksV0FBQzs7d0JBQ2pDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQy9CLENBQUM7YUFDRjtTQUNBLENBQUE7UUFJRCxjQUFTLEdBR0wsRUFBRSxDQUFBO1FBZ0NKLGtEQUFrRDtRQUNsRCxHQUFHO1FBQ0gsd0JBQXdCO1FBQ3hCLEdBQUc7UUFDSCxrREFBa0Q7UUFDbEQsWUFBTyxHQUFHLFVBQUMsTUFBcUIsRUFBRSxTQUFtQjtZQUVuRCxJQUFJLFFBQVEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUUsS0FBSSxDQUFDLFFBQVEsRUFBRSxLQUFJLENBQUMsQ0FBQTtZQUV4RCw0Q0FBNEM7WUFDNUMsS0FBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFBO1lBRXRDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQSxHQUFHO2dCQUNyQixJQUFJLEdBQUcsRUFBRTtvQkFDUCxJQUFJLFNBQVM7d0JBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFBO29CQUNsQyxLQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFBLENBQUMsc0NBQXNDO2lCQUM1RDtZQUNMLENBQUMsQ0FBQyxDQUFBO1lBRUYsT0FBTyxRQUFRLENBQUE7UUFDbkIsQ0FBQyxDQUFBO1FBRUQsZUFBVSxHQUFHLFVBQU8sRUFBRTs7Z0JBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO2dCQUMvQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUE7OzthQUMxQixDQUFBO1FBR0QsaUJBQVksR0FBRyxVQUFDLE9BQW9DLEVBQUUsSUFBd0I7O1lBQXhCLHFCQUFBLEVBQUEsT0FBWSxPQUFPLENBQUMsSUFBSTtZQUU1RSxLQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQTtZQUM3QixLQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUE7WUFFakMsTUFBQSxPQUFPLENBQUMsTUFBTSwwQ0FBRSxPQUFPLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxLQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBaEQsQ0FBZ0QsQ0FBQyxDQUFBO1lBRTlFLElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFDckIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFPLENBQWUsRUFBRSxJQUFpQixFQUFFLE1BQXdCOzs7O29DQUN6RSxxQkFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBQTs7Z0NBQXZDLEdBQUcsR0FBRyxTQUFpQztnQ0FDM0MsSUFBRyxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO29DQUM3QixJQUFHLEdBQUcsS0FBSyxJQUFJLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQzt3Q0FBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQUMsS0FBSyxFQUFDLG1CQUFtQixFQUFFLE9BQU8sRUFBQyxHQUFHLEVBQUUsTUFBTSxFQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsVUFBVSxFQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUMsQ0FBQyxDQUFBOzt3Q0FDaEosc0JBQU8sR0FBRyxFQUFDO2lDQUNqQjtnQ0FDRCxzQkFBTyxHQUFHLEVBQUM7OztxQkFDWixDQUFDLENBQUE7YUFDSDtZQUVELElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsV0FBVyxNQUFLLGNBQWM7Z0JBQUUsS0FBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUUsT0FBZ0MsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO1FBQzNILENBQUMsQ0FBQTtRQUVELGlCQUFZLEdBQUcsVUFBTyxPQUFnQixFQUFFLElBQWtCO1lBQWxCLHFCQUFBLEVBQUEsT0FBSyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsSUFBSTs7Ozs7NEJBQ3hELElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBLENBQUMseUJBQXlCOzRCQUNuRCxxQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUEsQ0FBQyxvRUFBb0U7Z0NBRHRGLHlCQUF5Qjt3QkFDMUQsc0JBQU8sU0FBMkMsRUFBQSxDQUFDLG9FQUFvRTs7OztTQUN4SCxDQUFBO1FBRUQsZ0JBQVcsR0FBRyxVQUFDLE9BQWdCLEVBQUUsQ0FBRSxFQUFFLGFBQW1CO1lBQW5CLDhCQUFBLEVBQUEscUJBQW1CO1lBRXBELE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQSxPQUFPO2dCQUV0QixzQkFBc0I7Z0JBQ3RCLDZDQUE2QztnQkFDN0MsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQTtnQkFFekIsc0RBQXNEO2dCQUN0RCxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUM7b0JBQ3BCLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBTyxDQUFlLEVBQUUsSUFBZ0I7Ozs7OztvQ0FHaEQsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7b0NBRTVCLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQTt5Q0FHbEMsQ0FBQSxJQUFJLEtBQUssT0FBTyxDQUFBLEVBQWhCLHdCQUFnQjtvQ0FDWixxQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUE7O29DQUFwQyxHQUFHLEdBQUcsU0FBOEIsQ0FBQTs7O3lDQUMzQixTQUFTLEVBQVQsd0JBQVM7b0NBQ1oscUJBQU0sSUFBSSxDQUFDLElBQUksT0FBVCxJQUFJLGlCQUFNO2dEQUNwQixLQUFLLEVBQUUsVUFBRyxNQUFNLENBQUMsS0FBSyxjQUFJLENBQUMsQ0FBQyxLQUFLLENBQUU7Z0RBQ25DLFFBQVEsRUFBRSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsUUFBUSxDQUFDLCtCQUErQjs2Q0FDNUQsVUFBSyxNQUFBLENBQUMsQ0FBQyxPQUFPLG1DQUFJLEVBQUUsWUFBQyxDQUFDLG9DQUFvQzs7b0NBSDNELEdBQUcsR0FBRyxTQUdnQixDQUFBLENBQUMsb0NBQW9DOzt3Q0FHL0Qsc0JBQU8sR0FBRyxFQUFBOzs7eUJBQ2IsQ0FBQyxDQUFBO2lCQUNIO2dCQUVELElBQUksYUFBYTtvQkFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUE7cUJBQzlCO29CQUVILHNCQUFzQjtvQkFDdEIsS0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUE7b0JBRTNCLElBQU0sU0FBUyxHQUFHLFVBQUMsS0FBSzt3QkFDdEIsS0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFBO3dCQUVqQyxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsWUFBWSxRQUFROzRCQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQTt3QkFFL0UsNENBQTRDO3dCQUM1QyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUM7NEJBQ3BCLEtBQUksQ0FBQyxNQUFNLENBQUMsVUFBRyxLQUFLLGNBQUksQ0FBQyxDQUFDLEtBQUssQ0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFBO3dCQUMxQyxDQUFDLENBQUMsQ0FBQTt3QkFFRixPQUFPLENBQUMsT0FBTyxDQUFDLENBQUE7b0JBQ3BCLENBQUMsQ0FBQTtvQkFFRCxvQ0FBb0M7b0JBQ3BDLElBQUksS0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssSUFBSTt3QkFBRSxTQUFTLENBQUMsS0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBOzt3QkFDbEUsS0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDO2lCQUM3QztZQUdQLENBQUMsQ0FBQyxDQUFBO1FBRU4sQ0FBQyxDQUFBO1FBK0JELFFBQUcsR0FBRyxVQUFDLFNBQW1CO1lBQUUsY0FBYTtpQkFBYixVQUFhLEVBQWIscUJBQWEsRUFBYixJQUFhO2dCQUFiLDZCQUFhOztZQUN2QyxPQUFPLEtBQUksQ0FBQyxLQUFLLE9BQVYsS0FBSSxpQkFBTyxTQUFTLEVBQUUsS0FBSyxVQUFLLElBQUksV0FBQztRQUM5QyxDQUFDLENBQUE7UUFFRCxXQUFNLEdBQUcsVUFBQyxTQUFtQjtZQUFFLGNBQWE7aUJBQWIsVUFBYSxFQUFiLHFCQUFhLEVBQWIsSUFBYTtnQkFBYiw2QkFBYTs7WUFDMUMsT0FBTyxLQUFJLENBQUMsS0FBSyxPQUFWLEtBQUksaUJBQU8sU0FBUyxFQUFFLFFBQVEsVUFBSyxJQUFJLFdBQUM7UUFDakQsQ0FBQyxDQUFBO1FBRUQsU0FBSSxHQUFHLFVBQUMsU0FBbUI7WUFBRSxjQUFhO2lCQUFiLFVBQWEsRUFBYixxQkFBYSxFQUFiLElBQWE7Z0JBQWIsNkJBQWE7O1lBQ3hDLE9BQU8sS0FBSSxDQUFDLEtBQUssT0FBVixLQUFJLGlCQUFPLFNBQVMsRUFBRSxNQUFNLFVBQUssSUFBSSxXQUFDO1FBQy9DLENBQUMsQ0FBQTtRQUVELFNBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO1FBR1IsVUFBSyxHQUFHLFVBQU8sU0FBbUIsRUFBRSxNQUFxQjtZQUFFLGNBQWE7aUJBQWIsVUFBYSxFQUFiLHFCQUFhLEVBQWIsSUFBYTtnQkFBYiw2QkFBYTs7Ozs7Ozs0QkFHNUUsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLElBQUksQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsUUFBUSxLQUFJLElBQUk7Z0NBQUUsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBOztnQ0FDeEcsUUFBUSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUE7NEJBRWxDLElBQUksQ0FBQyxRQUFRO2dDQUFFLHNCQUFNOzRCQUdWLHFCQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO29DQUN4QyxPQUFPLEVBQUUsSUFBSTtvQ0FDYixNQUFNLFFBQUE7aUNBQ1AsQ0FBQyxFQUFBOzs0QkFIRixRQUFRLEdBQUcsU0FHVCxDQUFBOzRCQUVGLElBQUksUUFBUTtnQ0FBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFBOzRCQUV2RCx3QkFBd0I7NEJBQ3hCLHNCQUFPLFFBQVEsYUFBUixRQUFRLHVCQUFSLFFBQVEsQ0FBRSxPQUFPLEVBQUE7Ozs7U0FFM0IsQ0FBQTtRQUVELCtDQUErQztRQUMvQyxxQkFBZ0IsR0FBRyxVQUFPLENBQWUsRUFBRSxRQUFtQixFQUFFLEtBQWM7Ozs7Z0JBRzVFLGtEQUFrRDtnQkFDbEQsSUFBSSxRQUFRLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsVUFBVTtvQkFBRSxNQUFBLE1BQUEsTUFBQSxRQUFRLENBQUMsVUFBVSwwQ0FBRSxPQUFPLDBDQUFFLFNBQVMsMENBQUUsT0FBTyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBQyxLQUFLLE9BQUEsRUFBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQTVCLENBQTRCLENBQUMsQ0FBQSxDQUFDLHNDQUFzQztnQkFFdkwsbUZBQW1GO2dCQUNuRixJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRTtvQkFDUixVQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxhQUFELENBQUMsdUJBQUQsQ0FBQyxDQUFFLEtBQUssQ0FBQyxDQUFBO29CQUNqQyxJQUFJLENBQUEsT0FBSyxhQUFMLE9BQUssdUJBQUwsT0FBSyxDQUFFLElBQUksYUFBWSxRQUFRO3dCQUFFLHNCQUFPLE9BQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFBLENBQUMsd0JBQXdCO2lCQUN2Rzs7O2FBQ0YsQ0FBQTtRQUVELGNBQVMsR0FBRyxVQUFPLFFBQWtCLEVBQUUsT0FLakM7WUFMaUMsd0JBQUEsRUFBQSxZQUtqQzs7Ozs7O2lDQUVFLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsS0FBSSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsUUFBUSxDQUFBLENBQUEsRUFBM0Qsd0JBQTJEOzRCQUMzRCxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVE7Z0NBQUUsT0FBTyxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTs0QkFDOUQscUJBQU0sT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQXBDLENBQW9DLENBQUMsRUFBQTs7NEJBQWxHLEdBQUcsR0FBRyxTQUE0Rjs0QkFDeEcsc0JBQU8sR0FBRyxFQUFBO2dDQUNQLE1BQU0seUJBQXlCLENBQUE7Ozs7U0FFekMsQ0FBQTtRQStKRCxrQkFBYSxHQUFHLFVBQU8sR0FBcUIsRUFBRSxJQUFpQjs7Ozs7O3dCQUV6RCxDQUFDLEdBQTBCLEVBQUUsQ0FBQTt3QkFFakMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUseURBQXlEOzRCQUNqRixDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTs0QkFDaEIsQ0FBQyxDQUFDLE9BQU8sR0FBSSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBOzRCQUN6QixDQUFDLENBQUMsVUFBVSxHQUFJLFNBQVMsQ0FBQTs0QkFDekIsa0JBQWtCO3lCQUNuQjs2QkFDSSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxFQUFFLGtFQUFrRTs0QkFDOUYsR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7NEJBQ3pCLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBOzRCQUNoQixDQUFDLENBQUMsT0FBTyxHQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7NEJBQ3pCLENBQUMsQ0FBQyxVQUFVLEdBQUksU0FBUyxDQUFBOzRCQUN6QixrQkFBa0I7eUJBQ3JCOzZCQUFNLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUTs0QkFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTs2QkFHdEQsQ0FBQSxPQUFPLENBQUMsS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFBLEVBQTFDLHdCQUEwQzs2QkFFeEMsQ0FBQSxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQSxFQUFmLHdCQUFlO3dCQUVaLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsYUFBRCxDQUFDLHVCQUFELENBQUMsQ0FBRSxFQUFFLENBQUMsQ0FBQTt3QkFFekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBO3dCQVFsQixxQkFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQUEsQ0FBQyxhQUFELENBQUMsdUJBQUQsQ0FBQyxDQUFFLEVBQUUsbUNBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUE7O3dCQUFwRixHQUFHLEdBQUcsU0FBOEU7d0JBQzFGLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxRQUFROzRCQUFFLEdBQUcsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQSxDQUFDLDRDQUE0Qzt3QkFDL0YsSUFBSTt3QkFFSixzQkFBTyxHQUFHLEVBQUM7NEJBR2Ysc0JBQU8sSUFBSSxFQUFDOzs7YUFFYixDQUFBO1FBamJLLElBQUcsT0FBTyxDQUFDLFFBQVE7WUFBRSxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7UUFFdEQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLFlBQVksQ0FDM0IsRUFBRSxFQUNGLElBQUksQ0FBQyxRQUFRLEVBQ2IsU0FBUyxDQUFDLE9BQU87U0FDbEIsQ0FBQztRQUVGLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLEtBQUssQ0FBQTtRQUUzQixlQUFlO1FBQ2YsSUFBSSxnQkFBZ0IsSUFBSSxVQUFVLEVBQUM7WUFDakMsVUFBVSxDQUFDLGNBQWMsR0FBRztnQkFFMUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQyxJQUFLLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxRQUFRO29CQUFFLEtBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUEsQ0FBQSxDQUFDLENBQUMsQ0FBQSxDQUFDLGdEQUFnRDtZQUN2SSxDQUFDLENBQUE7U0FDRjtRQUVELHNCQUFzQjtRQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUMsQ0FBQyxDQUFBO1FBRXZDLElBQUcsSUFBSSxDQUFDLEtBQUs7WUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7UUFFakQsSUFBSSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsU0FBUztZQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsS0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBZixDQUFlLENBQUMsQ0FBQTtJQUMzRSxDQUFDO0lBb0hLLHNCQUFLLEdBQVgsVUFBWSxRQUFrQixFQUFFLElBQXlCOzs7Ozs7NEJBRXJELHFCQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUE7O3dCQUEzQixTQUEyQixDQUFBO3dCQUVyQixHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLFFBQVEsVUFBQSxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTt3QkFFekQscUJBQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQU8sUUFBUTs7Ozs0Q0FDakQsSUFBSSxJQUFJO2dEQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUE7NENBQ2hDLHFCQUFNLElBQUksQ0FBQyxJQUFJLENBQUM7b0RBQ3JCLEtBQUssRUFBRSxPQUFPO29EQUNkLFFBQVEsVUFBQTtpREFDVCxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBQTtnREFIeEIsc0JBQU8sU0FHaUIsRUFBQTs7O2lDQUN6QixDQUFDLENBQUMsRUFBQTs7d0JBTkMsR0FBRyxHQUFHLFNBTVA7d0JBRUgsc0JBQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFDLENBQUMsRUFBQyxDQUFDLElBQUssT0FBQSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFOLENBQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUE7Ozs7S0FDbkQ7SUFFSyx1QkFBTSxHQUFaLFVBQWEsUUFBa0I7Ozs7Ozs0QkFFYixxQkFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxRQUFRLFVBQUEsRUFBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQU8sUUFBUTs7OzRDQUNoRyxxQkFBTSxJQUFJLENBQUMsSUFBSSxDQUFDOzRDQUNyQixLQUFLLEVBQUUsUUFBUTs0Q0FDZixRQUFRLFVBQUE7eUNBQ1QsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUE7NENBSHhCLHNCQUFPLFNBR2lCLEVBQUE7Ozs2QkFDekIsQ0FBQyxDQUFDLEVBQUE7O3dCQUxHLEdBQUcsR0FBRyxTQUtUO3dCQUVILHNCQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBQyxDQUFDLEVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBTixDQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFBOzs7O0tBQ25EO0lBbUVDLGtEQUFrRDtJQUNsRCxHQUFHO0lBQ0gsdUJBQXVCO0lBQ3ZCLEdBQUc7SUFDSCxrREFBa0Q7SUFHNUMscUJBQUksR0FBVixVQUFXLE9BQVcsRUFBRSxJQUEwQjtRQUExQixxQkFBQSxFQUFBLE9BQWMsT0FBTyxDQUFDLElBQUk7Ozs7Ozt3QkFFNUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQTt3QkFDaEQsU0FBUyxHQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLG1CQUFtQjt3QkFBcEIsQ0FBQTt3QkFDaEYsU0FBUyxHQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQTs2QkFFckQsU0FBUyxFQUFULHdCQUFTO3dCQUFFLHFCQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQzs0QkFFckQsaUJBQWlCOzBCQUZvQzs7d0JBQXRDLFNBQXNDLENBQUE7Ozs2QkFHakQsU0FBUyxFQUFULHdCQUFTO3dCQUFFLHFCQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQzs0QkFFckQsZ0JBQWdCOzBCQUZxQzs7d0JBQXRDLFNBQXNDLENBQUE7Ozs2QkFHakQsUUFBUSxFQUFSLHdCQUFRO3dCQUFFLHFCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUE7O3dCQUEvQixTQUErQixDQUFBOzs0QkFFN0Msc0JBQU8sT0FBTyxFQUFBOzs7O0tBR2I7SUFFRCx1QkFBTSxHQUFOLFVBQU8sQ0FBSyxFQUFFLElBR1I7UUFIUSxxQkFBQSxFQUFBLFNBR1I7UUFFSixJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUMsRUFBRSwwQkFBMEI7WUFDNUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQUUsQ0FBQyxHQUFHLEVBQUMsT0FBTyxFQUFFLENBQUMsRUFBQyxDQUFBO1lBQzlGLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7Z0JBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUN0RCxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUksQ0FBQyxhQUFELENBQUMsdUJBQUQsQ0FBQyxDQUFFLEtBQUssQ0FBQTtnQkFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLFVBQUcsSUFBSSxDQUFDLE9BQU8sY0FBSSxDQUFDLENBQUMsS0FBSyxDQUFFLENBQUEsQ0FBQyxnQkFBZ0I7WUFDckYsd0RBQXdEO1lBQ3hELElBQUksSUFBSSxDQUFDLE9BQU87Z0JBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFBLENBQUMseUJBQXlCO1NBQ3ZFO1FBRUQsbUJBQW1CO1FBQ25CLElBQUksQ0FBQyxhQUFELENBQUMsdUJBQUQsQ0FBQyxDQUFFLEtBQUs7WUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUV0RCxPQUFPLENBQUMsQ0FBQTtJQUNWLENBQUM7SUFHSyx5QkFBUSxHQUFkLFVBQWUsS0FBSyxFQUFFLE1BQW9CLEVBQUUsSUFBYSxFQUFFLE1BQU0sRUFBRSxVQUFXO1FBQWxDLHFCQUFBLEVBQUEsU0FBYTs7Ozs7Ozs7d0JBR3JELElBQUcsS0FBSyxJQUFJLElBQUk7NEJBQUUsc0JBQU8sQ0FBQyxnRUFBZ0U7d0JBQzFGLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7NEJBQUUsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUE7d0JBQy9FLElBQUcsSUFBSSxDQUFDLEtBQUs7NEJBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBR2xDLHFCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFHLElBQVksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsSUFBc0I7Z0NBRTlGLElBQUcsS0FBSSxDQUFDLEtBQUs7b0NBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0NBRTVDLG1DQUFtQztnQ0FDbkMsSUFBSSxJQUFJLEtBQUssU0FBUztvQ0FBRSxPQUFNO3FDQUN6QjtvQ0FDSCxJQUFJLEdBQUcsS0FBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtvQ0FDeEIsMkdBQTJHO29DQUMzRyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQTtvQ0FFNUIsSUFBSSxLQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7d0NBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUEsQ0FBQyxvQ0FBb0M7b0NBRW5GLFdBQVc7b0NBQ1gsSUFBRyxJQUFJLENBQUMsT0FBTyxLQUFLLFNBQVM7d0NBQUUsT0FBTztvQ0FDdEMsT0FBTyxJQUFJLENBQUM7aUNBQ2I7NEJBQ0gsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBQTs0QkFqQnZCLHNCQUFPLFNBaUJnQixFQUFBOzs7d0JBRXpCLHNCQUFPLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLEVBQUE7Ozs7O0tBRXhDO0lBRUQsMENBQTBDO0lBQzFDLHdCQUFPLEdBQVAsVUFBUSxRQUE0QjtRQUFwQyxpQkFnREM7UUE5Q0MsSUFBSSxRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM3QyxpQkFBaUI7WUFDakIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHO2dCQUFFLFFBQVEsQ0FBQyxHQUFHLEdBQUcsY0FBYyxFQUFFLENBQUE7WUFDbEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUFFLFFBQVEsQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQTtZQUU1Qyw2QkFBNkI7WUFDN0IsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUE7WUFFakMsWUFBWTtZQUNaLElBQUksU0FBTyxHQUFlLENBQUMsYUFBRCxDQUFDLGNBQUQsQ0FBQyxHQUFJO2dCQUM3QixFQUFFLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQ2YsR0FBRyxFQUFFLFFBQVEsQ0FBQyxHQUFHO2dCQUNqQixRQUFRLEVBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxRQUFRLENBQUMsRUFBRTtnQkFDbkIsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsZ0JBQWdCLEVBQUUsRUFBRTtnQkFDcEIsUUFBUSxFQUFDLEVBQUU7Z0JBQ1gsT0FBTyxFQUFDLEVBQUU7Z0JBQ1YsVUFBVSxFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ3JCLFlBQVksRUFBQyxDQUFDO2dCQUNkLE9BQU8sRUFBQyxDQUFDO2dCQUNULE1BQU0sRUFBRSxJQUFJLEdBQUcsRUFBRTthQUNsQixDQUFDO1lBRUYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFPLEVBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxzQ0FBc0M7WUFFdkUsSUFBRyxJQUFJLENBQUMsS0FBSztnQkFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUU3RCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsR0FBSSxTQUFPLENBQUE7WUFFbEMsdUZBQXVGO1lBQ3ZGLEtBQUssSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBQztnQkFDeEIsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDNUIsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLElBQUksRUFBQztvQkFDcEIsSUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUEsQ0FBQyxnQkFBZ0I7b0JBQ2hELElBQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtvQkFDNUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUM7d0JBQ3JCLElBQUksS0FBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRTs0QkFDbEIsS0FBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsU0FBTyxDQUFDLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFBO3lCQUNqRDtvQkFDSCxDQUFDLENBQUMsQ0FBQTtpQkFDSDthQUNOO1lBRUQsT0FBTyxTQUFPLENBQUMsQ0FBQyw2Q0FBNkM7U0FDOUQ7O1lBQU0sT0FBTyxLQUFLLENBQUE7SUFDckIsQ0FBQztJQUVELDJCQUFVLEdBQVYsVUFBVyxJQUFzQjtRQUFqQyxpQkFnQkM7UUFmQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUE7UUFFNUQsSUFBRyxDQUFDLEVBQUU7WUFFRixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQSxDQUFDO2dCQUNwQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssSUFBSSxFQUFDO29CQUNwQixJQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQTtvQkFDL0IsSUFBSSxLQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQzt3QkFBRSxLQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUE7aUJBQ2xFO1lBQ0gsQ0FBQyxDQUFDLENBQUE7WUFFRixPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUE7WUFDWCxPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsOENBQThDO0lBQzlDLDBCQUFTLEdBQVQsVUFBVSxJQUFlLEVBQUUsTUFBUztRQUFULHVCQUFBLEVBQUEsV0FBUztRQUNsQyxJQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDckIsSUFBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxFQUFFLEtBQUssTUFBTSxFQUFFLEVBQUUscUJBQXFCO2dCQUM5RSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDMUIsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBOENELHdCQUF3QjtJQUN4Qix3QkFBTyxHQUFQLFVBQVEsSUFBeUIsRUFBQyxPQUFVLEVBQUMsSUFBYztRQUFuRCxxQkFBQSxFQUFBLFNBQXlCO1FBQUMsd0JBQUEsRUFBQSxZQUFVO1FBQUMscUJBQUEsRUFBQSxnQkFBYztRQUV2RCxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sU0FBQSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLFNBQUEsRUFBRSxDQUFBO1FBRXBFLElBQUcsT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQ3pCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDeEIsSUFBRyxDQUFDLEVBQUU7Z0JBQ0osQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTthQUNmO1NBQ0o7YUFBTSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUMseUJBQVEsR0FBUixVQUFTLENBQWM7UUFBdkIsaUJBbUNDO1FBbENDLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUV4QixJQUFNLEtBQUssa0JBQUksQ0FBQyxDQUFDLEtBQUssVUFBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFDLENBQUE7UUFDeEQsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFBO1FBRWhCLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBQSxLQUFLOzs7WUFDYixJQUFHLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFBRSxPQUFPLEtBQUssQ0FBQztZQUMvQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxVQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFHLENBQUMsQ0FBQyxPQUFPLE1BQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFFLEdBQUcsS0FBSyxDQUFBO1lBQ2pFLEtBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQywwQ0FBMEM7WUFDbkUsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRztnQkFBRSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUM1QyxDQUFDLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUE7WUFFOUIsS0FBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFDLEtBQUssT0FBQSxFQUFDLENBQUMsQ0FBQTtZQUU5QyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUU7Z0JBRVQsOEVBQThFO2dCQUM5RSxLQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsV0FBRSxHQUFDLEtBQUssSUFBRyxNQUFBLE1BQUEsQ0FBQyxDQUFDLEdBQUcsMENBQUUsTUFBTSxtQ0FBSSxDQUFDLENBQUMsR0FBRyxNQUFFLENBQUM7Z0JBR3ZELEtBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxVQUFDLElBQUk7OztvQkFFL0IsSUFBTSxPQUFPLEdBQUcsQ0FBQyxNQUFBLENBQUMsQ0FBQyxHQUFHLDBDQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLEtBQUEsQ0FBQyxDQUFDLEdBQUcsQ0FBQSxDQUFDLFNBQVMsMEJBQUMsSUFBSSxHQUFLLEVBQUUsVUFBRSxDQUFDLENBQUMsSUFBSSxDQUFBO29CQUV4RSxLQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUM7d0JBQzFCLE9BQU8sQ0FBQyxDQUFDLEtBQUksRUFBRTs0QkFDYixLQUFLLE9BQUE7NEJBQ0wsT0FBTyxTQUFBO3lCQUNSLENBQUMsQ0FBQTtvQkFDTixDQUFDLENBQUMsQ0FBQTtnQkFDSixDQUFDLENBQUMsQ0FBQTthQUNIO1FBQ0gsQ0FBQyxDQUFDLENBQUE7UUFDRixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsNEJBQVcsR0FBWCxVQUFZLFlBQVk7UUFDcEIsT0FBTyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUE7SUFDM0MsQ0FBQztJQUVELDRCQUFXLEdBQVgsVUFDRSxLQUFLLEVBQ0wsS0FBUSxFQUNSLE1BQU8sRUFDUCxNQUEwQztRQUo1QyxpQkF3REM7UUF0REMsc0JBQUEsRUFBQSxVQUFRO1FBRVIsdUJBQUEsRUFBQSxTQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLO1FBRzFDLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBTSxPQUFPOzs7O2dCQUUxQixhQUFhLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFBO2dCQUV0QyxRQUFRLEdBQUcsRUFBQyxLQUFLLE9BQUEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUMsRUFBRSxPQUFPLEVBQUUsRUFBQyxjQUFjLEVBQUUsV0FBVyxFQUFDLEVBQUMsQ0FBQywwRUFBMEU7Z0JBQTNFLENBQUE7Z0JBRXZHLDZCQUE2QjtnQkFDN0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFVBQU0sYUFBYTs7Ozs7OztnQ0FFM0MsU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUE7cUNBRXRDLFNBQVMsRUFBVCx5QkFBUztnQ0FFWCxJQUFHLElBQUksQ0FBQyxLQUFLO29DQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDOzs7O2dDQUc3QyxHQUFHLFNBQUEsQ0FBQztxQ0FHSCxDQUFBLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLE1BQU0sS0FBSSxNQUFNLENBQUMsV0FBVyxFQUFFLEtBQUssUUFBUSxDQUFBLEVBQXRELHdCQUFzRDtnQ0FDbEQscUJBQU0sU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxFQUFBOztnQ0FBbEQsR0FBRyxHQUFJLFNBQTJDLENBQUE7OztxQ0FJM0MsQ0FBQSxNQUFNLENBQUMsV0FBVyxFQUFFLEtBQUssS0FBSyxJQUFJLENBQUMsQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxDQUFBLENBQUEsRUFBbEQsd0JBQWtEO2dDQUNuRCxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQjtnQ0FBdEIsQ0FBQTtxQ0FFMUMsS0FBSyxFQUFMLHdCQUFLO2dDQUdELElBQUksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksRUFBckIsQ0FBcUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsQ0FBQyxDQUFDLEdBQUcsRUFBTCxDQUFLLENBQUMsQ0FBQTs7cUNBQ3ZILENBQUMsTUFBQSxTQUFTLENBQUMsR0FBRywwQ0FBRSxTQUFTLENBQUMsRUFBMUIsd0JBQTBCO2dDQUFHLHFCQUFNLENBQUEsS0FBQSxTQUFTLENBQUMsR0FBRyxDQUFBLENBQUMsU0FBUywwQkFBQyxLQUFLLFVBQUssSUFBSSxZQUFDOztnQ0FBN0MsS0FBQSxTQUE2QyxDQUFBOzs7Z0NBQUcsS0FBQSxLQUFLLENBQUE7OztnQ0FBbEcsR0FBRyxJQUFJLFVBQU8sS0FBb0YsS0FBQyxDQUFBOzs7Z0NBQzlGLEdBQUcsR0FBRyxRQUFRLENBQUE7Ozs7cUNBR2QsQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxDQUFBLEVBQWYseUJBQWU7Z0NBQ2YscUJBQU0sQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUEsRUFBQTs7Z0NBQWpELEdBQUcsR0FBSSxTQUEwQyxDQUFBOzs7Z0NBSTlDLEdBQUcsR0FBRyxRQUFRLENBQUE7OztnQ0FDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUE7Ozs7Z0NBR3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsR0FBQyxDQUFDLENBQUE7Ozs7O3FCQUd4QyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQWpCLENBQWlCLENBQUMsQ0FBQTs7O2FBQ2pDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFSyw0QkFBVyxHQUFqQixVQUFrQixLQUFLOzs7Ozs7O3dCQUNuQixJQUFHLENBQUMsS0FBSyxDQUFDLElBQUk7NEJBQUUsc0JBQU87d0JBQ25CLEtBQUssR0FBRyxNQUFBLE1BQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxtQ0FBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLG1DQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQTt3QkFDaEgsSUFBSSxDQUFDLEtBQUs7NEJBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTs2QkFDM0MsS0FBSyxFQUFMLHdCQUFLOzZCQUNDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFsQix3QkFBa0I7d0JBQVMscUJBQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBQTs0QkFBcEUsc0JBQU8sU0FBNkQsRUFBQzs0QkFDeEYsc0JBQU07OzRCQUNWLHNCQUFPLEtBQUssRUFBQTs7Ozs7S0FDdEI7SUFDTCxhQUFDO0FBQUQsQ0FBQyxBQWp4QkQsSUFpeEJDOztBQUVELGVBQWUsTUFBTSxDQUFBIn0=