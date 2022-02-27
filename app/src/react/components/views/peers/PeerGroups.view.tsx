import { randomId } from 'src/scripts/utils';
import { AuthorizationStruct, ProfileStruct } from 'brainsatplay-data/dist/src/types';
import { sComponent } from 'src/react/components/templates/state.component';
import { client } from 'src/scripts/client';
import React from 'react';


//Dovy.... see the figma: https://www.figma.com/file/PFs4wWMt7IZdMm7Dlt9MDz/MyAlyce-Web-Front-End?node-id=0%3A1

export class PeerGroupsContainer extends sComponent {

    id=randomId('permissions')

    async componentDidMount() {
        let auths = await client.getAuthorizations(); //get own auths
        console.log(client,auths)
        let authtable = document.getElementById(this.id+'auths');

        if(auths)
            auths.forEach((a:AuthorizationStruct) => {
                authtable?.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td>Permissions: ${a.authorizations.join(',')}</td>
                        <td>Authorized: ${a.authorizedName}</td>
                        <td>Authorizer: ${a.authorizerName}</td>
                        <td>Status: ${a.status}</td>
                    </tr>`
                );
            });
    }

    onclicked = () => {
        let uid = (document.getElementById(this.id+'userid') as HTMLInputElement).value;
        let name = (document.getElementById(this.id+'name') as HTMLInputElement).value;
        let perms = (document.getElementById(this.id+'perms') as HTMLSelectElement);
        let pval = perms.options[perms.selectedIndex].value;
        let typ = (document.getElementById(this.id+'peers') as HTMLSelectElement);
        let tval = typ.options[typ.selectedIndex].value;
        
        if(tval === 'granting') { 
            client.authorizeUser(
                (client.currentUser as ProfileStruct),
                client.currentUser._id,
                'me',
                uid,
                name,
                [perms]
            );
        } else if (tval === 'asking') {
            client.authorizeUser(
                (client.currentUser as ProfileStruct),
                uid, //swap these positions for granter --> grantee structure
                name,
                client.currentUser._id,
                'me',
                [pval]
            );
        }
    }

    render() {
        return (
        <div>
            <div style={{height:300, border:'1px solid black', borderRadius:5 }}>
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
                <button id={this.id+'submit'}>Submit</button>
            </div>
            <div onClick={this.onclicked} style={{height:600, border:'1px solid black', borderRadius:5 }}>
                Summaries of Connected Peers
                <table id={this.id+'auths'}>

                </table>
            </div>
        </div>
        );
    }
}