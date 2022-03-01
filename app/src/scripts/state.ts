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

//subscribe to the state so any and all changes are saved, can store multiple states (e.g. particular for pages or components)
export function backupState(filename='state.json',statemanager=state){
    //read initial data, now setup subscription to save the state every time it updates
    statemanager.subscribe('state', (updated:any) => {
        bfs.writeFile(
            filename,
            JSON.stringify(updated),
            'data'
        );
    });
}



//should subscribe to the state then restore session to setup the app
export async function restoreSession(
    u:Partial<UserObject>|undefined,
    filename='state.json', //state file
    statemanager=state //state to restore to and set up automatic backups for
) {
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
                    statemanager.setState(restored);
            }
        } catch (err) {
            console.error(err);
        }
    }
      
    backupState(filename,statemanager);

    return read;

}

//subscribe            //framerate updates (can mutate the object directly but setState is preferred)
//subscribeTrigger     //onchange updates (only if using setState)
//subscribeSequential  //fire for all changes but on frame e.g. for button input checks