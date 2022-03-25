import { ProfileStruct } from 'brainsatplay-data/dist/src/types';
import React from 'react';
import { client } from 'src/tools/scripts/client';
import { authorizeRedirect } from 'src/tools/scripts/fitbit';
import { sComponent } from '../../templates/state.component';

export class SettingsView extends sComponent  {

    state = {
        viewingId: undefined
    }

    setupFitbit() {
        authorizeRedirect();
    }

    render() {

        let viewing = client.getLocalData('profile',{_id:this.state.viewingId}) as ProfileStruct;

        let fbreg = false;
        if((viewing?.data as any)?.fitbit?.access_token) {
            fbreg = true;
        }

        return (
        <div>
            <div>
                Profile Deets + Editing
            </div>
            <div>
                More fine grained permissions and opt-in stuff<br/>
                <span>Register Fitbit: <button onClick={this.setupFitbit}></button></span>
                <div>Fitbit Registered: {fbreg}</div>
            </div>
        </div>
        );
    }
}