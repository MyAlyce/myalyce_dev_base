import React from 'react'
import { sComponent } from '../templates/state.component';
import { randomId } from 'src/tools/scripts/utils';
import { client } from 'src/tools/scripts/client';
import { state } from 'src/tools/scripts/state'
import { NotificationStruct, Struct } from 'brainsatplay-data/dist/src/types';

//view the data categories for the user in view  
export class CategoriesCard extends sComponent {

    id=randomId('summarycard')

    state = {
        loggedInId: undefined,
        viewingId: undefined
    }

    //TODO: tie category settings to user.data 
    defaultCategories = [
        'physical',
        'mental',
        'social',
        'medication',
        'sleep',
        'nutrition',
        'exercise',
    ];

    categoryNewData:any = {
        
    }

    componentDidMount() {

    }

    //pull data notifications and push to the notifications list
    async getCategoryNotifications() {
        //get the latest notifications for this user
        let notifications = client.getLocalData('notification', {ownerId:client.currentUser._id, parentUserId:this.state.viewingId}) as NotificationStruct[];
        //pull the data from the notifications without resolving so they can fall into the categories
        let ids:(string|number)[] = [];
        notifications.forEach((n) => {
            if(n.parent?.structType === 'data' || n.parent?.structType === 'event') //data and event notifications
                ids.push(n.parent._id);
        });
        //resolve particular notifications only when clicking a particular category to check the latest data in that category
        let data = await client.getDataByIds(ids,this.state.viewingId); 

        //
        data.forEach((struct:Struct) => {
            let categories = [];
            Object.keys(client.tablet.data).forEach((key) => {
                if((client.tablet.data as any)[key]?.[struct.timestamp as number]) {
                    categories.push(key);
                    if(!this.categoryNewData[key]) this.categoryNewData[key] = [struct];
                    else this.categoryNewData[key].push(struct);
                }
            });
        });


    }

    categoryClicked(catname:string) {
        //open a view of just a summary of the related data where you can explore specific structs, 
        // click again to jump to full data view

        //resolve notifications for the data category page. Will pull everything again since we are just pulling the latest data first

        //latest data should be available in a preview or quick view or something because it's there already
    }

    render() {
        return ( 
            <div id={this.id+'table'}>
                {this.defaultCategories.map((catname) => { //each category is an icon with an image + title of the category and then the number of updates
                    return (
                        <div onClick={()=>{this.categoryClicked(catname)}} className='category'>
                            <span><div>Category Image</div><div>{catname}</div><div>{this.categoryNewData[catname].length}</div></span>
                        </div>
                    ); //clicking a category will pop up the quick view (and resolve those notifications) and then clicking again will open the full view
                })}
            </div>
        );
    }

}

