import { client } from "../scripts/client";
import { DS } from 'brainsatplay-data'
import { ProfileStruct } from "brainsatplay-data/dist/src/types";

console.log(DS)
//import { randomId } from '../utils';

//dummy profile
export const testuser:ProfileStruct = DS.ProfileStruct(
    'test',
    {
        _id:'test375914777899895',//randomId('test'),
        email:'test@myalyce.com',
        username:'testuser',
        firstName:'Howard',
        lastName:'Dent',
        sex:'m',
        birthday:'09/10/1993'
})// as ProfileStruct;

//setup the live user

export async function setupTestUser() {

    let endpoint = client.connect({
        target: settings.dataserver,
        credentials: testuser,
        type: 'websocket'
    }).subscribe((o:any) => {
        console.log('Indirect message from socket', o)
    })
    
    //test command
    await client.send('routes')
          .then((res:any) => console.log('Routes',res))
          .catch(console.error)
    

    // console.log('setting up')
    // let res = await client.login(undefined,testuser);
    // console.log('login res', res);
    
    console.log('setting up client')
    let loggedin = await client.login(endpoint, testuser);
    console.log('loggedin', loggedin);
    return client.setupUser(testuser);
}


//second user test for two way communications testing
export const testpeer:ProfileStruct = DS.ProfileStruct(
    'test',
    {
        _id:'test375914777899896',//randomId('test'),
        email:'testpeer@myalyce.com',
        username:'testpeer',
        firstName:'The',
        lastName:'Batman',
        sex:'m',
        birthday:'01/19/1483'
})// as ProfileStruct;


import { settings } from 'node_server/server_settings';
import { StructRouter } from 'src/../../liveserver/src/services/database'
export let client2:StructRouter; //hook up the websockets and REST APIs to this router and do whatever init needed


export function setupTestPeer() {
    //connect to the liveserver endpoint
    client2 = new StructRouter();

    client2.connect({
        target: settings.dataserver,
        credentials: testpeer,
        type: 'websocket'
    }).subscribe((o:any) => {
        console.log('Indirect message from socket', o)
    })

    //test command
    client2.send('routes')
        .then((res:any) => console.log('Client 2 Routes',res))
        .catch(console.error)

    return client2.setupUser(testpeer);
}

