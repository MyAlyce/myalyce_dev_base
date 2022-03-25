import React from 'react'
import { sComponent } from '../templates/state.component';
import { randomId } from 'src/tools/scripts/utils';
import { Button } from 'react-bootstrap';
import { Avatar } from 'my-alyce-component-lib'
import { client } from 'src/tools/scripts/client';
import { state } from 'src/tools/scripts/state'
import { EditableText } from '../boilerplate/editabletext.component';

//editable profile card for the current user. 
export class ProfileCard extends sComponent {

    id=randomId('profilecard')

    nClicks=0

    state = {
        loggedInId: undefined,
        viewingId: undefined
    }

    constructor(props={
        state:state,
        editable:false,
    }) {
        super(props);
    }

    openChat(){}

    makeVideoCall(){}

    viewQuestions(){}

    viewLiveFeed(){}

    avatarClicked() {
        this.nClicks++;
        setTimeout(()=>{this.nClicks = 0},300);
        if(this.nClicks > 1) {
            //create file input, run compressorjs
        }
    }

    render() {
        return(
            <table>
                <tr>
                    <td width='15%'>
                        <Avatar
                            dataState='done'
                            imgSrc='src/assets/person.png'
                            size='md'
                            status='online'
                            onClick={this.avatarClicked}
                        />
                    </td>
                    <td width="50%">
                        <EditableText 
                            text={client.currentUser.firstName}
                        />  
                        <EditableText 
                            text={client.currentUser.lastName}
                        />
                        <br/>
                        👤:
                        <EditableText 
                            text={client.currentUser.username}
                        />
                        <br/>
                        <Button>📧</Button>:
                        <EditableText 
                            text={client.currentUser.email}
                        />
                        <br/>
                        <Button>📞</Button>:
                        <EditableText 
                            text={client.currentUser.phone}
                        />
                    </td>
                    <td width="35%" valign='middle' align='center'>
                        <span>
                            <Button onClick={this.openChat}>💬</Button>
                            <Button onClick={this.makeVideoCall}>🖥️</Button>
                            <Button onClick={this.viewQuestions}>❓</Button>
                            <Button onClick={this.viewLiveFeed}>📡</Button>
                        </span>
                    </td>
                </tr>
            </table>
        )
    }
}


/**
 * < profile card div 
 *     editable: state.viewingId === state.loggedInId || loggedInId is authorized as admin
 * <
 *  Profile Image
 * > onHover: < form image select icon > 
 *       onClicked: < upload image, run compressorjs to cap image sizes, setUser with data.image as the final image >
 * 
 * <  editable blok
 *  FirstName
 * >
 * < 
 *  LastName
 * >
 * 
 */


/***
 * bootstrappy stuff
 * 
 * <Form>
    <FloatingLabel
        controlId="floatingInput"
        label="FirstName"
        className="mb-3"
    >
        <Form.Control type="text" placeholder="Captain"/>
    </FloatingLabel>
    <FloatingLabel controlId="floatingPassword" label="LastName">
        <Form.Control type="text" placeholder="Anonymous" />
    </FloatingLabel>
</Form>
 * 
 */