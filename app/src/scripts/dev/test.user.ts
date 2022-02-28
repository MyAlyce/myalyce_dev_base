import { client } from "../client";
import {DS} from 'brainsatplay-data'
import { ProfileStruct } from "brainsatplay-data/dist/src/types";
//import { randomId } from '../utils';


export const testuser:ProfileStruct = DS.ProfileStruct(
    'test',
    {
        _id:'test375914777899895',//randomId('test'),
        email:'test@myalyce.com',
        username:'testuser',
        firstName:'Lex',
        lastName:'Luthor',
        sex:'m',
        birthday:'09/10/1993'
    }) as ProfileStruct;


//setup the live user

export function setupTestUser() {
    return client.setupUser(testuser);
}