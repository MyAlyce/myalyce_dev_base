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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcm91dGVyL1JvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxZQUFZLE1BQU0scUJBQXFCLENBQUE7QUFDOUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLHlCQUF5QixDQUFBO0FBQ3pELE9BQU8sRUFBRSxRQUFRLEVBQUUsY0FBYyxHQUFJLE1BQU0sb0JBQW9CLENBQUE7QUFHL0QsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBRXRELE9BQU8sU0FBUyxNQUFNLHNCQUFzQixDQUFBO0FBQzVDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFFdEMsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQztBQUNyQywwQkFBMEI7QUFFMUIsYUFBYTtBQUNiLHdFQUF3RTtBQUN4RSw0RUFBNEU7QUFDNUUsRUFBRTtBQUNGLHFEQUFxRDtBQUNyRCxNQUFNO0FBQ04sMERBQTBEO0FBQzFELEVBQUU7QUFDRixjQUFjO0FBQ2Qsd0VBQXdFO0FBQ3hFLEVBQUU7QUFDRixnQkFBZ0I7QUFDaEIsd0RBQXdEO0FBQ3hELEVBQUU7QUFHRixNQUFNLE9BQU8sTUFBTTtJQTZOakIsbUVBQW1FO0lBRWpFLFlBQVksVUFBeUIsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDO1FBOU5yRCxPQUFFLEdBQVcsUUFBUSxFQUFFLENBQUE7UUFFdkIsVUFBVTtRQUNWLFVBQUssR0FBNkIsRUFBRSxDQUFBLENBQUMsb0RBQW9EO1FBQ3pGLGdCQUFXLEdBQW1CLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQywwQkFBMEI7UUFDbkUsa0JBQWEsR0FBZSxFQUFFLENBQUEsQ0FBQyx1Q0FBdUM7UUFFdEUsY0FBUyxHQUEwQixFQUFFLENBQUE7UUFFckMsYUFBUSxHQUF1QixFQUFFLENBQUE7UUFFakMsV0FBTSxHQUFnQyxFQUFFLENB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