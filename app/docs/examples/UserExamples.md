Pseudocode:
```js

import {client} from 'frontend/client' //https://github.com/brainsatplay/liveserver

//The client contains all of the old platform functions and routes the rest of the server functionality from the frontend based on available backend services

//set a user up on the server given at least an _id in an object
let u = await client.setupUser(Partial<UserObject>)

//a lot of the user-specific calls require two-way authorizations with other users
//all server calls can be awaited for results or use .then(res => ...)


 type Struct = {
    _id:string|number,
    structType:string,
    timestamp?:string|number,
    ownerId?:string|number,
    parent?:{structType:string,_id:string|number}
}

client.addStruct(structType,props,parentUser,parentStruct) //add an arbitrary struct to the DB locally and remotely




let pong = await client.ping() //ping the server, returns 'pong'
client.sendMessage(userId,message,data) //send arbitrary message to another user Id



type ProfileStruct = {
    username:  string,
    name?:      string, 
    firstName?: string, 
    lastName?:  string, 
    email?:     string, 
    sex?:       string,
    birthday?:  string,
    userRoles?: string[],
    type?:      string,
    id?:        string|number 
} & Struct

client.getUser(info) //get a user by id, username, or email
client.getUsers(ids) //get user profiles by ids
client.getUserByRoles(userRoles) //get users by group roles e.g. alyce_admin

client.setUser(userStruct) //update the user profile on the server


client.getAllUserData(ownerId,excluded) //get a user's data by id, can exclude collections

client.getData(collection,ownerId,searchDict,limit,skip) //supplyat least  one of the first three arguments with the ability to set limits and skips
//returns an array of structs
client.updateServerData(structs) //pass an array of structs to update on the server, this will notify connected peers


client.getDataByIds(structIds,ownerId,collection) //get structs by ids, can add owner and collection for better specification (and faster results)

client.getStructParentData(struct) //get the parent struct by parent id (if it exists)

client.onResult = (res) => {} //customizable callback to handle server outputs, run after the default baseServerCallback (which is required in most cases), simple frontend handle 


client.deleteData(structs) //pass an array of structs to delete the local and server instances of it
client.deleteUser(userId) //delete a user by id



type GroupStruct = {
    name:string,
    details:string,
    admins:string|number[], //user ids
    peers:string|number[],  //user ids
    clients:string|number[], 
    users:string|number[] //all users (for notifying)   
} & Struct;

client.setGroup(groupStruct) //set a group struct on the server, returns a modified one with proper ids for other members (which can be set by email or username)
client.getGroups(userId,groupId); //get list of groups by userId or a specific group for that user
client.deleteGroup(groupId) //it does the thing



type AuthorizationStruct = {
    authorizedId:     string,
    authorizedName:   string,
    authorizerId:     string,
    authorizerName:   string,
    authorizations:   string[], //authorization types e.g. what types of data the person has access to
    structs:          string|number[], //specific structs, contains structrefs
    excluded:         string|number[], 
    groups:           string[],
    status:           "PENDING"|"OKAY",
    expires:          string|boolean, 
    associatedAuthId: string|number //other authorization id belonging to other user
} & Struct

client.setAuthorization(authorizationStruct); //pass an auth struct to validate it on the server
client.getAuthorizations(userId, authId); //get authorizations by user Id and/or by auth id. This is how you will lookup other users by retrieving their ids from here
client.deleteAuthorization(authId); //yup

client.setAuthorizationsByGroup(user) //bulk create authorizations e.g. if you are a client in a group with several providers etc.

client.getUserDataByAuthorization(authStruct,collection,searchDict,limit,skip) //using the access-authorizing user's id to query the DB, otherwise like getData
client.getUserDataByAuthorizationGroup(groupId,collection,searchDict,limit,skip); //get all of the (optionally specified) data for the authorizing users in a group
client.hasLocalAuthorization(otherUserId,ownerId) //can check if the owner has an authorization with the other user by id




type NotificationStruct = {
    note:string,
    parentUserId:string //plus the parent struct reference: {_id, structType}
} & Struct

client.checkForNotifications(userId) //check for notifications for a userId these are special structs for alerting others that a struct has changed
client.resolveNotifications(notifications,pull,user) //resolve the notificatios for the specified user, deleting them on the server.
//with pull flagged as true, the associated struct for the notification is pulled and updated locally



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

client.deleteRoom(roomStruct) //deletes a chatroom and all child comment structs



type CommentStruct = {
    author:string,
    replyTo:string,
    attachments: Data|string|number[],
    replies: string[], //struct Ids
    users: string[], //user Ids
} & Struct

client.deleteComment(commentStruct) //deletes a comment and all child replies which are their own structs





//creating structs

client.authorizeUser(...) //authorize one account to another with specified permissions
client.addGroup(...) //create a group with users in admin or client roles by id
client.dataObject(...) //just wraps whatever data you have in an object with some metadata
client.addData(...) //a big struct to contain e.g. arrays of dataObjects and necessary identifying info
client.addEvent(...) //add an event struct with specified info e.g. type, grade, begin and end times, etc.
client.addChatroom(...) //create a chatroom for the specified users
client.addComment(...) //add a comment to a chatroom or parent comment 
```