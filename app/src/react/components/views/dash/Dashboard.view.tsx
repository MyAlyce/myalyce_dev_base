import React from 'react';
import { sComponent } from '../../templates/state.component';
import { CategoriesCard } from '../../user/categories.component';
import { ProfileCard } from '../../user/profile.component';
//see the Figma: https://www.figma.com/file/PFs4wWMt7IZdMm7Dlt9MDz/MyAlyce-Web-Front-End?node-id=0%3A1


export class DashContainer extends sComponent  {

    state = {
        viewingId:undefined,
        loggedInId:undefined
    }

    render() {
        return (
        <div>
            <div style={{height:200, border:'1px solid black', borderRadius:5 }}>
                <ProfileCard
                    editable={(this.state.loggedInId === this.state.viewingId)}
                />
            </div>
            <div style={{height:300, border:'1px solid black', borderRadius:5 }}>
                <CategoriesCard/>
            </div>
            <div style={{height:300, border:'1px solid black', borderRadius:5 }}>
                Descending or popup scrollview of selected timelines/details/summaries.
                <br/><br/>
                E.g. Sleep timeline adjacent to events, and chart
             
            </div>
        </div>
        );
    }
}


/*
<image> <profile info> 


*/