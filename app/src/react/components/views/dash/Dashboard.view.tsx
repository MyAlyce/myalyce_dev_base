import React, { Component } from 'react';
//see the Figma: https://www.figma.com/file/PFs4wWMt7IZdMm7Dlt9MDz/MyAlyce-Web-Front-End?node-id=0%3A1
interface P {}

export class DashContainer extends Component<P>  {

    render() {
        return (
        <div>
            <div style={{height:200, border:'1px solid black', borderRadius:5 }}>
                User Card + Summary
            </div>
            <div style={{height:300, border:'1px solid black', borderRadius:5 }}>
                Selectable summary tiles 
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