import { ProfileStruct } from 'brainsatplay-data/dist/src/types';
import React, {Component} from 'react'
import { client } from 'src/tools/scripts/client';
import { randomId } from 'src/tools/scripts/utils';


//card to authorize another user or a group, select permissions etc.
// should set up a way to invite users over email/phone with set permissions e.g. admin control

type CProps = {

}

export class Auth extends Component<CProps> {

    id=randomId('permissions')

    onclicked = () => {
        let uid = (document.getElementById(this.id+'userid') as HTMLInputElement).value;
        let name = (document.getElementById(this.id+'name') as HTMLInputElement).value;
        let perms = (document.getElementById(this.id+'perms') as HTMLSelectElement);
        let pval = perms.options[perms.selectedIndex].value;
        let typ = (document.getElementById(this.id+'peers') as HTMLSelectElement);
        let tval = typ.options[typ.selectedIndex].value;
        
        if(tval === 'granting') { 
            client.authorizeUser(
                client.currentUser,
                client.currentUser._id,
                'me',
                uid,
                name,
                [perms]
            );
        } else if (tval === 'asking') {
            client.authorizeUser(
                client.currentUser,
                uid, //swap these positions for granter --> grantee structure
                name,
                client.currentUser._id,
                'me',
                [pval]
            );
        }
    }

    render() {
        return(
        <div style={{height:400, border:'1px solid black', borderRadius:5 }}>
            Groups and Authorizations
            <br/>
            User Id or Email<br/>
            <input id={this.id+'userid'} type='text' placeholder='example@example.com'></input>
            Name<br/>
            <input id={this.id+'name'} type='text' placeholder='example@example.com'></input>
            <br/>
            Permssions:<br/>
            <select id={this.id+'perms'}>
                <option value='peer' selected>Peer (read/write/chat)</option>
                <option value='control'>Admin (hand over control)</option>
            </select>
            <br/>
            Asking or Granting?<br/>
            <select id={this.id+'peers'}>
                <option value='asking' selected>Asking (get access)</option>
                <option value='granting'>Granting (give access)</option>
            </select>
            <br/>
            <button id={this.id+'submit'} onClick={this.onclicked}>Submit</button>
        </div>
        )
    }
}