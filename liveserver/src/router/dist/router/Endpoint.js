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
            if (o && (o._id || o.id))
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW5kcG9pbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9FbmRwb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUEsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUV0RCx1Q0FBdUM7QUFDdkMsT0FBTyxFQUFFLFFBQVEsRUFBRyxjQUFjLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUc5RCxzQkFBc0I7QUFDdEIsSUFBSTtJQUNBLElBQUcsT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLEVBQUUsZ0JBQWdCO1FBQzlDLGNBQWM7UUFDZCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDbkMsSUFBSSxPQUFPLFVBQVUsQ0FBQyxLQUFLLEtBQUssVUFBVSxFQUFFO1lBQzFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO1NBQ3pCO0tBQ0o7Q0FDSjtBQUFDLE9BQU8sR0FBRyxFQUFFLEdBQUU7QUFFaEIsTUFBTSxPQUFPLFFBQVE7SUFtQ2pCLGdEQUFnRDtJQUNoRCxZQUFZLFNBQXlCLG1CQUFtQixFQUFFLE9BQVEsRUFBRSxNQUFjO1FBbENsRixPQUFFLEdBQVcsSUFBSSxDQUFBO1FBQ2pCLFdBQU0sR0FBUSxJQUFJLENBQUE7UUFDbEIsU0FBSSxHQUFpQixJQUFJLENBQUE7UUFDekIsU0FBSSxHQUFhLElBQUksQ0FBQTtRQUVyQixnQkFBVyxHQUF3QixFQUFFLENBQUE7UUFFckMsZUFBVSxHQUlOLElBQUksQ0FBQTtRQUVSLGFBQVEsR0FPSjtZQUNBLFNBQVMsRUFBRSxFQUFFO1lBQ2IsVUFBVSxFQUFFLEVBQUU7WUFDZCxLQUFLLEVBQUUsRUFBRTtTQUNaLENBQUE7UUFFRCxXQUFNLEdBQVcsSUFBSSxDQUFBO1FBQ3JCLFlBQU8sR0FBc0IsRUFBRSxDQUFBLENBQUMsZ0RBQWdEO1FBQ2hG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