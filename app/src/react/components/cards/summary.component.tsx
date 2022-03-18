import React from 'react'
import { sComponent } from '../templates/state.component';
import { randomId } from 'src/tools/scripts/utils';
import { client } from 'src/tools/scripts/client';
import { state } from 'src/tools/scripts/state'
import { NotificationStruct } from 'brainsatplay-data/dist/src/types';

//editable profile card
export class SummaryCard extends sComponent {

    id=randomId('summarycard')

    state = {
        loggedInId: undefined,
        viewingId: undefined
    }

    componentDidMount() {
        //TODO: tie category settings to user data 
        let defaultCategories = [
            'physical',
            'mental',
            'social',
            'medication',
            'sleep',
            'nutrition',
            'exercise',
        ];
    }

    getCategoryNotifications() {
        //get the latest notifications for this user
        let notifications = client.getLocalData('notification', {ownerId:client.currentUser._id}) as NotificationStruct[];
        //pull the data from the notifications without resolving so they can fall into the categories
        
        //resolve particular notifications when clicking a particular category

        //


    }

    categoryClicked() {

    }

    render() {
        return ( 
            <table id={this.id+'table'}>
            </table>
        );
    }

}