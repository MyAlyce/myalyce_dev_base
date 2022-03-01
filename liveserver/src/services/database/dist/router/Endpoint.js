import { __awaiter } from "tslib";
import { safeStringify } from '../common/parse.utils';
import { createRoute } from '../common/general.utils';
// import { Service } from './Service';
import { randomId, pseudoObjectId } from '../common/id.utils';
// Load Node Polyfills
try {
    if (typeof process === 'object') { //indicates node
        // NODE = true
        const fetch = require('node-fetch');
        if (typeof globalThis.fetch !== 'function') {
            globalThis.fetch = fetch;
        }
    }
}
catch (err) { }
export class Endpoint {
    // Interface for Sending / Receiving Information
    constructor(config = 'https://localhost', clients, router) {
        this.id = null;
        this.target = null;
        this.type = null;
        this.link = null;
        this.credentials = {};
        this.connection = null;
        this.services = {
            available: {},
            connecting: {},
            queue: {}
        };
        this.router = null;
        this.clients = {}; // really resolve Functions OR Service instances
        this.user = pseudoObjectId(); // Random User Identifier
        this.status = false;
        this.responses = {};
        this.setCredentials = (o) => {
            var _a;
            // Fill in the details if enough is provided
            if (!o)
                o = { _id: pseudoObjectId() };
            this.credentials = {
                _id: (_a = o._id) !== null && _a !== void 0 ? _a : pseudoObjectId(),
                id: o.id || o._id
            };
        };
        this.check = () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            if (this.type === 'webrtc') {
                // if (!this.link || this.link === this){
                //     console.log('no link', this.link)
                // }
                yield this._subscribe({ protocol: 'webrtc', force: true }).then(res => {
                    this.status = true;
                }).catch(e => console.log(`Link doesn't have WebRTC enabled.`, e));
            }
            const connectWS = () => __awaiter(this, void 0, void 0, function* () {
                yield this._subscribe({ protocol: 'websocket', force: true }).then(res => {
                    this.status = true;
                    return res;
                });
                return yield this.send('services');
            });
            const connectHTTP = () => __awaiter(this, void 0, void 0, function* () { return yield this.send('services'); });
            let res;
            if (this.type === 'websocket') {
                let res = yield connectWS().then(res => {
                    this.status = true;
                    return res;
                }).catch((e) => __awaiter(this, void 0, void 0, function* () {
                    if (this.type === 'websocket') {
                        console.log('Falling back to http');
                        return yield connectHTTP();
                    }
                }));
            }
            else {
                res = yield connectHTTP().then(res => {
                    this.status = true;
                    return res;
                }).catch((e) => __awaiter(this, void 0, void 0, function* () {
                    console.log('Falling back to websockets');
                    return yield connectWS();
                }));
            }
            if (res) {
                console.log('Connection successful!');
                const routes = res.message[0];
                let serviceNames = [];
                for (let route in routes) {
                    const className = routes[route];
                    const name = className.replace(/Backend|Service/, '').toLowerCase();
                    this.services.available[name] = route;
                    serviceNames.push(name);
                    // Resolve Router Loading Promises
                    if (((_c = (_b = (_a = this.router) === null || _a === void 0 ? void 0 : _a.SERVICES) === null || _b === void 0 ? void 0 : _b[name]) === null || _c === void 0 ? void 0 : _c.status) instanceof Function)
                        this.router.SERVICES[name].status(route);
                    if (((_d = this.clients[name]) === null || _d === void 0 ? void 0 : _d.serviceType) === 'subscription') {
                        (_e = this.services.queue[name]) === null || _e === void 0 ? void 0 : _e.forEach(f => f());
                        this.services.queue[name] = [];
                    }
                }
                // General Subscription Check
                (_f = this.services.queue['undefined']) === null || _f === void 0 ? void 0 : _f.forEach(f => f());
                this.services.queue['undefined'] = [];
            }
            else
                console.log('Connection failed!');
            return res === null || res === void 0 ? void 0 : res.message;
        });
        // Send Message to Endpoint (mirror linked Endpoint if necessary)
        this.send = (route, o = {}, progressCallback = () => { }) => __awaiter(this, void 0, void 0, function* () {
            var _g, _h, _j, _k, _l, _m, _o, _p;
            // Support String -> Object Specification
            if (typeof route === 'string')
                o.route = route;
            else {
                // Support Dynamic Service URLs
                const dynamicServiceName = this.services[route.service];
                o.route = (dynamicServiceName) ? `${dynamicServiceName}/${route.route}` : route.route;
            }
            o.suppress = !!this.connection;
            // Get Response
            let response;
            // create separate options object
            const opts = {
                suppress: o.suppress,
                id: (_g = this.link.connection) === null || _g === void 0 ? void 0 : _g.id
            };
            // WS
            if (((_h = this.connection) === null || _h === void 0 ? void 0 : _h.protocol) === 'websocket') {
                o.id = (_j = this.link.credentials) === null || _j === void 0 ? void 0 : _j.id; // Link ID
                response = yield this.link.connection.service.send(o, opts);
            }
            // WebRTC (direct = no link)
            else if (((_k = this === null || this === void 0 ? void 0 : this.connection) === null || _k === void 0 ? void 0 : _k.protocol) === 'webrtc') {
                o.id = ((_l = this.credentials) === null || _l === void 0 ? void 0 : _l.id) || ((_m = this.link.credentials) === null || _m === void 0 ? void 0 : _m.id); // This ID / Link ID
                response = yield this.connection.service.send(o, opts);
            }
            // HTTP
            else {
                o.id = (_o = this.link.credentials) === null || _o === void 0 ? void 0 : _o.id; // Link ID
                if (!o.method)
                    o.method = (((_p = o.message) === null || _p === void 0 ? void 0 : _p.length) > 0) ? 'POST' : 'GET';
                const toSend = {
                    method: o.method.toUpperCase(),
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                };
                if (toSend.method != 'GET')
                    toSend.body = safeStringify(o);
                response = yield fetch(createRoute(o.route, this.link.target), toSend).then((response) => __awaiter(this, void 0, void 0, function* () {
                    // Use the Streams API
                    const reader = response.body.getReader();
                    const length = response.headers.get("Content-Length");
                    let received = 0;
                    // On Stream Chunk
                    if (globalThis.ReadableStream) {
                        const stream = new ReadableStream({
                            start(controller) {
                                const push = () => __awaiter(this, void 0, void 0, function* () {
                                    reader.read().then(({ value, done }) => {
                                        // Each chunk has a `done` property. If it's done,
                                        if (done) {
                                            controller.close();
                                            return;
                                        }
                                        // If it's not done, increment the received variable, and the bar's fill.
                                        received += value.length;
                                        progressCallback(received / length, length);
                                        // Keep reading, and keep doing this AS LONG AS IT'S NOT DONE.
                                        controller.enqueue(value);
                                        push();
                                    });
                                });
                                push();
                            }
                        });
                        // Read the Response
                        return new Response(stream, { headers: response.headers });
                    }
                    else
                        return response;
                }));
                response = (response) ? yield response.json().then(json => {
                    if (!response.ok)
                        throw json.message;
                    else
                        return json;
                }).catch((err) => __awaiter(this, void 0, void 0, function* () {
                    throw 'Invalid JSON';
                })) : response;
            }
            if (response && !(response === null || response === void 0 ? void 0 : response.route)) {
                response.route = o.route; // Add send route if none provided
                response.block = true; // Block router activation if added
            }
            return response;
        });
        this._subscribe = (opts = {}) => __awaiter(this, void 0, void 0, function* () {
            let toResolve = () => {
                return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    let clientName = (_a = opts.protocol) !== null && _a !== void 0 ? _a : this.type;
                    let servicesToCheck = (clientName) ? [this.clients[clientName]] : Object.values(this.clients);
                    servicesToCheck.forEach((client) => __awaiter(this, void 0, void 0, function* () {
                        var _b;
                        if ((client && opts.force) || // Required for Websocket Fallback
                            ((client === null || client === void 0 ? void 0 : client.status) === true && ((client === null || client === void 0 ? void 0 : client.serviceType) === 'subscription'))) {
                            let subscriptionEndpoint = `${(_b = this.link.services.available[client === null || client === void 0 ? void 0 : client.service]) !== null && _b !== void 0 ? _b : client.name.toLowerCase()}/subscribe`;
                            client.setEndpoint(this.link); // Bind Endpoint to Subscription Client
                            // Note: Only One Subscription per Endpoint
                            if (!this.connection) {
                                const target = (this.type === 'http' || this.type === 'websocket') ? new URL(subscriptionEndpoint, this.target) : this.target;
                                const id = yield client.add(this.credentials, target.href); // Pass full target string
                                // Always Have the Router Listen
                                if (this.router) {
                                    client.addResponse('router', (o) => {
                                        const data = (typeof o === 'string') ? JSON.parse(o) : o;
                                        // Activate Subscriptions
                                        Object.values(this.responses).forEach(f => {
                                            f(data);
                                        });
                                        if (this.router)
                                            this.router.handleLocalRoute(data);
                                    });
                                }
                                this.connection = {
                                    service: client,
                                    id,
                                    protocol: client.name,
                                };
                            }
                            // Filter Options to get Message Object
                            if (this.type === 'webrtc') {
                                opts.routes = [this.target]; // Connect to Target Room / User only
                            }
                            const res = yield this.link.send(subscriptionEndpoint, Object.assign({
                                route: opts.route,
                                message: opts.message,
                                protocol: opts.protocol,
                            }, {
                                message: [opts.routes, this.connection.id] // Routes to Subscribe + Reference ID
                            }));
                            resolve(this.connection);
                            return;
                        }
                    }));
                    if (!this.services.queue[clientName])
                        this.services.queue[clientName] = [];
                    this.services.queue[clientName].push(() => __awaiter(this, void 0, void 0, function* () {
                        let res = yield toResolve();
                        resolve(res);
                    }));
                }));
            };
            return yield toResolve();
        });
        this.subscribe = (callback) => {
            if (callback) {
                let id = randomId('response');
                this.responses[id] = callback;
                return id;
            }
        };
        this.unsubscribe = (id) => {
            if (id)
                delete this.responses[id];
            else
                this.responses = {};
        };
        // Set Endpoint Details
        let target, type;
        if (typeof config === 'object') {
            if (config instanceof URL)
                target = config;
            else {
                target = config.target;
                type = config.type;
                this.link = config.link;
                this.setCredentials(config.credentials);
                // Use Link to Communicate with an Additional Endpoint Dependency
                // if (this.link) {
                //     this.link?.connection?.service?.addResponse(this.id,(res) => {
                //         console.log('Listen to the Link',res)
                //     })
                // }
            }
        }
        else
            target = config;
        if (!type)
            type = 'http';
        if (!this.link)
            this.link = this;
        if (type === 'http' || type === 'websocket') {
            target = (target instanceof URL) ? target : new URL(target); // Convert to URL
            this.id = target.origin;
        }
        else {
            this.id = target;
        }
        this.target = target;
        this.type = type;
        this.router = router;
        if (clients)
            this.clients = clients;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW5kcG9pbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9yb3V0ZXIvRW5kcG9pbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFFdEQsdUNBQXVDO0FBQ3ZDLE9BQU8sRUFBRSxRQUFRLEVBQUcsY0FBYyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFHOUQsc0JBQXNCO0FBQ3RCLElBQUk7SUFDQSxJQUFHLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxFQUFFLGdCQUFnQjtRQUM5QyxjQUFjO1FBQ2QsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBQ25DLElBQUksT0FBTyxVQUFVLENBQUMsS0FBSyxLQUFLLFVBQVUsRUFBRTtZQUMxQyxVQUFVLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtTQUN6QjtLQUNKO0NBQ0o7QUFBQyxPQUFPLEdBQUcsRUFBRSxHQUFFO0FBRWhCLE1BQU0sT0FBTyxRQUFRO0lBbUNqQixnREFBZ0Q7SUFDaEQsWUFBWSxTQUF5QixtQkFBbUIsRUFBRSxPQUFRLEVBQUUsTUFBYztRQWxDbEYsT0FBRSxHQUFXLElBQUksQ0FBQTtRQUNqQixXQUFNLEdBQVEsSUFBSSxDQUFBO1FBQ2xCLFNBQUksR0FBaUIsSUFBSSxDQUFBO1FBQ3pCLFNBQUksR0FBYSxJQUFJLENBQUE7UUFFckIsZ0JBQVcsR0FBd0IsRUFBRSxDQUFBO1FBRXJDLGVBQVUsR0FJTixJQUFJLENBQUE7UUFFUixhQUFRLEdBT0o7WUFDQSxTQUFTLEVBQUUsRUFBRTtZQUNiLFVBQVUsRUFBRSxFQUFFO1lBQ2QsS0FBSyxFQUFFLEVBQUU7U0FDWixDQUFBO1FBRUQsV0FBTSxHQUFXLElBQUksQ0FBQTtRQUNyQixZQUFPLEdBQXNCLEVBQUUsQ0FBQSxDQUFD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