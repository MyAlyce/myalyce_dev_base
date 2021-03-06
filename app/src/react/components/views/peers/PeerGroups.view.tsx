import React from 'react';

import { randomId } from 'src/tools/scripts/utils';
import { AuthorizationStruct, ProfileStruct } from 'brainsatplay-data/dist/src/types';
import { sComponent } from 'src/react/components/templates/state.component';
import { client } from 'src/tools/scripts/client';

//Dovy.... see the figma: https://www.figma.com/file/PFs4wWMt7IZdMm7Dlt9MDz/MyAlyce-Web-Front-End?node-id=0%3A1

export class AuthList extends sComponent {

    id=randomId('permissions')

    async componentDidMount() {
        let auths = await client.getAuthorizations(); //get own auths
        //console.log(client,auths)
        let authtable = document.getElementById(this.id+'auths');

        if(auths)
            auths.forEach((a:AuthorizationStruct) => {
                authtable?.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td>Permissions: ${Object.keys(a.authorizations).map((key)=>{
                            return `${key}:${(a.authorizations as any)[key]}`; //return true authorizations
                        })}</td>
                        <td>Authorized: ${a.authorizedName}</td>
                        <td>Authorizer: ${a.authorizerName}</td>
                        <td>Status: ${a.status}</td>
                    </tr>`
                );
            });
    }



    render() {
        return (
        <div>
            <div style={{height:600, border:'1px solid black', borderRadius:5 }}>
                Summaries of Connected Peers
                <table id={this.id+'auths'}>

                </table>
            </div>
        </div>
        );
    }
}