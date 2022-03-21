import { AuthorizationStruct } from 'brainsatplay-data/dist/src/types';
import React, {Component} from 'react'
import { client } from 'src/tools/scripts/client';
import { randomId } from 'src/tools/scripts/utils';


//card to view your connected peers by authorization, see status with latest data
// 


type CProps = {

}

export class Peers extends Component<CProps> {

    id=randomId('peers')

    async componentDidMount() {
        let auths = await client.getAuthorizations(); //get own auths
        //console.log(client,auths)
        let authtable = document.getElementById(this.id+'auths');

        if(auths)
            auths.forEach((a:AuthorizationStruct) => { //should insert a user card and pull notification summaries for each user
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
        return(
            <div style={{height:600, border:'1px solid black', borderRadius:5 }}>
                Summaries of Connected Peers
                <table id={this.id+'auths'}>

                </table>
            </div>
        )
    }
}