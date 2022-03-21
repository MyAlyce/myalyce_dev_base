Pseudocode:
```js

//Showing how to uniformly work with the user database

//FOR DATA STRUCTURE TYPES SEE DS.types.ts in frontend/types
import {DS} from 'brainsatplay-data' //https://github.com/brainsatplay/brainsatplay-data
import { client } from 'frontend/client' //https://github.com/brainsatplay/liveserver



//creating data and updating on the server

    //users are objects containing a minimum of an _id key string or number.
    //If using mongodb the _id keys are replaced with the mongodb-generated keys 

    const user = {_id:undefined};

    type Struct = { //types exist in DS
        _id:string|number,
        structType:string,
        timestamp?:string|number,
        ownerId?:string|number,
        parent?:{structType:string,_id:string|number}
    }


    let s = DS.Struct(
        'struct',  //structType
        {x:1},         //props
        {_id:undefined},  //parentUser Partial<UserObject>
        {_id:undefined, structType:undefined} //parentStruct
    ) //returns the Struct type object plus arbitrary additional properties,
    // parentUser and parentStruct keys will not be present if not provided
    
/*
   User Client Callback ( client. )

*/
//add a struct to the server, returns the populated struct with default keys
   let struct = await client.addStruct(
        'struct',  //structType=
        {}, //props= //add any props you want to set, adding users[] with ids will tell who to notify if this struct is updated
        user,  //parentUser= 
        {_id:undefined, structType:undefined}, //parentStruct=
        true //updateServer= 
    );
/*  
    All other structs are just these but with additional properties.
    All basic structs have their own macros in place e.g. for comments and data

    Now particularly for data, we have a way to handle categorizing it generically, where the actual data can be arbitrary:
*/  
    type Data = {
        type: string, //helps the frontend identify this object
        data: any, //arrays, objects, links, API refrences, pdfs, csvs, xls, etc.
        timestamp?:string|number
    }

/*
    And then these Data types are meant to be parented to structs, which can represent multiple sets of related data. 
    These structs' ids are then passed as attachments in other structs so that bundled data can be efficiently referenced 

 */
    type DataStruct = {
        title:      string|undefined,
        author:     string|undefined,
        expires:    number|string|"NEVER", //date of expiration, or never. Data that never expires should generally only be patient controlled stuff so its transparent
        type:       string, //graph, file, table, fitbit_hr, fitbit_diet, etc.
        data:       Data[] //arrays, objects, links, API refrences, pdfs, csvs, xls, etc. plus some metadata
    } & Struct

    //e.g.
    let data = 'https://webmd.com/yes-you-are-dying' //e.g. a link
    let data2 = [{hr:91,timestamp:12345},{hr:87,timestamp:12346},{hr:94,timestamp:12347}] //,... //e.g. an array of heartrate data

    let dataobj1 = client.dataObject(data,'link');
    let dataobj2 = client.dataObject(data2,'heartrate');

    let datastruct = await client.addData(
        user, //parentUser
        user._id,
        'Test Data',
        'heart',
        [dataobj1,dataobj2],
        false,
        true
    );
    //returns a datastruct, potentially modified by MongoDB, and it's added to the DB

    //now let's add an event with a data structure attachment

    type EventStruct = {
        event:string, //event type e.g. relapse, hospitalization
        author:string,
        startTime:string,  //event began
        endTime:string,    //event ended
        grade:string|number,  //severity
        notes:string, //additional details
        attachments:Data|string|number[], //can be data or struct Ids
        users:string[], //users to be informed (i.e. peers)
    } & Struct


    let event = await client.addEvent(
        user,
        user._id, //author ID
        'heart', //event class
        'Noticed this today', //notes
        undefined, //startTime, can be left blank
        undefined, //endTime, can be left blank and the creation timestamp can be referenced instead
        4, //grade
        [datastruct._id],
        undefined, //users id array, can be used to tag/notify specific users
        true

    );

//updating server data
//e.g.

event.severity = 10;
let updated = await client.updateServerData([event]);
//returns the updated struct (potentially mutated e.g. by mongodb or bounced if no permissions)


//getting server data
/*
e.g. get an event for a user
*/
let ev = await client.getData(
    'event',
    user._id,
    {_id:event._id}
)[0];

/**
 * e.g. get a list of chatrooms by known IDs
 */
let events = await client.getDataByIds(
    [event._id,'1234','4567'],
    user._id, //optional
    'event' //optional
);

//getting local data
/*

*/

let chatrooms = client.getLocalData('chatroom');

type ChatroomStruct = {
    message:string,
    topic:string,
    author:string,
    attachments: Data|string|number[],
    comments: string[], //all comment struct Ids
    replies: string[], //first level reply comment struct Ids
    users: string[], //user Ids
    audioChatActive: boolean,
    videoChatActive: boolean
} & Struct

//and comments

type CommentStruct = {
    author:string,
    replyTo:string,
    attachments: Data|string|number[],
    replies: string[], //struct Ids
    users: string[], //user Ids
} & Struct

//deleting server data
/*
    delets on server and locally
*/

let deleted = await client.deleteData([event,datastruct]);

//deleting local data
/*
    just deletes locally kept temp data
*/

let deleted = client.deleteLocalData(event);



/**
 * That's really it for basic client calls, there are macros for the major data types (auths, comments, etc.) to quickly populate the app & server
 * There are more tools for calling the backend services and these are fairly flexible for supplying different search conditions based on what you have available
 * You start with only your user Id to search the DB and build up your local client from there with authorizations etc. for accessing other users
 * 
 * Now let's focus on the client.tablet object as this is for accessing local data.
 * When data is received from the server it by default is sorted into a few different collections in this structure
 * 
 * The base collection is client.collections, a map of maps based on each struct type.
 * 
 * The other collections are objects that arrange the data by timestamp, and then by type and timestamp. This makes for more convenient parsing on the frontend
*/

//if a certain struct type is detected this function runs to help modify
// arbitrary data types into something mirroring our format (e.g. fitbit server data turned into parseable data in our system )
client.tablet.setSort(
    'struct',
    (struct, //the struct to sort in
     newdata, //array of the sorted data in this run so far, use this to push something else as a result (return undefined to not use the unmutated struct)
     tablet) => { //essentially a 'this' reference
        if(!struct._id) struct._id = randomId('struct');//e.g.
        return struct; //or push a new mutated struct to the newdata array
    }
);

//get an array of data corresponding to the UTC timestamp
let data = client.tablet.getDataByTimestamp(
    timestamp, //UTC time
    ownerId //user _id (optional)
); //supply a certain timestamp and get all of the data made at that same time

let datarange = client.tablet.getDataByTimeRange(
    begin,   //start time range (UTC)
    end,     //end time range (UTC)
    type,    //structType (optional)
    ownerId //user _id (optional)
);

let data_bytype = client.tablet.getDataByType( //e.g. get custom sorted data structs 
    type, //structType 
    timestamp, //UTC timestamp (optional)
    ownerId //user _id (optional)
);

//now say we have a struct filling up with real time data in arrays, and we need to cull it a bit
// to free up memory, we can search collections in the tablet and trim their arrays automatically (including all nested arrays in nested objects)
client.tablet.checkRollover('ppg',20000); //e.g. trim oldest ppg data to within a certain limit, default is 50000


```