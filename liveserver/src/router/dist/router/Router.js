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
                }, user);
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