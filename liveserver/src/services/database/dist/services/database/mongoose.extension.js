import { __awaiter } from "tslib";
import ObjectID from "bson-objectid";
import { pseudoObjectId } from '../../common/id.utils';
export const safeObjectID = (str) => {
    return (typeof str === 'string' && str.length === 24) ? ObjectID(str) : pseudoObjectId(); // Just create one if it is invalid
};
export const get = (_, Model, query = [], value) => __awaiter(void 0, void 0, void 0, function* () {
    query.push({ _id: safeObjectID(value) });
    if (Model) {
        const res = (Object.values(query[0])[0] !== undefined)
            ? yield Model.findOne({ $or: query }).exec() //encryption references
            : yield Model.find({}).exec(); //encryption references  
        return res;
    }
    else
        throw 'Model not defined';
});
export const del = (_, Model, o) => __awaiter(void 0, void 0, void 0, function* () {
    if (Model) {
        yield Model.deleteOne({ id: o.id });
    }
    else
        throw 'Model not defined';
});
export const post = (_, Model, args) => __awaiter(void 0, void 0, void 0, function* () {
    if (Model) {
        yield Promise.all(args.map((struct) => __awaiter(void 0, void 0, void 0, function* () {
            let copy = JSON.parse(JSON.stringify(struct)); // Deep Copy
            if (copy._id)
                delete copy._id;
            // Only Set _id if Appropriate
            const _id = safeObjectID(struct._id);
            const toFind = (_id !== struct._id) ? { _id } : { id: struct.id };
            yield Model.updateOne(toFind, { $set: copy }, { upsert: true });
            // TODO: Add subscriptions rather than checkToNotify                              
            // this.checkToNotify(user, [struct]);
            return true;
        })));
    }
    else
        throw 'Model not defined';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uZ29vc2UuZXh0ZW5zaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbW9uZ29vc2UuZXh0ZW5zaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLFFBQVEsTUFBTSxlQUFlLENBQUE7QUFDcEMsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBRXZELE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFO0lBQ2hDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQSxDQUFDLG1DQUFtQztBQUNoSSxDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBTyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUU7SUFDbkQsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxDQUFBO0lBQ3RDLElBQUksS0FBSyxFQUFDO1FBQ04sTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQztZQUNsRCxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUMsR0FBRyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsdUJBQXVCO1lBQ2xFLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyx5QkFBeUI7UUFDNUQsT0FBTyxHQUFHLENBQUE7S0FDYjs7UUFBTSxNQUFNLG1CQUFtQixDQUFBO0FBQ3BDLENBQUMsQ0FBQSxDQUFBO0FBRUQsTUFBTSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUcsRUFBRTtJQUN0QyxJQUFJLEtBQUssRUFBQztRQUNOLE1BQU0sS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUN2Qzs7UUFBTSxNQUFNLG1CQUFtQixDQUFBO0FBQ3BDLENBQUMsQ0FBQSxDQUFBO0FBRUQsTUFBTSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRTtJQUV6QyxJQUFJLEtBQUssRUFBQztRQUVWLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQU0sTUFBTSxFQUFDLEVBQUU7WUFDdEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZO1lBQzNELElBQUcsSUFBSSxDQUFDLEdBQUc7Z0JBQUUsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzdCLDhCQUE4QjtZQUM5QixNQUFNLEdBQUcsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3BDLE1BQU0sTUFBTSxHQUFHLENBQUMsR0FBRyxLQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBQyxDQUFBO1lBQy9ELE1BQU0sS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLEVBQUUsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztZQUU1RCxrRkFBa0Y7WUFDbEYsc0NBQXNDO1lBRXRDLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQTtLQUNOOztRQUFNLE1BQU0sbUJBQW1CLENBQUE7QUFFaEMsQ0FBQyxDQUFBLENBQUEifQ==