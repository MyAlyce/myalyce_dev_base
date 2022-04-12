import { __awaiter, __extends, __generator, __read, __spreadArray } from "tslib";
import { Service } from "../../router/Service";
// import { randomId, pseudoObjectId } from '../../common/id.utils';
import * as mongooseExtension from './mongoose.extension';
var DatabaseService = /** @class */ (function (_super) {
    __extends(DatabaseService, _super);
    function DatabaseService(Router, dbOptions, debug) {
        if (dbOptions === void 0) { dbOptions = {}; }
        if (debug === void 0) { debug = true; }
        var _this = _super.call(this, Router) || this;
        _this.name = 'database';
        _this.collections = {};
        // Experimental APIs
        // https://developer.mozilla.org/en-US/docs/Web/API/StorageManager
        // console.log(globalThis.navigator?.storage)
        // https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
        // https://developer.mozilla.org/en-US/docs/Web/API/FileSystem
        // https://web.dev/file-system-access/
        // https://stackoverflow.com/questions/65086325/how-to-stream-files-to-and-from-the-computer-in-browser-javascript
        // if(!Router) { console.error('Requires a Router instance.'); return; }
        // Fill in Default collections
        if (!dbOptions.collections)
            dbOptions.collections = {};
        Object.values(dbOptions.collections).forEach(function (o) { return o.reference = {}; });
        _this.collections = dbOptions.collections; // Add Reference for Local Data
        var _loop_1 = function (key) {
            // Populate Filters
            if (!this_1.collections[key].filters)
                this_1.collections[key].filters = {};
            if (!this_1.collections[key].filters.get)
                this_1.collections[key].filters.get = function () { return true; }; // Filter Nothing
            if (!this_1.collections[key].filters.post)
                this_1.collections[key].filters.post = function () { return true; }; // Pass
            if (!this_1.collections[key].filters.delete)
                this_1.collections[key].filters.delete = function () { return true; }; // Pass
            // Grab Object Reference
            var object = this_1.collections[key].reference;
            var getHandler = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return __awaiter(_this, void 0, void 0, function () {
                    var data, len, values, _a;
                    var _this = this;
                    var _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                data = [];
                                args = args
                                    .filter(function (v) { return typeof v === 'string'; })
                                    .map(function (v) {
                                    var split = v.split(',');
                                    if (split.length > 0)
                                        return split;
                                    else
                                        return [v];
                                }); // TODO: Allow JSON passing
                                len = args.length;
                                values = (_b = args.shift()) !== null && _b !== void 0 ? _b : [undefined];
                                return [4 /*yield*/, Promise.all(values.map(function (v) { return __awaiter(_this, void 0, void 0, function () {
                                        var query, _a, _b;
                                        return __generator(this, function (_c) {
                                            switch (_c.label) {
                                                case 0:
                                                    query = [];
                                                    if (this.collections[key].match)
                                                        this.collections[key].match.forEach(function (k) {
                                                            var _a;
                                                            return query.push((_a = {}, _a[k] = v, _a));
                                                        });
                                                    if (!this.collections[key].model) return [3 /*break*/, 2];
                                                    _b = (_a = data).push;
                                                    return [4 /*yield*/, mongooseExtension.get(this, this.collections[key].model, query, v)];
                                                case 1:
                                                    _b.apply(_a, [_c.sent()]);
                                                    return [3 /*break*/, 3];
                                                case 2:
                                                    data.push((len > 0) ? Object.values(object).find(function (dict) {
                                                        query.forEach(function (o) {
                                                            var k = Object.keys(o)[0];
                                                            return dict[k] === o[k];
                                                        });
                                                    }) : object);
                                                    _c.label = 3;
                                                case 3: return [2 /*return*/];
                                            }
                                        });
                                    }); }))
                                    // Drill Into Properties
                                ];
                            case 1:
                                _c.sent();
                                // Drill Into Properties
                                try {
                                    args.forEach(function (k) { return data = data[k[0]]; }); // Only drill by the first value
                                }
                                catch (e) { }
                                if (!(typeof data === 'object' && data != null)) return [3 /*break*/, 3];
                                return [4 /*yield*/, Object.values(data).filter(function (v) { return _this.collections[key].filters.get(v, _this.collections); })]; // Object
                            case 2:
                                _a = _c.sent(); // Object
                                return [3 /*break*/, 4];
                            case 3:
                                _a = (this.collections[key].filters.get(data, this.collections)) ? data : null; // Single  Non-Object
                                _c.label = 4;
                            case 4: 
                            // Check Permission to Access Data
                            return [2 /*return*/, _a]; // Single  Non-Object
                        }
                    });
                });
            };
            this_1.routes.push({
                route: "".concat(key, "/**"),
                // Generic Get Handler
                get: {
                    object: object,
                    transform: getHandler
                },
                // Generic Delete Handler
                delete: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, passed, _a, o, s, toDelete;
                    var _b, _c;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, null
                                        // Check filters
                                    ];
                                if (!((_c = (_b = this.collections[key]) === null || _b === void 0 ? void 0 : _b.filters) === null || _c === void 0 ? void 0 : _c.delete)) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.collections[key].filters.delete(u, args, this.collections)];
                            case 1:
                                _a = _d.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                _a = true;
                                _d.label = 3;
                            case 3:
                                passed = _a;
                                if (!passed) return [3 /*break*/, 9];
                                if (!this.collections[key].model) return [3 /*break*/, 8];
                                return [4 /*yield*/, getHandler.apply(void 0, __spreadArray([], __read(args), false))];
                            case 4:
                                o = _d.sent();
                                if (!o) return [3 /*break*/, 6];
                                return [4 /*yield*/, mongooseExtension.del(this, this.collections[key].model, args[0])];
                            case 5:
                                _d.sent();
                                return [2 /*return*/, true];
                            case 6: return [2 /*return*/, false
                                // if(u.id !== userId) this.router.sendMsg(userId,'deleted',userId);
                            ];
                            case 7: return [3 /*break*/, 9];
                            case 8:
                                s = this.collections[key].reference[args[0]._id] // Delete by ObjectID only
                                ;
                                if (s) {
                                    toDelete = this.collections[key].reference[s._id];
                                    delete this.collections[key].reference[s._id];
                                    if (toDelete)
                                        return [2 /*return*/, true];
                                    else
                                        return [2 /*return*/, false];
                                }
                                _d.label = 9;
                            case 9: return [2 /*return*/, null];
                        }
                    });
                }); },
                // Generic Post Handler
                post: function (self, args, origin) { return __awaiter(_this, void 0, void 0, function () {
                    var u, data, passed, _a;
                    var _this = this;
                    var _b, _c;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                u = self.USERS[origin];
                                if (!u)
                                    return [2 /*return*/, null];
                                if (args.length === 0)
                                    return [2 /*return*/, getHandler.apply(void 0, __spreadArray([], __read(args), false))]; // Use Get if post has no arguments
                                if (!((_c = (_b = this.collections[key]) === null || _b === void 0 ? void 0 : _b.filters) === null || _c === void 0 ? void 0 : _c.post)) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.collections[key].filters.post(u, args, this.collections)];
                            case 1:
                                _a = _d.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                _a = true;
                                _d.label = 3;
                            case 3:
                                passed = _a;
                                if (!passed) return [3 /*break*/, 7];
                                if (!this.collections[key].model) return [3 /*break*/, 5];
                                return [4 /*yield*/, mongooseExtension.post(this, this.collections[key].model, args)];
                            case 4:
                                data = _d.sent();
                                return [3 /*break*/, 6];
                            case 5:
                                // TODO: Ensure this is actually the right scope (may be args[0])
                                args.forEach(function (s) { return _this.collections[key].reference[s._id] = s; });
                                _d.label = 6;
                            case 6: return [3 /*break*/, 8];
                            case 7: return [2 /*return*/, null];
                            case 8: return [2 /*return*/, !!data]; // Return Boolean
                        }
                    });
                }); }
            });
        };
        var this_1 = this;
        // Populate Collections Object & Routes
        for (var key in _this.collections) {
            _loop_1(key);
        }
        return _this;
    }
    return DatabaseService;
}(Service));
export default DatabaseService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2Uuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2RhdGFiYXNlLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU1BLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxvRUFBb0U7QUFDcEUsT0FBTyxLQUFLLGlCQUFpQixNQUFNLHNCQUFzQixDQUFBO0FBc0J6RDtJQUE4QixtQ0FBTztJQU9qQyx5QkFBYSxNQUFNLEVBQUUsU0FFZixFQUFFLEtBQVU7UUFGRywwQkFBQSxFQUFBLGNBRWY7UUFBRSxzQkFBQSxFQUFBLFlBQVU7UUFGbEIsWUFHSSxrQkFBTSxNQUFNLENBQUMsU0FnSmhCO1FBeEpELFVBQUksR0FBRyxVQUFVLENBQUE7UUFFakIsaUJBQVcsR0FBb0IsRUFBRSxDQUFBO1FBUTdCLG9CQUFvQjtRQUNwQixrRUFBa0U7UUFDbEUsNkNBQTZDO1FBRTdDLDBFQUEwRTtRQUMxRSw4REFBOEQ7UUFDOUQsc0NBQXNDO1FBQ3RDLGtIQUFrSDtRQUVsSCx3RUFBd0U7UUFFeEUsOEJBQThCO1FBQzlCLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVztZQUFFLFNBQVMsQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFBO1FBQ3RELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxTQUFTLEdBQUcsRUFBRSxFQUFoQixDQUFnQixDQUFDLENBQUE7UUFDbkUsS0FBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFBLENBQUMsK0JBQStCO2dDQUcvRCxHQUFHO1lBRVIsbUJBQW1CO1lBQ25CLElBQUksQ0FBQyxPQUFLLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPO2dCQUFFLE9BQUssV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFF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