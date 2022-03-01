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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW5kcG9pbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9FbmRwb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUEsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUV0RCx1Q0FBdUM7QUFDdkMsT0FBTyxFQUFFLFFBQVEsRUFBRyxjQUFjLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUc5RCxzQkFBc0I7QUFDdEIsSUFBSTtJQUNBLElBQUcsT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLEVBQUUsZ0JBQWdCO1FBQzlDLGNBQWM7UUFDZCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDbkMsSUFBSSxPQUFPLFVBQVUsQ0FBQyxLQUFLLEtBQUssVUFBVSxFQUFFO1lBQzFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO1NBQ3pCO0tBQ0o7Q0FDSjtBQUFDLE9BQU8sR0FBRyxFQUFFLEdBQUU7QUFFaEIsTUFBTSxPQUFPLFFBQVE7SUFtQ2pCLGdEQUFnRDtJQUNoRCxZQUFZLFNBQXlCLG1CQUFtQixFQUFFLE9BQVEsRUFBRSxNQUFjO1FBbENsRixPQUFFLEdBQVcsSUFBSSxDQUFBO1FBQ2pCLFdBQU0sR0FBUSxJQUFJLENBQUE7UUFDbEIsU0FBSSxHQUFpQixJQUFJLENBQUE7UUFDekIsU0FBSSxHQUFhLElBQUksQ0FBQTtRQUVyQixnQkFBVyxHQUF3QixFQUFFLENBQUE7UUFFckMsZUFBVSxHQUlOLElBQUksQ0FBQTtRQUVSLGFBQVEsR0FPSjtZQUNBLFNBQVMsRUFBRSxFQUFFO1lBQ2IsVUFBVSxFQUFFLEVBQUU7WUFDZCxLQUFLLEVBQUUsRUFBRTtTQUNaLENBQUE7UUFFRCxXQUFNLEdBQVcsSUFBSSxDQUFBO1FBQ3JCLFlBQU8sR0FBc0IsRUFBRSxDQUFBLENBQUMsZ0RBQWdEO1FBQ2hG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