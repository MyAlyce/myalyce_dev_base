import { __awaiter, __generator } from "tslib";
import ObjectID from "bson-objectid";
import { pseudoObjectId } from '../../common/id.utils';
export var safeObjectID = function (str) {
    return (typeof str === 'string' && str.length === 24) ? ObjectID(str) : pseudoObjectId(); // Just create one if it is invalid
};
export var get = function (_, Model, query, value) {
    if (query === void 0) { query = []; }
    return __awaiter(void 0, void 0, void 0, function () {
        var res, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    query.push({ _id: safeObjectID(value) });
                    if (!Model) return [3 /*break*/, 5];
                    if (!(Object.values(query[0])[0] !== undefined)) return [3 /*break*/, 2];
                    return [4 /*yield*/, Model.findOne({ $or: query }).exec()]; //encryption references
                case 1:
                    _a = _b.sent(); //encryption references
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, Model.find({}).exec()];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4:
                    res = _a;
                    return [2 /*return*/, res];
                case 5: throw 'Model not defined';
            }
        });
    });
};
export var del = function (_, Model, o) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!Model) return [3 /*break*/, 2];
                return [4 /*yield*/, Model.deleteOne({ id: o.id })];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2: throw 'Model not defined';
            case 3: return [2 /*return*/];
        }
    });
}); };
export var post = function (_, Model, args) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!Model) return [3 /*break*/, 2];
                return [4 /*yield*/, Promise.all(args.map(function (struct) { return __awaiter(void 0, void 0, void 0, function () {
                        var copy, _id, toFind;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    copy = JSON.parse(JSON.stringify(struct));
                                    if (copy._id)
                                        delete copy._id;
                                    _id = safeObjectID(struct._id);
                                    toFind = (_id !== struct._id) ? { _id: _id } : { id: struct.id };
                                    return [4 /*yield*/, Model.updateOne(toFind, { $set: copy }, { upsert: true })];
                                case 1:
                                    _a.sent();
                                    // TODO: Add subscriptions rather than checkToNotify                              
                                    // this.checkToNotify(user, [struct]);
                                    return [2 /*return*/, true];
                            }
                        });
                    }); }))];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2: throw 'Model not defined';
            case 3: return [2 /*return*/];
        }
    });
}); };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uZ29vc2UuZXh0ZW5zaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbW9uZ29vc2UuZXh0ZW5zaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLFFBQVEsTUFBTSxlQUFlLENBQUE7QUFDcEMsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBRXZELE1BQU0sQ0FBQyxJQUFNLFlBQVksR0FBRyxVQUFDLEdBQUc7SUFDNUIsT0FBTyxDQUFDLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFBLENBQUMsbUNBQW1DO0FBQ2hJLENBQUMsQ0FBQTtBQUVELE1BQU0sQ0FBQyxJQUFNLEdBQUcsR0FBRyxVQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBUSxFQUFFLEtBQUs7SUFBZixzQkFBQSxFQUFBLFVBQVE7Ozs7OztvQkFDeEMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxDQUFBO3lCQUNsQyxLQUFLLEVBQUwsd0JBQUs7eUJBQ08sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxFQUExQyx3QkFBMEM7b0JBQ2hELHFCQUFNLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBQyxHQUFHLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBQSxDQUFDLHVCQUF1Qjs7b0JBQWhFLEtBQUEsU0FBd0MsQ0FBQSxDQUFDLHVCQUF1Qjs7d0JBQ2hFLHFCQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUE7O29CQUEzQixLQUFBLFNBQTJCLENBQUE7OztvQkFGM0IsR0FBRyxLQUV3QjtvQkFDakMsc0JBQU8sR0FBRyxFQUFBO3dCQUNQLE1BQU0sbUJBQW1CLENBQUE7Ozs7Q0FDbkMsQ0FBQTtBQUVELE1BQU0sQ0FBQyxJQUFNLEdBQUcsR0FBRyxVQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQzs7OztxQkFDN0IsS0FBSyxFQUFMLHdCQUFLO2dCQUNMLHFCQUFNLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUE7O2dCQUFuQyxTQUFtQyxDQUFDOztvQkFDakMsTUFBTSxtQkFBbUIsQ0FBQTs7OztLQUNuQyxDQUFBO0FBRUQsTUFBTSxDQUFDLElBQU0sSUFBSSxHQUFHLFVBQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJOzs7O3FCQUVqQyxLQUFLLEVBQUwsd0JBQUs7Z0JBRVQscUJBQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQU0sTUFBTTs7Ozs7b0NBQy9CLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQ0FDOUMsSUFBRyxJQUFJLENBQUMsR0FBRzt3Q0FBRSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7b0NBRXZCLEdBQUcsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO29DQUM5QixNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsS0FBQSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFLEVBQUMsQ0FBQTtvQ0FDL0QscUJBQU0sS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLEVBQUUsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDLENBQUMsRUFBQTs7b0NBQTNELFNBQTJELENBQUM7b0NBRTVELGtGQUFrRjtvQ0FDbEYsc0NBQXNDO29DQUV0QyxzQkFBTyxJQUFJLEVBQUM7Ozt5QkFDZixDQUFDLENBQUMsRUFBQTs7Z0JBWkgsU0FZRyxDQUFBOztvQkFDQSxNQUFNLG1CQUFtQixDQUFBOzs7O0tBRS9CLENBQUEifQ==