import { 
    testuser, 
    testpeer, 
    setupTestUser, 
    setupTestPeer, 
    //setupTestData 
} from "./test.user";


//TEST: 
//
//ORDER OF OPERATIONS

//init clients, login with user profiles and pull data
//setup test data
//authorize client 1 and 2 to each other
//message client 1 to client 2
//resolve notifications on client 2
//reply to client 1 from client 2
//resolve notifications on client 1
//reject authorization on client 1
//create a group to proxy authorization authority for groups of peers with access
//do group authorizations
//test admin control of client 2 for client 1 

//test alert of user real time data or event to peer



//struct router clients with live socket connections
import { client } from "../scripts/client";
import { client2 } from "./test.user";

//types
import { 
    AuthorizationStruct, 
    ChatroomStruct, 
    CommentStruct, 
    ProfileStruct 
} from "brainsatplay-data/dist/src/types";
import { StructRouter } from "../../../../liveserver/src/services/database";
import { breatharr, breathratearr } from "./dummy.data";
//import { dummyppg, breathratearr } from './dummy.data';
// import { StructRouter } from "../../../../liveserver/src/services/database/dist/services/database";

//run all of the test functions in order
export async function runTests() {
    let users = await initTestClients();
    let auths = await authPeerForUser(users.user,users.peer);
    //let data = await setupTestData(users.user,users.peer);
    let chatroomres = await messagePeerFromUser(users.user,users.peer);
    let pnotes = await checkPeerNotifications();
    let replied = await replyToUserFromPeer(users.peer,chatroomres.chatroom,chatroomres.comment);
    let unotes = await checkUserNotifications();
    // let rejected = await rejectUserAuthToPeer(auths.userauth);
    // let group = await createPeerGroup(users.user,users.peer);
    // let gauths = await authPeerToUserViaGroup();


    let res = {
        users,
        auths,
        //data,
        chatroomres,
        pnotes,
        replied,
        unotes,
        // rejected,
        // group,
        // gauths
    }

    console.log('results',res);

    return res;
}

//init clients, login with user profiles and pull data
export async function initTestClients() {

    let user = await setupTestUser() as ProfileStruct;

    let peer = await setupTestPeer() as ProfileStruct;

    console.log(
        'user',user,
        'peer',peer
    );

    return {
        user,
        peer
    };

}

//authorize client 1 and 2 to each other
export async function authPeerForUser(
    user:ProfileStruct=testuser,
    peer:ProfileStruct=testpeer
) {
    let userauth = await client.authorizeUser(
        user,
        user._id,
        undefined, //grab name automatically
        peer._id,
        undefined, //grab name automatically
        ['peer']
    )

    console.log(user._id)

    let peerauth = await client2.authorizeUser(
        peer,
        user._id,
        undefined, //grab name automatically
        peer._id,
        undefined, //grab name automatically
        ['peer']
    )

    console.log(
        'user-owned auth:',
        userauth,
        '\npeer-owned auth:',
        peerauth
    );

    console.log('auths', userauth, peerauth);

    return {userauth,peerauth};
}


//setup test data
// export function setupTestData(
//     u:ProfileStruct=testuser,
//     u2:ProfileStruct=testpeer, //user 2 to reference
//     c:StructRouter=client
// ) {
//     //create auths, chats, comments, data, then link stuff
    
// }






//message client 1 to client 2
export async function messagePeerFromUser(
    user:ProfileStruct=testuser,
    peer:ProfileStruct=testpeer
) {
    let chatrooms = client.getLocalData('chatroom');
    let chatroom:any;
    if(chatrooms) {
        if(chatrooms.length > 0) {
            chatroom = chatrooms[0];
        } else {
            chatroom = await client.addChatroom( //this will return a struct with a mongo id key swapped out from the one genearated locally if using mongo
                user,
                user._id,
                'this is the first comment',
                undefined,
                [peer._id],
                true
            );
        }
    } else {
        chatroom = await client.addChatroom( //this will return a struct with a mongo id key swapped out from the one genearated locally if using mongo
            user,
            user._id,
            'this is the first comment',
            undefined,
            [peer._id],
            true
        );
    }

    //let comments = client.getLocalData('comment'); //this will return a struct with a mongo id key swapped out from the one genearated locally if using mongo
    let comment:any, comment2:any;
//    console.log(chatroom);
    if(chatroom) {
        comment = await client.addComment(
            user,
            chatroom,
            chatroom,
            user._id,
            `don't go there girlfrienddd`//,
            //attach some data to link to [data._id]
        );

        setTimeout(async () => {
            comment2 = await client.addComment(
                user, //owner account
                chatroom,
                comment,
                user._id, //who is writing the comment
                `update: you did`//,
                //attach some data to link to [data._id]
            );
        }, 1000); //wait a second so we don' 

    }

    return {chatroom, comment};
}




//resolve notifications on client 2
export async function checkPeerNotifications() {
    let notes = await client2.checkForNotifications(); //grab currentuser notifications if id not specified
    console.log('notifications' ,notes)
    if(notes) return await client2.resolveNotifications(notes);
    return undefined;
}


//reply to client 1 from client 2
export async function replyToUserFromPeer(
    peer:ProfileStruct=testpeer,
    chatroom:ChatroomStruct,
    replyTo:ChatroomStruct|CommentStruct
) {
    
    let comment = await client.addComment(
        peer,
        chatroom,
        replyTo,
        peer._id,
        `oh I went there`//,
        //attach some data to link to [data._id]
    );

    //console.log('new comment', comment);

    return comment;
}



//resolve notifications on client 1
export async function checkUserNotifications() {
    let notes = await client.checkForNotifications(); //grab currentuser notifications if id not specified
    console.log('\n\n\nnotes', JSON.stringify(notes),'\n\n\n');
    if(notes) return await client.resolveNotifications(notes)
    return undefined;
}



//reject authorization on client 1
export async function rejectUserAuthToPeer(userauth:AuthorizationStruct) {
    if(userauth) return await client.deleteAuthorization(userauth._id);
}



//create a group to proxy authorization authority for groups of peers with access
export async function createPeerGroup(user:ProfileStruct=testuser,peer:ProfileStruct=testpeer) {
    let group = await client2.addGroup(
        peer,
        'testgroup'+Math.floor(Math.random()*100000000),
        'this is a test',
        [peer._id],
        [peer._id],
        [user._id],
        true
    );

    console.log('new group', group)

    return group;
}




//group authorizations
export async function authPeerToUserViaGroup() {
    await client.setAuthorizationsByGroup();
    await client2.setAuthorizationsByGroup();
    return;
}



//test admin control of client 2 for client 1 
export async function givePeerControlOfUser(
    user:ProfileStruct=testuser,
    peer:ProfileStruct=testpeer
) {
    let userauth = await client.authorizeUser(
        user,
        user._id,
        undefined, //grab name automatically
        peer._id,
        undefined, //grab name automatically
        ['admincontrol']
    )

    let peerauth = await client2.authorizeUser(
        peer,
        user._id,
        undefined, //grab name automatically
        peer._id,
        undefined, //grab name automatically
        ['admincontrol']
    )

    console.log(
        'user-owned auth:',
        userauth,
        '\npeer-owned auth:',
        peerauth
    );

    return {userauth,peerauth};
}



export async function testAlert() {

    //set a watch on the ppg data,
    // push to the breaths with the breatharr

    //dummyppg should throw an alert
    function runSequence(i=0) {
        i++;
        //update the local struct data
        //check if an alert needs to be thrown
        if(i < breatharr.length) {
                setTimeout(()=>{
                    runSequence(i)
                },1000);
        }
    }

    runSequence();
}   