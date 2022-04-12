import { __awaiter, __extends, __generator, __read } from "tslib";
// Joshua Brewster, Garrett Flynn, AGPL v3.0
import { WebSocketServer } from 'ws';
import { SubscriptionService } from '../../router/SubscriptionService';
import { pseudoObjectId } from '../../common/id.utils';
// Create WS Server Instance
var WebsocketService = /** @class */ (function (_super) {
    __extends(WebsocketService, _super);
    function WebsocketService(router, httpServer) {
        var _this = _super.call(this, router) || this;
        _this.name = 'websocket';
        _this.wss = new WebSocketServer({ clientTracking: false, noServer: true });
        _this.process = function (ws, o) { return __awaiter(_this, void 0, void 0, function () {
            var query, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.defaultCallback(ws, o);
                        query = "".concat(this.name, "/subscribe");
                        if (!(o.route.slice(0, query.length) === query)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.addSubscription(o, ws)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.notify(o)];
                    case 3:
                        res = _a.sent();
                        if (typeof res === 'object')
                            res.callbackId = o.callbackId;
                        if (res instanceof Error)
                            ws.send(JSON.stringify(res, Object.getOwnPropertyNames(res)));
                        else if (res != null)
                            ws.send(JSON.stringify(res)); // send back  
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        _this.defaultCallback = function (ws, o) { return __awaiter(_this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "".concat(this.name, "/subscribe");
                        if (!(o.route.slice(0, query.length) === query)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.addSubscription(o, ws)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [2 /*return*/];
                }
            });
        }); };
        // Subscribe to Any Arbitrary Route Event
        _this.addSubscription = function (info, ws) { return __awaiter(_this, void 0, void 0, function () {
            var id, routes, u;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                id = (_a = info.id) !== null && _a !== void 0 ? _a : pseudoObjectId() // Manage Subscriptions without ID
                ;
                routes = (_b = info.message) === null || _b === void 0 ? void 0 : _b[0];
                u = this.subscribers.get(id);
                if (!u) {
                    u = { id: id, routes: {}, send: function (o) {
                            if (o.message && o.route) {
                                ws.send(JSON.stringify(o));
                            }
                        } };
                    // Cancel Subscriptions
                    ws.on('close', function () {
                        _this.subscribers.delete(id);
                    });
                    // u.id = id
                    this.subscribers.set(id, u);
                }
                routes === null || routes === void 0 ? void 0 : routes.forEach(function (route) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        u.routes[route] = true;
                        return [2 /*return*/];
                    });
                }); });
                return [2 /*return*/];
            });
        }); };
        _this.server = httpServer;
        _this.init();
        return _this;
    }
    WebsocketService.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.server.on('upgrade', function (request, socket, head) { return __awaiter(_this, void 0, void 0, function () {
                    var _this = this;
                    return __generator(this, function (_a) {
                        this.wss.handleUpgrade(request, socket, head, function (ws) {
                            _this.wss.emit('connection', ws, request);
                        });
                        return [2 /*return*/];
                    });
                }); });
                // Connect Websocket
                this.wss.on('connection', function (ws, req) { return __awaiter(_this, void 0, void 0, function () {
                    var subprotocols, subArr, msg;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                subprotocols = {};
                                subArr = decodeURIComponent(ws.protocol).split(';');
                                subArr.forEach(function (str) {
                                    if (str) {
                                        var subSplit = str.split('/');
                                        var _a = __read(subSplit[2].split('?'), 2), val = _a[0], query = _a[1];
                                        var queries_1 = {};
                                        query.split('&').forEach(function (str) {
                                            var _a = __read(str.split('='), 2), key = _a[0], val = _a[1];
                                            queries_1[key] = val;
                                        });
                                        subprotocols[subSplit[1]] = (queries_1.arr === 'true') ? val.split(',') : val;
                                    }
                                });
                                return [4 /*yield*/, this.notify({ route: 'addUser', message: [Object.assign(subprotocols, { send: function (data) {
                                                    if (ws.readyState === 1)
                                                        ws.send(JSON.stringify(data));
                                                } })] })];
                            case 1:
                                msg = _a.sent();
                                ws.on('message', function (json) {
                                    if (json === void 0) { json = ""; }
                                    var parsed = JSON.parse(json);
                                    if (Array.isArray(parsed)) { //push arrays of requests instead of single objects (more optimal potentially, though fat requests can lock up servers)
                                        parsed.forEach(function (obj) {
                                            // if (!obj.id) obj.id = msg.id // DO NOT ALLOW FOR TRACKING
                                            _this.process(ws, obj);
                                        });
                                    }
                                    else {
                                        // if (!parsed.id) parsed.id = msg.id
                                        _this.process(ws, parsed);
                                    }
                                });
                                ws.on('close', function (s) { return console.log('WS closed'); });
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    };
    WebsocketService.type = 'backend';
    return WebsocketService;
}(SubscriptionService));
export default WebsocketService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0LmJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zZXJ2aWNlcy93ZWJzb2NrZXQvd2Vic29ja2V0LmJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDRDQUE0QztBQUM1QyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sSUFBSSxDQUFBO0FBQ3BDLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLGtDQUFrQyxDQUFBO0FBRXRFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUV2RCw0QkFBNEI7QUFDNUI7SUFBK0Isb0NBQW1CO0lBUTlDLDBCQUFZLE1BQU0sRUFBRSxVQUFVO1FBQTlCLFlBQ0Usa0JBQU0sTUFBTSxDQUFDLFNBS2xCO1FBWEMsVUFBSSxHQUFHLFdBQVcsQ0FBQTtRQUVsQixTQUFHLEdBQUcsSUFBSSxlQUFlLENBQUMsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBMkVyRSxhQUFPLEdBQUcsVUFBTyxFQUFFLEVBQUUsQ0FBQzs7Ozs7d0JBRXBCLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFBO3dCQUV2QixLQUFLLEdBQUcsVUFBRyxJQUFJLENBQUMsSUFBSSxlQUFZLENBQUE7NkJBQ2hDLENBQUEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxLQUFLLENBQUEsRUFBdkMsd0JBQXVDO3dCQUNoQyxxQkFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBQTs0QkFBeEMsc0JBQU8sU0FBaUMsRUFBQTs0QkFLaEMscUJBQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQTs7d0JBQTFCLEdBQUcsR0FBRyxTQUFvQjt3QkFDOUIsSUFBSSxP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