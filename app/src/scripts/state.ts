import {StateManager} from 'anotherstatemanager' //state
import {bfs} from 'brainsatplay-storage' //local storage via indexeddb
import { UserObject } from '../../../liveserver/src/services/database/dist/common/general.types';


//only pass jsonifiable stuff to this state
export const state = new StateManager({
    route: '/',          //current pathname
    isLoggedIn: false,
    appInitialized: false,
    loggedInId: undefined
});

//subscribe(key, onchange)
//subscribeTrigger(key, onchange)
//subscribeSequential(key, onchange)






//should subscribe to the state then restore session to setup the app
export async function restoreSession(u:Partial<UserObject>|undefined,filename='state.json') {
    //make sure the indexeddb directory is initialized

    await bfs.initFS(['data']);

    await bfs.dirExists(bfs.fs, 'data');

    let exists = await new Promise(resolve => {
        bfs.fs.exists('/data/'+filename,(exists:boolean) => {
            resolve(exists);
        })
    });

    let read;
    if(exists) {
        read = await bfs.readFileAsText(
            'state.json',
            'data'
        )
        try {
            let restored = JSON.parse(read);
            if(typeof restored === 'object') {
                if(restored.loggedInId && restored.loggedInId === u._id || !restored.loggedInId) 
                    state.setState(restored);
            }
        } catch (err) {
            console.error(err);
        }
    }
      
    //read initial data, now setup subscription to save the state every time it updates
    state.subscribe('state', (updated:any) => {
        bfs.writeFile(
            'state.json',
            JSON.stringify(updated),
            'data'
        );
    });

    return read;

}

//subscribe            //framerate updates (can mutate the object directly but setState is preferred)
//subscribeTrigger     //onchange updates (only if using setState)
//subscribeSequential  //fire for all changes but on frame e.g. for button input checks