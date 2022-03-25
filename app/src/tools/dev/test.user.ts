import { client } from "../scripts/client";
import { DS } from 'brainsatplay-data'
import { ProfileStruct } from "brainsatplay-data/dist/src/types";
import { settings } from 'node_server/server_settings';
import StructRouter from 'src/../../liveserver/src/services/database/structs.router'
import HTTPService from 'src/../../liveserver/src/services/http/http.frontend'

// Create Second Client
import WebsocketService from 'src/../../liveserver/src/services/websocket/websocket.frontend'
import { UserObject } from "../../../../liveserver/src/common/general.types";
export let client2 = new StructRouter(); //hook up the websockets and REST APIs to this router and do whatever init needed
const http = new HTTPService(client2);
const websocket = new WebsocketService(client2);

client2.load(http, 'http')
client2.load(websocket, 'websockets')


// console.log(DS)
//import { randomId } from '../utils';

//dummy profile
export const testuser:ProfileStruct = DS.ProfileStruct(
    'test',
    {
        _id:'testclient',//randomId('test'),
        email:'testclient@myalyce.com',
        username:'testclient',
        firstName:'Howard',
        lastName:'Dent',
        sex:'m',
        birthday:'09/10/1993',
        // data:{
        //     fitbit: {
        //         access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMkM3UUsiLCJzdWIiOiI5TVA1WlgiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJ3aHIgd251dCB3cHJvIHdzbGUgd3dlaSB3c29jIHdhY3Qgd3NldCB3bG9jIiwiZXhwIjoxNjQ4MjEwODM3LCJpYXQiOjE2NDgxODIwMzd9.BMpbb3v69OW2r5QXvFsbMsEAALvvUxI9Vuyy28f98bo',
        //         expires_in: 28800,
        //         refresh_token: '56a85241ae06b8b48b667634daee08927c39b7e6bdffbf0459d0148c7c683e84',
        //         user_id: '9MP5ZX',
        //         scope: 'social location nutrition sleep profile heartrate activity settings weight',
        //         token_type: 'Bearer'
        //     }
        // }
})// as ProfileStruct;

//setup the live user

export async function setupTestUser():Promise<Partial<ProfileStruct> | undefined> {

    let endpoint = client.connect({
        target: settings.dataserver,
        credentials: testuser as UserObject,
        type: 'websocket'
    });

    endpoint.subscribe((o:any) => {
        //console.log('Indirect message from socket', o)
        client.baseServerCallback(o);
    })

    console.log(endpoint);
    
    //test command
    console.log('Sending /routes from Client 1')
    await client.send('routes')
          .then((res:any) => console.log('Routes (Client 1)',res))
          .catch(console.error)
    

    // console.log('setting up')
    // let res = await client.login(undefined,testuser);
    // console.log('login res', res);
    
    console.log('setting up client')
    //let loggedin = await client.login(endpoint, testuser);
    //console.log('loggedin (Client 1)', loggedin);
    return client.setupUser(testuser as Partial<ProfileStruct>);
}


//second user test for two way communications testing
export const testpeer:ProfileStruct = DS.ProfileStruct(
    'test',
    {
        _id:'testpeer',//randomId('test'),
        email:'testpeer@myalyce.com',
        username:'testpeer',
        firstName:'The',
        lastName:'Batman',
        sex:'m',
        birthday:'01/19/1483'
})// as ProfileStruct;


export async function setupTestPeer():Promise<Partial<ProfileStruct> | undefined> {

    let endpoint = client2.connect({
        target: settings.dataserver,
        credentials: testpeer as UserObject,
        type: 'websocket'
    })
    
    endpoint.subscribe((o:any) => {
        client.baseServerCallback(o);
    })

    //test command
    console.log('Sending /routes from Client 2')
    client2.send('routes')
        .then((res:any) => console.log('Routes (Client 2)',res))
        .catch(console.error)

    console.log('setting up client')
    //let loggedin = await client2.login(endpoint, testpeer);
    //console.log('loggedin (Client 2)', loggedin);

    return client2.setupUser(testpeer as Partial<ProfileStruct>);
}

