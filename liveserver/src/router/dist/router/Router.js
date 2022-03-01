import { __awaiter } from "tslib";
import StateManager from 'anotherstatemanager';
import { getRouteMatches } from '../common/general.utils';
import { randomId, pseudoObjectId, } from '../common/id.utils';
import { getParamNames } from '../common/parse.utils';
import errorPage from '../services/http/404';
import { Endpoint } from './Endpoint';
export const DONOTSEND = 'DONOTSEND';
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
export class Router {
    // -------------------- User-Specified Options --------------------
    constructor(options = { debug: false }) {
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
                post: () => {
                    return 'pong';
                }
            },
            {
                route: 'services/**',
                get: {
                    object: this.SERVICES,
                    transform: (reference, ...args) => {
                        let dict = {};
                        // Use First Argument
                        let keys = (args.length > 0) ? [args[0]] : Object.keys(reference);
                        keys.forEach(k => {
                            const o = reference[k];
                            if ((o === null || o === void 0 ? void 0 : o.serviceType) === 'default')
                                dict[k] = o.name;
                        });
                        // Drill on Response
                        args.forEach((v, i) => dict = dict[v]);
                        return dict;
                    }
                },
            },
            {
                route: '/',
                aliases: ['routes/**'],
                get: {
                    object: this.ROUTES,
                    transform: (reference, ...args) => {
                        let o = {};
                        // Shift Arguments
                        let keys = (args.length > 0) ? [args[0]] : Object.keys(reference);
                        keys.forEach(key => {
                            if (key)
                                o[key] = {
                                    route: reference[key].route.split('/').filter(str => !str.match(/\*\*?/)).join('/'),
                                    args: reference[key].args,
                                    wildcard: key.includes('*')
                                }; // Shallow copy
                        });
                        // Auto-Drill on References
                        args.forEach((v, i) => o = o[v]);
                        return o;
                    }
                }
            },
            {
                route: 'sendMessage',
                aliases: ['message', 'sendMsg'],
                post: (Router, args) => {
                    return Router.sendMsg(args[0], args[1], args[2]);
                }
            },
            {
                route: 'setUserServerDetails',
                post: (Router, args, origin) => {
                    let user = Router.USERS[origin];
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
                post: (Router, args, origin) => {
                    let user = Router.USERS[origin];
                    if (!user)
                        return false;
                    if (typeof args === 'object' && !Array.isArray(args)) {
                        Object.assign(user.props, args);
                        return true;
                    }
                    else if (Array.isArray(args) && typeof args[1] === 'object') {
                        let u = Router.USERS[args[0]];
                        if (u)
                            Object.assign(u.props, args[1]);
                        return true;
                    }
                    return false;
                }
            },
            {
                route: 'getProps',
                post: (Router, args, origin) => {
                    let user = Router.USERS[origin];
                    if (!user)
                        return false;
                    if (args[0]) {
                        let u = Router.USERS[args[0]];
                        if (u)
                            return u.props;
                    }
                    else
                        return user.props;
                }
            },
            {
                route: 'blockUser',
                post: (Router, args, origin) => {
                    let user = Router.USERS[origin];
                    if (!user)
                        return false;
                    return this.blockUser(user, args[0]);
                }
            },
            {
                route: 'users/**',
                get: {
                    object: this.USERS,
                    transform: (o, ...args) => {
                        let dict = {};
                        // Use First Argument
                        let keys = (args.length > 0) ? [args[0]] : Object.keys(o);
                        keys.forEach(k => {
                            const u = o[k];
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
                        args.forEach((v, i) => dict = dict[v]);
                        return dict;
                    }
                }
            },
            {
                route: 'getUser',
                post: (Router, args, origin) => {
                    let user = Router.USERS[origin];
                    if (!user)
                        return false;
                    if (args[0]) {
                        let u = this.USERS[args[0]];
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
                post: (Router, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    let u = yield Router.addUser(...args);
                    return { message: !!u, id: u.id };
                })
            },
            {
                route: 'logout',
                aliases: ['removeUser', 'endSession'],
                post: (Router, args, origin) => {
                    let user = Router.USERS[origin];
                    if (!user)
                        return false;
                    if (args[0])
                        Router.removeUser(...args);
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
        this.connect = (config, onconnect) => {
            let endpoint = new Endpoint(config, this.SERVICES, this);
            // Register User and Get Available Functions
            this.ENDPOINTS[endpoint.id] = endpoint;
            endpoint.check().then(res => {
                if (res) {
                    if (onconnect)
                        onconnect(endpoint);
                    this.login(endpoint); // Login user to connect to new remote
                }
            });
            return endpoint;
        };
        this.disconnect = (id) => __awaiter(this, void 0, void 0, function* () {
            this.logout(this.ENDPOINTS[id]);
            delete this.ENDPOINTS[id];
        });
        this._loadBackend = (service, name = service.name) => {
            var _a;
            this.SERVICES[name] = service;
            this.SERVICES[name].status = true;
            (_a = service.routes) === null || _a === void 0 ? void 0 : _a.forEach(o => this.addRoute(Object.assign({ service: name }, o)));
            if (service.subscribe) {
                service.subscribe((o, type, origin) => __awaiter(this, void 0, void 0, function* () {
                    let res = yield this.handleMessage(o, type);
                    if (origin === null || origin === void 0 ? void 0 : origin.includes('worker')) {
                        if (res !== null && service[origin])
                            service[origin].postMessage({ route: 'worker/workerPost', message: res, origin: service.id, callbackId: o.callbackId });
                        else
                            return res;
                    }
                    return res;
                }));
            }
            if ((service === null || service === void 0 ? void 0 : service.serviceType) === 'subscription')
                this.SUBSCRIPTIONS.push(service.updateSubscribers);
        };
        this._loadService = (service, name = service === null || service === void 0 ? void 0 : service.name) => __awaiter(this, void 0, void 0, function* () {
            this._loadBackend(service, name); // Load a backend Service
            return yield this._loadClient(service, name, true); // Load a client Service but skip waiting to resolve the remote name
        });
        this._loadClient = (service, _, onlySubscribe = false) => {
            return new Promise(resolve => {
                // let worker = false;
                // if(name.includes('worker')) worker = true;
                const name = service.name;
                // NOTE: This is where you listen for service.notify()
                if (service.subscribe) {
                    service.subscribe((o, type) => __awaiter(this, void 0, void 0, function* () {
                        var _a;
                        // Check if Service is Available
                        const client = this.SERVICES[name];
                        const available = client.status === true;
                        let res;
                        if (type === 'local') {
                            res = yield this.handleLocalRoute(o);
                        }
                        else if (available) {
                            res = yield this.send({
                                route: `${client.route}/${o.route}`,
                                endpoint: service === null || service === void 0 ? void 0 : service.endpoint // If remote is bound to client
                            }, ...(_a = o.message) !== null && _a !== void 0 ? _a : []); // send automatically with extension
                        }
                        return res;
                    }));
                }
                if (onlySubscribe)
                    resolve(service);
                else {
                    // Load Client Handler
                    this.SERVICES[name] = service;
                    const toResolve = (route) => {
                        this.SERVICES[name].status = true;
                        if (service.setEndpointRoute instanceof Function)
                            service.setEndpointRoute(route);
                        // Expect Certain Callbacks from the Service
                        service.routes.forEach(o => {
                            this.ROUTES[`${route}/${o.route}`] = o;
                        });
                        resolve(service);
                    };
                    // Auto-Resolve if Already Available
                    if (this.SERVICES[name].status === true)
                        toResolve(this.SERVICES[name]);
                    else
                        this.SERVICES[name].status = toResolve;
                }
            });
        };
        this.get = (routeSpec, ...args) => {
            return this._send(routeSpec, 'GET', ...args);
        };
        this.delete = (routeSpec, ...args) => {
            return this._send(routeSpec, 'DELETE', ...args);
        };
        this.post = (routeSpec, ...args) => {
            return this._send(routeSpec, 'POST', ...args);
        };
        this.send = this.post;
        this._send = (routeSpec, method, ...args) => __awaiter(this, void 0, void 0, function* () {
            let endpoint;
            if (typeof routeSpec === 'string' || (routeSpec === null || routeSpec === void 0 ? void 0 : routeSpec.endpoint) == null)
                endpoint = Object.values(this.ENDPOINTS)[0];
            else
                endpoint = routeSpec.endpoint;
            if (!endpoint)
                return;
            let response;
            response = yield endpoint.send(routeSpec, {
                message: args,
                method
            });
            if (response)
                this.handleLocalRoute(response, endpoint);
            // Pass Back to the User
            return response === null || response === void 0 ? void 0 : response.message;
        });
        // NOTE: Client can call itself. Server cannot.
        this.handleLocalRoute = (o, endpoint, route) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            // Notify through Subscription (if not suppressed)
            if (endpoint && route && !o.suppress && endpoint.connection)
                (_c = (_b = (_a = endpoint.connection) === null || _a === void 0 ? void 0 : _a.service) === null || _b === void 0 ? void 0 : _b.responses) === null || _c === void 0 ? void 0 : _c.forEach(f => f(Object.assign({ route }, o))); // Include send route if none returned
            // Activate Internal Routes if Relevant (currently blocking certain command chains)
            if (!o.block) {
                let route = this.ROUTES[o === null || o === void 0 ? void 0 : o.route];
                if ((route === null || route === void 0 ? void 0 : route.post) instanceof Function)
                    return route.post(this, o.message, o.id); // TODO: Enable non-post
            }
        });
        this.subscribe = (callback, options = {}) => __awaiter(this, void 0, void 0, function* () {
            if (Object.keys(this.ENDPOINTS).length > 0 || (options === null || options === void 0 ? void 0 : options.endpoint)) {
                if (!options.endpoint)
                    options.endpoint = Object.values(this.ENDPOINTS)[0];
                const res = yield options.endpoint._subscribe(options).then(res => options.endpoint.subscribe(callback));
                return res;
            }
            else
                throw 'Remote is not specified';
        });
        this.handleMessage = (msg, type) => __awaiter(this, void 0, void 0, function* () {
            var _d;
            let o = {};
            if (Array.isArray(msg)) { //handle commands sent as arrays [username,cmd,arg1,arg2]
                o.route = msg[0];
                o.message = msg.slice(1);
                o.callbackId = undefined;
                // o.id = socketId
            }
            else if (typeof msg === 'string') { //handle string commands with spaces, 'username command arg1 arg2'
                let cmd = msg.split(' ');
                o.route = cmd[0];
                o.message = cmd.slice(1);
                o.callbackId = undefined;
                // o.id = socketId
            }
            else if (typeof msg === 'object')
                Object.assign(o, msg);
            // Deal With Object-Formatted Request
            if (typeof o === 'object' && !Array.isArray(o)) { //if we got an object process it as most likely user data
                if (o.route != null) {
                    let u = this.USERS[o === null || o === void 0 ? void 0 : o.id];
                    console.log('runRoute', o.route);
                    // TODO: Allow Server to Target Remote too
                    // let res
                    // if (type === 'local'){
                    //   res = await this.runRoute(o.route, o.method, o.message, u?.id ?? o.id, o.callbackId);
                    //   if (o.suppress) res.suppress = o.suppress // only suppress when handling messages here
                    // } else {
                    const res = yield this.runRoute(o.route, o.method, o.message, (_d = u === null || u === void 0 ? void 0 : u.id) !== null && _d !== void 0 ? _d : o.id, o.callbackId);
                    if (res && o.suppress)
                        res.suppress = o.suppress; // only suppress when handling messages here
                    // }
                    return res;
                }
            }
            return null;
        });
        if (options.interval)
            this.INTERVAL = options.interval;
        this.STATE = new StateManager({}, this.INTERVAL, undefined //false
        );
        this.DEBUG = options === null || options === void 0 ? void 0 : options.debug;
        // Browser-Only
        if ('onbeforeunload' in globalThis) {
            globalThis.onbeforeunload = () => {
                Object.values(this.ENDPOINTS).forEach(e => { if (e.type != 'webrtc')
                    this.logout(e); }); // TODO: Make generic. Currently excludes WebRTC
            };
        }
        // Load Default Routes
        this.load({ routes: this.DEFAULTROUTES });
        if (this.DEBUG)
            this.runCallback('routes', [true]);
        if (options === null || options === void 0 ? void 0 : options.endpoints)
            options.endpoints.forEach(e => this.connect(e));
    }
    login(endpoint, user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logout(endpoint);
            const arr = Object.values((endpoint) ? { endpoint } : this.ENDPOINTS);
            let res = yield Promise.all(arr.map((endpoint) => __awaiter(this, void 0, void 0, function* () {
                let res = yield this.send({
                    route: 'login',
                    endpoint
                }, user); //[0];
                console.log(res);
                endpoint.setCredentials(res);
                return res;
            })));
            return res.reduce((a, b) => a * b[0], true) === 1;
        });
    }
    logout(endpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield Promise.all(Object.values((endpoint) ? { endpoint } : this.ENDPOINTS).map((endpoint) => __awaiter(this, void 0, void 0, function* () {
                return yield this.send({
                    route: 'logout',
                    endpoint
                }, endpoint.credentials);
            })));
            return res.reduce((a, b) => a * b[0], true) === 1;
        });
    }
    // -----------------------------------------------
    // 
    // Backend Methods (OG)
    // 
    // -----------------------------------------------
    load(service, name = service.name) {
        return __awaiter(this, void 0, void 0, function* () {
            let isClient = service.constructor.type === 'client';
            let isService = !service.constructor.type || service.constructor.type === 'service'; // Includes objects
            let isBackend = service.constructor.type === 'backend';
            if (isService)
                yield this._loadService(service, name);
            // Add as Backend
            if (isBackend)
                yield this._loadBackend(service, name);
            // Add as Client
            if (isClient)
                yield this._loadClient(service);
            return service;
        });
    }
    format(o, info = {}) {
        if (o !== undefined) { // Can pass false and null
            if (!o || !(typeof o === 'object') || (!('message' in o) && !('route' in o)))
                o = { message: o };
            if (!Array.isArray(o.message))
                o.message = [o.message];
            if (info.service && (o === null || o === void 0 ? void 0 : o.route))
                o.route = `${info.service}/${o.route}`; // Correct Route
            // if (routeInfo.get) state.setState(route, res.message)
            if (info.headers)
                o.headers = info.headers; // e.g. text/html for SSR
        }
        // Remove Wildcards
        if (o === null || o === void 0 ? void 0 : o.route)
            o.route = o.route.replace(/\/\*\*?/, '');
        return o;
    }
    runRoute(route, method, args = [], origin, callbackId) {
        return __awaiter(this, void 0, void 0, function* () {
            try { //we should only use try-catch where necessary (e.g. auto try-catch wrapping unsafe functions) to maximize scalability
                if (route == null)
                    return; // NOTE: Now allowing users not on the server to submit requests
                if (!method && Array.isArray(args))
                    method = (args.length > 0) ? 'POST' : 'GET';
                if (this.DEBUG)
                    console.log('route', route);
                return yield this.runCallback(route, args, origin, method).then((dict) => {
                    if (this.DEBUG)
                        console.log(`Result:`, dict);
                    // Convert Output to Message Object
                    if (dict === undefined)
                        return;
                    else {
                        dict = this.format(dict);
                        // if (!dict.route) dict.route = route // Only send back a route when you want to trigger inside the Router
                        dict.callbackId = callbackId;
                        if (this.ROUTES[dict.route])
                            dict.block = true; // Block infinite command chains... 
                        // Pass Out
                        if (dict.message === DONOTSEND)
                            return;
                        return dict;
                    }
                }).catch(console.error);
            }
            catch (e) {
                return new Error(`Route failed...`);
            }
        });
    }
    // Track Users Connected to the LiveServer
    addUser(userinfo) {
        if (userinfo && (userinfo.id || userinfo._id)) {
            // Grab Proper Id
            if (!userinfo._id)
                userinfo._id = pseudoObjectId();
            if (!userinfo.id)
                userinfo.id = userinfo._id;
            // Get Current User if Exists
            const u = this.USERS[userinfo._id];
            // Grab Base
            let newuser = u !== null && u !== void 0 ? u : {
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
            Object.assign(newuser, userinfo); //assign any supplied info to the base
            if (this.DEBUG)
                console.log('Adding User, Id:', userinfo._id);
            this.USERS[userinfo.id] = newuser;
            //add any additional properties sent. remote.service has more functions for using these
            for (let key in this.SERVICES) {
                const s = this.SERVICES[key];
                if (s.status === true) {
                    const route = s.name + '/users'; // Default Route
                    const possibilities = getRouteMatches(route);
                    possibilities.forEach(r => {
                        if (this.ROUTES[r]) {
                            this.runRoute(r, 'POST', [newuser], userinfo._id);
                        }
                    });
                }
            }
            return newuser; //returns the generated id so you can look up
        }
        else
            return false;
    }
    removeUser(user) {
        let u = (typeof user === 'string') ? this.USERS[user] : user;
        if (u) {
            Object.values(this.SERVICES).forEach(s => {
                if (s.status === true) {
                    const route = s.name + '/users';
                    if (this.ROUTES[route])
                        this.runRoute(route, 'DELETE', [u], u.id);
                }
            });
            delete u.id;
            return true;
        }
        return false;
    }
    //adds an id to a blocklist for access control
    blockUser(user, userId = '') {
        if (this.USERS[userId]) {
            if (!user.blocked.includes(userId) && user.id !== userId) { //can't block Router 
                user.blocked.push(userId);
                return true;
            }
        }
        return false;
    }
    //pass user Id or object
    sendMsg(user = '', message = '', data = undefined) {
        let toSend = (data) ? Object.assign(data, { message }) : { message };
        if (typeof user === 'string') {
            let u = this.USERS[user];
            if (u) {
                u.send(toSend);
            }
        }
        else if (typeof user === 'object') {
            user.send(toSend);
            return true;
        }
        return false;
    }
    addRoute(o) {
        o = Object.assign({}, o);
        const cases = [o.route, ...(o.aliases) ? o.aliases : []];
        delete o.aliases;
        cases.forEach(route => {
            var _a, _b;
            if (!route || (!o.post && !o.get))
                return false;
            route = o.route = `${(o.service) ? `${o.service}/` : ''}` + route;
            this.removeRoute(route); //removes existing callback if it is there
            if (route[0] === '/')
                route = route.slice(1);
            o.args = getParamNames(o.post);
            this.ROUTES[route] = Object.assign(o, { route });
            if (o.get) {
                // Subscribe to Base Route // TODO: Doube-check that subscriptions are working
                this.STATE.setState({ [route]: (_b = (_a = o.get) === null || _a === void 0 ? void 0 : _a.object) !== null && _b !== void 0 ? _b : o.get });
                this.STATE.subscribe(route, (data) => {
                    var _a;
                    const message = ((_a = o.get) === null || _a === void 0 ? void 0 : _a.transform) ? o.get.transform(data, ...[]) : data;
                    this.SUBSCRIPTIONS.forEach(o => {
                        return o(this, {
                            route,
                            message
                        });
                    });
                });
            }
        });
        return true;
    }
    removeRoute(functionName) {
        return delete this.ROUTES[functionName];
    }
    runCallback(route, input = [], origin, method = (input.length > 0) ? 'POST' : 'GET') {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            // Get Wildcard Possibilities
            let possibilities = getRouteMatches(route);
            let errorRes = { route, block: true, message: { html: errorPage }, headers: { 'Content-Type': 'text/html' } }; // NOTE: Do not include route unless you want it to be parsed as a command
            // Iterate over Possibilities
            Promise.all(possibilities.map((possibleRoute) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                let routeInfo = this.ROUTES[possibleRoute];
                if (routeInfo) {
                    if (this.DEBUG)
                        console.log('routeInfo', routeInfo);
                    try {
                        let res;
                        // Delete Handler
                        if ((routeInfo === null || routeInfo === void 0 ? void 0 : routeInfo.delete) && method.toUpperCase() === 'DELETE') {
                            res = yield routeInfo.delete(this, input, origin);
                        }
                        // Get Handler
                        else if (method.toUpperCase() === 'GET' || !(routeInfo === null || routeInfo === void 0 ? void 0 : routeInfo.post)) {
                            const value = this.STATE.data[routeInfo.route]; // Get State by route
                            if (value) {
                                // Get argsuments after main route
                                const args = route.replace(routeInfo.route.split('/').filter(a => a != '*' && a != '**').join('/'), '').split('/').filter(str => !!str);
                                res = { message: ((_a = routeInfo.get) === null || _a === void 0 ? void 0 : _a.transform) ? yield routeInfo.get.transform(value, ...args) : value };
                            }
                            else
                                res = errorRes;
                        }
                        // Post Handler
                        else if (routeInfo === null || routeInfo === void 0 ? void 0 : routeInfo.post) {
                            res = yield (routeInfo === null || routeInfo === void 0 ? void 0 : routeInfo.post(this, input, origin));
                        }
                        // Error Handler
                        else
                            res = errorRes;
                        resolve(this.format(res, routeInfo));
                    }
                    catch (e) {
                        console.log('Callback Failed: ', e);
                    }
                }
            }))).then(_ => resolve(errorRes));
        }));
    }
    checkRoutes(event) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!event.data)
                return;
            let route = (_b = (_a = this.ROUTES[event.data.foo]) !== null && _a !== void 0 ? _a : this.ROUTES[event.data.route]) !== null && _b !== void 0 ? _b : this.ROUTES[event.data.functionName];
            if (!route)
                route = this.ROUTES[event.data.foo];
            if (route) {
                if (event.data.message)
                    return yield route.post(this, event.data.message, event.data.origin);
                else
                    return;
            }
            else
                return false;
        });
    }
}
export default Router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vUm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLFlBQVksTUFBTSxxQkFBcUIsQ0FBQTtBQUM5QyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0seUJBQXlCLENBQUE7QUFDekQsT0FBTyxFQUFFLFFBQVEsRUFBRSxjQUFjLEdBQUksTUFBTSxvQkFBb0IsQ0FBQTtBQUcvRCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFFdEQsT0FBTyxTQUFTLE1BQU0sc0JBQXNCLENBQUE7QUFDNUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUV0QyxNQUFNLENBQUMsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDO0FBQ3JDLDBCQUEwQjtBQUUxQixhQUFhO0FBQ2Isd0VBQXdFO0FBQ3hFLDRFQUE0RTtBQUM1RSxFQUFFO0FBQ0YscURBQXFEO0FBQ3JELE1BQU07QUFDTiwwREFBMEQ7QUFDMUQsRUFBRTtBQUNGLGNBQWM7QUFDZCx3RUFBd0U7QUFDeEUsRUFBRTtBQUNGLGdCQUFnQjtBQUNoQix3REFBd0Q7QUFDeEQsRUFBRTtBQUdGLE1BQU0sT0FBTyxNQUFNO0lBNk5qQixtRUFBbUU7SUFFakUsWUFBWSxVQUF5QixFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUM7UUE5TnJELE9BQUUsR0FBVyxRQUFRLEVBQUUsQ0FBQTtRQUV2QixVQUFVO1FBQ1YsVUFBSyxHQUE2QixFQUFFLENBQUEsQ0FBQyxvREFBb0Q7UUFDekYsZ0JBQVcsR0FBbUIsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDLDBCQUEwQjtRQUNuRSxrQkFBYSxHQUFlLEVBQUUsQ0FBQSxDQUFDLHVDQUF1QztRQUV0RSxjQUFTLEdBQTBCLEVBQUUsQ0FBQTtRQUVyQyxhQUFRLEdBQXVCLEVBQUUsQ0FBQTtRQUVqQyxXQUFNLEdBQWdDLEVBQUUsQ0FBQSxDQUFDLHlCQUF5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