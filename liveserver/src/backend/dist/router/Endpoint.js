import { __awaiter, __generator } from "tslib";
import { safeStringify } from '../common/parse.utils';
import { createRoute } from '../common/general.utils';
// import { Service } from './Service';
import { randomId, pseudoObjectId } from '../common/id.utils';
// Load Node Polyfills
try {
    if (typeof process === 'object') { //indicates node
        // NODE = true
        var fetch_1 = require('node-fetch');
        if (typeof globalThis.fetch !== 'function') {
            globalThis.fetch = fetch_1;
        }
    }
}
catch (err) { }
var Endpoint = /** @class */ (function () {
    // Interface for Sending / Receiving Information
    function Endpoint(config, clients, router) {
        var _this = this;
        if (config === void 0) { config = 'https://localhost'; }
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
        this.setCredentials = function (o) {
            var _a;
            // Fill in the details if enough is provided
            if (o && (o._id || o.id))
                _this.credentials = {
                    _id: (_a = o._id) !== null && _a !== void 0 ? _a : pseudoObjectId(),
                    id: o.id || o._id
                };
        };
        this.check = function () { return __awaiter(_this, void 0, void 0, function () {
            var connectWS, connectHTTP, res, res_1, routes, serviceNames, route, className, name_1;
            var _this = this;
            var _a, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        if (!(this.type === 'webrtc')) return [3 /*break*/, 2];
                        // if (!this.link || this.link === this){
                        //     console.log('no link', this.link)
                        // }
                        return [4 /*yield*/, this._subscribe({ protocol: 'webrtc', force: true }).then(function (res) {
                                _this.status = true;
                            }).catch(function (e) { return console.log("Link doesn't have WebRTC enabled.", e); })];
                    case 1:
                        // if (!this.link || this.link === this){
                        //     console.log('no link', this.link)
                        // }
                        _g.sent();
                        _g.label = 2;
                    case 2:
                        connectWS = function () { return __awaiter(_this, void 0, void 0, function () {
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this._subscribe({ protocol: 'websocket', force: true }).then(function (res) {
                                            _this.status = true;
                                            return res;
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, this.send('services')];
                                    case 2: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); };
                        connectHTTP = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.send('services')];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        }); }); };
                        if (!(this.type === 'websocket')) return [3 /*break*/, 4];
                        return [4 /*yield*/, connectWS().then(function (res) {
                                _this.status = true;
                                return res;
                            }).catch(function (e) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!(this.type === 'websocket')) return [3 /*break*/, 2];
                                            console.log('Falling back to http');
                                            return [4 /*yield*/, connectHTTP()];
                                        case 1: return [2 /*return*/, _a.sent()];
                                        case 2: return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 3:
                        res_1 = _g.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, connectHTTP().then(function (res) {
                            _this.status = true;
                            return res;
                        }).catch(function (e) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        console.log('Falling back to websockets');
                                        return [4 /*yield*/, connectWS()];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                    case 5:
                        res = _g.sent();
                        _g.label = 6;
                    case 6:
                        if (res) {
                            console.log('Connection successful!');
                            routes = res.message[0];
                            serviceNames = [];
                            for (route in routes) {
                                className = routes[route];
                                name_1 = className.replace(/Backend|Service/, '').toLowerCase();
                                this.services.available[name_1] = route;
                                serviceNames.push(name_1);
                                // Resolve Router Loading Promises
                                if (((_c = (_b = (_a = this.router) === null || _a === void 0 ? void 0 : _a.SERVICES) === null || _b === void 0 ? void 0 : _b[name_1]) === null || _c === void 0 ? void 0 : _c.status) instanceof Function)
                                    this.router.SERVICES[name_1].status(route);
                                if (((_d = this.clients[name_1]) === null || _d === void 0 ? void 0 : _d.serviceType) === 'subscription') {
                                    (_e = this.services.queue[name_1]) === null || _e === void 0 ? void 0 : _e.forEach(function (f) { return f(); });
                                    this.services.queue[name_1] = [];
                                }
                            }
                            // General Subscription Check
                            (_f = this.services.queue['undefined']) === null || _f === void 0 ? void 0 : _f.forEach(function (f) { return f(); });
                            this.services.queue['undefined'] = [];
                        }
                        else
                            console.log('Connection failed!');
                        return [2 /*return*/, res === null || res === void 0 ? void 0 : res.message];
                }
            });
        }); };
        // Send Message to Endpoint (mirror linked Endpoint if necessary)
        this.send = function (route, o, progressCallback) {
            if (o === void 0) { o = {}; }
            if (progressCallback === void 0) { progressCallback = function () { }; }
            return __awaiter(_this, void 0, void 0, function () {
                var dynamicServiceName, response, opts, toSend, _a;
                var _this = this;
                var _b, _c, _d, _e, _f, _g, _h, _j;
                return __generator(this, function (_k) {
                    switch (_k.label) {
                        case 0:
                            // Support String -> Object Specification
                            if (typeof route === 'string')
                                o.route = route;
                            else {
                                dynamicServiceName = this.services[route.service];
                                o.route = (dynamicServiceName) ? "".concat(dynamicServiceName, "/").concat(route.route) : route.route;
                            }
                            o.suppress = !!this.connection;
                            opts = {
                                suppress: o.suppress,
                                id: (_b = this.link.connection) === null || _b === void 0 ? void 0 : _b.id
                            };
                            if (!(((_c = this.connection) === null || _c === void 0 ? void 0 : _c.protocol) === 'websocket')) return [3 /*break*/, 2];
                            o.id = (_d = this.link.credentials) === null || _d === void 0 ? void 0 : _d.id; // Link ID
                            return [4 /*yield*/, this.link.connection.service.send(o, opts)];
                        case 1:
                            response = _k.sent();
                            return [3 /*break*/, 9];
                        case 2:
                            if (!(((_e = this === null || this === void 0 ? void 0 : this.connection) === null || _e === void 0 ? void 0 : _e.protocol) === 'webrtc')) return [3 /*break*/, 4];
                            o.id = ((_f = this.credentials) === null || _f === void 0 ? void 0 : _f.id) || ((_g = this.link.credentials) === null || _g === void 0 ? void 0 : _g.id); // This ID / Link ID
                            return [4 /*yield*/, this.connection.service.send(o, opts)];
                        case 3:
                            response = _k.sent();
                            return [3 /*break*/, 9];
                        case 4:
                            o.id = (_h = this.link.credentials) === null || _h === void 0 ? void 0 : _h.id; // Link ID
                            if (!o.method)
                                o.method = (((_j = o.message) === null || _j === void 0 ? void 0 : _j.length) > 0) ? 'POST' : 'GET';
                            toSend = {
                                method: o.method.toUpperCase(),
                                mode: 'cors',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            };
                            if (toSend.method != 'GET')
                                toSend.body = safeStringify(o);
                            return [4 /*yield*/, fetch(createRoute(o.route, this.link.target), toSend).then(function (response) { return __awaiter(_this, void 0, void 0, function () {
                                    var reader, length, received, stream;
                                    return __generator(this, function (_a) {
                                        reader = response.body.getReader();
                                        length = response.headers.get("Content-Length");
                                        received = 0;
                                        // On Stream Chunk
                                        if (globalThis.ReadableStream) {
                                            stream = new ReadableStream({
                                                start: function (controller) {
                                                    var _this = this;
                                                    var push = function () { return __awaiter(_this, void 0, void 0, function () {
                                                        return __generator(this, function (_a) {
                                                            reader.read().then(function (_a) {
                                                                var value = _a.value, done = _a.done;
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
                                                            return [2 /*return*/];
                                                        });
                                                    }); };
                                                    push();
                                                }
                                            });
                                            // Read the Response
                                            return [2 /*return*/, new Response(stream, { headers: response.headers })];
                                        }
                                        else
                                            return [2 /*return*/, response];
                                        return [2 /*return*/];
                                    });
                                }); })];
                        case 5:
                            response = _k.sent();
                            if (!(response)) return [3 /*break*/, 7];
                            return [4 /*yield*/, response.json().then(function (json) {
                                    if (!response.ok)
                                        throw json.message;
                                    else
                                        return json;
                                }).catch(function (err) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        throw 'Invalid JSON';
                                    });
                                }); })];
                        case 6:
                            _a = _k.sent();
                            return [3 /*break*/, 8];
                        case 7:
                            _a = response;
                            _k.label = 8;
                        case 8:
                            response = _a;
                            _k.label = 9;
                        case 9:
                            if (response && !(response === null || response === void 0 ? void 0 : response.route)) {
                                response.route = o.route; // Add send route if none provided
                                response.block = true; // Block router activation if added
                            }
                            return [2 /*return*/, response];
                    }
                });
            });
        };
        this._subscribe = function (opts) {
            if (opts === void 0) { opts = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var toResolve;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            toResolve = function () {
                                return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                                    var clientName, servicesToCheck;
                                    var _this = this;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        clientName = (_a = opts.protocol) !== null && _a !== void 0 ? _a : this.type;
                                        servicesToCheck = (clientName) ? [this.clients[clientName]] : Object.values(this.clients);
                                        servicesToCheck.forEach(function (client) { return __awaiter(_this, void 0, void 0, function () {
                                            var subscriptionEndpoint, target, id, res;
                                            var _this = this;
                                            var _a;
                                            return __generator(this, function (_b) {
                                                switch (_b.label) {
                                                    case 0:
                                                        if (!((client && opts.force) || // Required for Websocket Fallback
                                                            ((client === null || client === void 0 ? void 0 : client.status) === true && ((client === null || client === void 0 ? void 0 : client.serviceType) === 'subscription')))) return [3 /*break*/, 4];
                                                        subscriptionEndpoint = "".concat((_a = this.link.services.available[client === null || client === void 0 ? void 0 : client.service]) !== null && _a !== void 0 ? _a : client.name.toLowerCase(), "/subscribe");
                                                        client.setEndpoint(this.link); // Bind Endpoint to Subscription Client
                                                        if (!!this.connection) return [3 /*break*/, 2];
                                                        target = (this.type === 'http' || this.type === 'websocket') ? new URL(subscriptionEndpoint, this.target) : this.target;
                                                        return [4 /*yield*/, client.add(this.credentials, target.href)
                                                            // Always Have the Router Listen
                                                        ]; // Pass full target string
                                                    case 1:
                                                        id = _b.sent() // Pass full target string
                                                        ;
                                                        // Always Have the Router Listen
                                                        if (this.router) {
                                                            client.addResponse('router', function (o) {
                                                                var data = (typeof o === 'string') ? JSON.parse(o) : o;
                                                                // Activate Subscriptions
                                                                Object.values(_this.responses).forEach(function (f) {
                                                                    f(data);
                                                                });
                                                                if (_this.router)
                                                                    _this.router.handleLocalRoute(data);
                                                            });
                                                        }
                                                        this.connection = {
                                                            service: client,
                                                            id: id,
                                                            protocol: client.name,
                                                        };
                                                        _b.label = 2;
                                                    case 2:
                                                        // Filter Options to get Message Object
                                                        if (this.type === 'webrtc') {
                                                            opts.routes = [this.target]; // Connect to Target Room / User only
                                                        }
                                                        return [4 /*yield*/, this.link.send(subscriptionEndpoint, Object.assign({
                                                                route: opts.route,
                                                                message: opts.message,
                                                                protocol: opts.protocol,
                                                            }, {
                                                                message: [opts.routes, this.connection.id] // Routes to Subscribe + Reference ID
                                                            }))];
                                                    case 3:
                                                        res = _b.sent();
                                                        resolve(this.connection);
                                                        return [2 /*return*/];
                                                    case 4: return [2 /*return*/];
                                                }
                                            });
                                        }); });
                                        if (!this.services.queue[clientName])
                                            this.services.queue[clientName] = [];
                                        this.services.queue[clientName].push(function () { return __awaiter(_this, void 0, void 0, function () {
                                            var res;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, toResolve()];
                                                    case 1:
                                                        res = _a.sent();
                                                        resolve(res);
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); });
                                        return [2 /*return*/];
                                    });
                                }); });
                            };
                            return [4 /*yield*/, toResolve()];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        this.subscribe = function (callback) {
            if (callback) {
                var id = randomId('response');
                _this.responses[id] = callback;
                return id;
            }
        };
        this.unsubscribe = function (id) {
            if (id)
                delete _this.responses[id];
            else
                _this.responses = {};
        };
        // Set Endpoint Details
        var target, type;
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
    return Endpoint;
}());
export { Endpoint };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW5kcG9pbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9yb3V0ZXIvRW5kcG9pbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFFdEQsdUNBQXVDO0FBQ3ZDLE9BQU8sRUFBRSxRQUFRLEVBQUcsY0FBYyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFHOUQsc0JBQXNCO0FBQ3RCLElBQUk7SUFDQSxJQUFHLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxFQUFFLGdCQUFnQjtRQUM5QyxjQUFjO1FBQ2QsSUFBTSxPQUFLLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBQ25DLElBQUksT0FBTyxVQUFVLENBQUMsS0FBSyxLQUFLLFVBQVUsRUFBRTtZQUMxQyxVQUFVLENBQUMsS0FBSyxHQUFHLE9BQUssQ0FBQTtTQUN6QjtLQUNKO0NBQ0o7QUFBQyxPQUFPLEdBQUcsRUFBRSxHQUFFO0FBRWhCO0lBbUNJLGdEQUFnRDtJQUNoRCxrQkFBWSxNQUE0QyxFQUFFLE9BQVEsRUFBRSxNQUFjO1FBQWxGLGlCQXNDQztRQXRDVyx1QkFBQSxFQUFBLDRCQUE0QztRQWxDeEQsT0FBRSxHQUFXLElBQUksQ0FBQTtRQUNqQixXQUFNLEdBQVEsSUFBSSxDQUFBO1FBQ2xCLFNBQUksR0FBaUIsSUFBSSxDQUFBO1FBQ3pCLFNBQUksR0FBYSxJQUFJLENBQUE7UUFFckIsZ0JBQVcsR0FBd0IsRUFBRSxDQUFBO1FBRXJDLGVBQVUsR0FJTixJQUFJLENBQUE7UUFFUixhQUFRLEdBT0o7WUFDQSxTQUFTLEVBQUUsRUFBRTtZQUNiLFVBQVUsRUFBRSxFQUFFO1lBQ2QsS0FBSyxFQUFFLEVBQUU7U0FDWixDQUFBO1FBRUQsV0FBTSxHQUFXLElBQUksQ0FBQTtRQUNyQixZQUFPLEdBQXNCLEVB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