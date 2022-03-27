import { __awaiter } from "tslib";
import { Service } from "../../core/Service";
// import { randomId, pseudoObjectId } from '../../common/id.utils';
import * as mongooseExtension from './mongoose.extension';
class DatabaseService extends Service {
    constructor(Router, dbOptions = {}, debug = true) {
        super(Router);
        this.name = 'database';
        this.collections = {};
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
        Object.values(dbOptions.collections).forEach(o => o.reference = {});
        this.collections = dbOptions.collections; // Add Reference for Local Data
        // Populate Collections Object & Routes
        for (let key in this.collections) {
            // Populate Filters
            if (!this.collections[key].filters)
                this.collections[key].filters = {};
            if (!this.collections[key].filters.get)
                this.collections[key].filters.get = () => true; // Filter Nothing
            if (!this.collections[key].filters.post)
                this.collections[key].filters.post = () => true; // Pass
            if (!this.collections[key].filters.delete)
                this.collections[key].filters.delete = () => true; // Pass
            // Grab Object Reference
            const object = this.collections[key].reference;
            const getHandler = (...args) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                let data = [];
                args = args
                    .filter(v => typeof v === 'string')
                    .map(v => {
                    const split = v.split(',');
                    if (split.length > 0)
                        return split;
                    else
                        return [v];
                }); // TODO: Allow JSON passing
                const len = args.length;
                const values = (_a = args.shift()) !== null && _a !== void 0 ? _a : [undefined];
                yield Promise.all(values.map((v) => __awaiter(this, void 0, void 0, function* () {
                    const query = [];
                    if (this.collections[key].match)
                        this.collections[key].match.forEach(k => query.push({ [k]: v }));
                    // Check MongoDB or Local
                    if (this.collections[key].model)
                        data.push(yield mongooseExtension.get(this, this.collections[key].model, query, v));
                    else {
                        data.push((len > 0) ? Object.values(object).find((dict) => {
                            query.forEach(o => {
                                const k = Object.keys(o)[0];
                                return dict[k] === o[k];
                            });
                        }) : object);
                    }
                })));
                // Drill Into Properties
                try {
                    args.forEach(k => data = data[k[0]]); // Only drill by the first value
                }
                catch (e) { }
                // Check Permission to Access Data
                return (typeof data === 'object' && data != null)
                    ? yield Object.values(data).filter((v) => this.collections[key].filters.get(v, this.collections)) // Object
                    : (this.collections[key].filters.get(data, this.collections)) ? data : null; // Single  Non-Object
            });
            this.routes.push({
                route: `${key}/**`,
                // Generic Get Handler
                get: {
                    object,
                    transform: getHandler
                },
                // Generic Delete Handler
                delete: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    var _b, _c;
                    // Don't Allow Users to Delete until Logged In
                    const u = self.USERS[origin];
                    if (!u)
                        return null;
                    // Check filters
                    let passed = ((_c = (_b = this.collections[key]) === null || _b === void 0 ? void 0 : _b.filters) === null || _c === void 0 ? void 0 : _c.delete) ? yield this.collections[key].filters.delete(u, args, this.collections) : true;
                    if (passed) {
                        // Set MongoDB or Local
                        if (this.collections[key].model) {
                            let o = yield getHandler(...args);
                            if (o) {
                                yield mongooseExtension.del(this, this.collections[key].model, args[0]);
                                return true;
                            }
                            else
                                return false;
                            // if(u.id !== userId) this.router.sendMsg(userId,'deleted',userId);
                        }
                        else {
                            let s = this.collections[key].reference[args[0]._id]; // Delete by ObjectID only
                            if (s) {
                                const toDelete = this.collections[key].reference[s._id];
                                delete this.collections[key].reference[s._id];
                                if (toDelete)
                                    return true;
                                else
                                    return false;
                            }
                        }
                    }
                    return null;
                }),
                // Generic Post Handler
                post: (self, args, origin) => __awaiter(this, void 0, void 0, function* () {
                    var _d, _e;
                    // Don't Allow Users to Request until Logged In
                    const u = self.USERS[origin];
                    if (!u)
                        return null;
                    let data;
                    if (args.length === 0)
                        return getHandler(...args); // Use Get if post has no arguments
                    // Check filters
                    let passed = ((_e = (_d = this.collections[key]) === null || _d === void 0 ? void 0 : _d.filters) === null || _e === void 0 ? void 0 : _e.post) ? yield this.collections[key].filters.post(u, args, this.collections) : true;
                    if (passed) {
                        // Set MongoDB or Local
                        if (this.collections[key].model) {
                            data = yield mongooseExtension.post(this, this.collections[key].model, args);
                        }
                        else {
                            // TODO: Ensure this is actually the right scope (may be args[0])
                            args.forEach((s) => this.collections[key].reference[s._id] = s);
                        }
                    }
                    else
                        return null;
                    return !!data; // Return Boolean
                })
            });
        }
    }
}
export default DatabaseService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2Uuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2RhdGFiYXNlLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU1BLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxvRUFBb0U7QUFDcEUsT0FBTyxLQUFLLGlCQUFpQixNQUFNLHNCQUFzQixDQUFBO0FBc0J6RCxNQUFNLGVBQWdCLFNBQVEsT0FBTztJQU9qQyxZQUFhLE1BQU0sRUFBRSxZQUVqQixFQUFFLEVBQUUsS0FBSyxHQUFDLElBQUk7UUFDZCxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7UUFSakIsU0FBSSxHQUFHLFVBQVUsQ0FBQTtRQUVqQixnQkFBVyxHQUFvQixFQUFFLENBQUE7UUFRN0Isb0JBQW9CO1FBQ3BCLGtFQUFrRTtRQUNsRSw2Q0FBNkM7UUFFN0MsMEVBQTBFO1FBQzFFLDhEQUE4RDtRQUM5RCxzQ0FBc0M7UUFDdEMsa0hBQWtIO1FBRWxILHdFQUF3RTtRQUV4RSw4QkFBOEI7UUFDOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXO1lBQUUsU0FBUyxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUE7UUFDdEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQTtRQUNuRSxJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUEsQ0FBQywrQkFBK0I7UUFFeEUsdUNBQXVDO1FBQ3ZDLEtBQUssSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBQztZQUU3QixtQkFBbUI7WUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTztnQkFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcs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