import { UserObject } from './general.types';

export const randomId = (prefix?) => ((prefix) ? `${prefix}_` : '')  + Math.floor(100000*Math.random())

export const pseudoObjectId = (m = Math, d = Date, h = 16, s = s => m.floor(s).toString(h)) =>
    s(d.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(m.random() * h))


export const generateCredentials = (o?:Partial<UserObject>) => {

    if(!o) o = {_id:pseudoObjectId()};

    o = {
        _id: o._id ?? pseudoObjectId(),
        id: o.id || o._id
    }

    return o
}